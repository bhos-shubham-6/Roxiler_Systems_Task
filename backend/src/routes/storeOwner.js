const express = require('express');
const { query } = require('../db/pool');
const { authenticate, authorize } = require('../middleware/auth');
const { handleValidation, sortQueryValidation } = require('../validators');

const router = express.Router();

router.use(authenticate, authorize('store_owner'));

router.get('/dashboard', async (req, res) => {
  try {
    const storeResult = await query(
      'SELECT id, name FROM stores WHERE owner_id = $1',
      [req.user.id]
    );

    if (storeResult.rows.length === 0) {
      return res.json({
        store: null,
        averageRating: 0,
        raters: [],
        message: 'No store assigned to this owner',
      });
    }

    const store = storeResult.rows[0];

    const [avgResult, ratersResult] = await Promise.all([
      query(
        `SELECT COALESCE(ROUND(AVG(rating), 2), 0) AS average_rating
         FROM ratings WHERE store_id = $1`,
        [store.id]
      ),
      query(
        `SELECT u.id, u.name, u.email, u.address, r.rating, r.created_at AS rated_at
         FROM ratings r
         JOIN users u ON u.id = r.user_id
         WHERE r.store_id = $1
         ORDER BY r.created_at DESC`,
        [store.id]
      ),
    ]);

    res.json({
      store,
      averageRating: parseFloat(avgResult.rows[0].average_rating),
      raters: ratersResult.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get(
  '/raters',
  [...sortQueryValidation, handleValidation],
  async (req, res) => {
    const { sortBy = 'name', sortOrder = 'asc' } = req.query;
    try {
      const storeResult = await query(
        'SELECT id FROM stores WHERE owner_id = $1',
        [req.user.id]
      );

      if (storeResult.rows.length === 0) {
        return res.json([]);
      }

      const storeId = storeResult.rows[0].id;
      const allowedSort = ['name', 'email', 'address', 'rating', 'rated_at'];
      const sortField = allowedSort.includes(sortBy) ? sortBy : 'name';
      const order = sortOrder === 'desc' ? 'DESC' : 'ASC';

      const sortColumn =
        sortField === 'rated_at' ? 'r.created_at' :
        sortField === 'rating' ? 'r.rating' :
        `u.${sortField}`;

      const result = await query(
        `SELECT u.id, u.name, u.email, u.address, r.rating, r.created_at AS rated_at
         FROM ratings r
         JOIN users u ON u.id = r.user_id
         WHERE r.store_id = $1
         ORDER BY ${sortColumn} ${order}`,
        [storeId]
      );

      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router;
