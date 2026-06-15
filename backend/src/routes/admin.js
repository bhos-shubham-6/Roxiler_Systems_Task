const express = require('express');
const bcrypt = require('bcryptjs');
const { query } = require('../db/pool');
const { authenticate, authorize } = require('../middleware/auth');
const {
  handleValidation,
  nameValidation,
  emailValidation,
  addressValidation,
  passwordValidation,
  roleValidation,
  sortQueryValidation,
  filterQueryValidation,
} = require('../validators');
const { buildListQuery } = require('../utils/queryBuilder');

const router = express.Router();

router.use(authenticate, authorize('admin'));

router.get('/dashboard', async (req, res) => {
  try {
    const [users, stores, ratings] = await Promise.all([
      query('SELECT COUNT(*) AS count FROM users'),
      query('SELECT COUNT(*) AS count FROM stores'),
      query('SELECT COUNT(*) AS count FROM ratings'),
    ]);

    res.json({
      totalUsers: users.rows[0].count,
      totalStores: stores.rows[0].count,
      totalRatings: ratings.rows[0].count,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post(
  '/users',
  [
    nameValidation,
    emailValidation,
    addressValidation,
    passwordValidation,
    roleValidation,
    handleValidation,
  ],
  async (req, res) => {
    const { name, email, address, password, role } = req.body;
    try {
      const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
      if (existing.rows.length > 0) {
        return res.status(409).json({ message: 'Email already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      await query(
        `INSERT INTO users (name, email, password, address, role)
         VALUES ($1, $2, $3, $4, $5)`,
        [name, email, hashedPassword, address, role]
      );
      const created = await query(
        'SELECT id, name, email, address, role, created_at FROM users WHERE email = $1',
        [email]
      );
      res.status(201).json(created.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

router.get(
  '/users',
  [...sortQueryValidation, ...filterQueryValidation, handleValidation],
  async (req, res) => {
    const { sortBy = 'name', sortOrder = 'asc', name, email, address, role } = req.query;
    try {
      const { sql, params } = buildListQuery({
        baseQuery: 'SELECT id, name, email, address, role, created_at FROM users',
        filters: { name, email, address, role },
        sortBy,
        sortOrder,
        allowedSort: ['name', 'email', 'address', 'role', 'created_at'],
      });

      const result = await query(sql, params);
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

router.get('/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query(
      'SELECT id, name, email, address, role, created_at FROM users WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = result.rows[0];

    if (user.role === 'store_owner') {
      const storeResult = await query(
        `SELECT s.id, s.name,
          COALESCE(ROUND(AVG(r.rating), 2), 0) AS average_rating
         FROM stores s
         LEFT JOIN ratings r ON r.store_id = s.id
         WHERE s.owner_id = $1
         GROUP BY s.id, s.name`,
        [id]
      );
      user.stores = storeResult.rows;
      user.averageRating = storeResult.rows.length > 0
        ? storeResult.rows.reduce((sum, s) => sum + parseFloat(s.average_rating), 0) / storeResult.rows.length
        : 0;
    }

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post(
  '/stores',
  [nameValidation, emailValidation, addressValidation, handleValidation],
  async (req, res) => {
    const { name, email, address, ownerId } = req.body;
    try {
      const existing = await query('SELECT id FROM stores WHERE email = $1', [email]);
      if (existing.rows.length > 0) {
        return res.status(409).json({ message: 'Store email already exists' });
      }

      if (ownerId) {
        const owner = await query(
          "SELECT id FROM users WHERE id = $1 AND role = 'store_owner'",
          [ownerId]
        );
        if (owner.rows.length === 0) {
          return res.status(400).json({ message: 'Invalid store owner' });
        }
      }

      await query(
        `INSERT INTO stores (name, email, address, owner_id)
         VALUES ($1, $2, $3, $4)`,
        [name, email, address, ownerId || null]
      );
      const created = await query(
        'SELECT id, name, email, address, owner_id, created_at FROM stores WHERE email = $1',
        [email]
      );
      res.status(201).json(created.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

router.get(
  '/stores',
  [...sortQueryValidation, ...filterQueryValidation, handleValidation],
  async (req, res) => {
    const { sortBy = 'name', sortOrder = 'asc', name, email, address } = req.query;
    try {
      let baseQuery = `
        SELECT s.id, s.name, s.email, s.address, s.owner_id,
          COALESCE(ROUND(AVG(r.rating), 2), 0) AS rating
        FROM stores s
        LEFT JOIN ratings r ON r.store_id = s.id
      `;

      const conditions = [];
      const params = [];
      let paramIndex = 1;

      if (name) {
        conditions.push(`LOWER(s.name) LIKE LOWER($${paramIndex++})`);
        params.push(`%${name}%`);
      }
      if (email) {
        conditions.push(`LOWER(s.email) LIKE LOWER($${paramIndex++})`);
        params.push(`%${email}%`);
      }
      if (address) {
        conditions.push(`LOWER(s.address) LIKE LOWER($${paramIndex++})`);
        params.push(`%${address}%`);
      }

      if (conditions.length > 0) {
        baseQuery += ` WHERE ${conditions.join(' AND ')}`;
      }

      baseQuery += ' GROUP BY s.id, s.name, s.email, s.address, s.owner_id, s.created_at';

      const allowedSort = ['name', 'email', 'address', 'rating', 'created_at'];
      const sortField = allowedSort.includes(sortBy) ? sortBy : 'name';
      const order = sortOrder === 'desc' ? 'DESC' : 'ASC';

      const sortColumn = sortField === 'rating' ? 'rating' : `s.${sortField}`;
      baseQuery += ` ORDER BY ${sortColumn} ${order}`;

      const result = await query(baseQuery, params);
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router;
