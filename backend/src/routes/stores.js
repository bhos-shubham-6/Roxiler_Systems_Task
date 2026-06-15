const express = require('express');
const { query } = require('../db/pool');
const { authenticate, authorize } = require('../middleware/auth');
const { handleValidation, ratingValidation, sortQueryValidation } = require('../validators');

const router = express.Router();

router.get(
  '/',
  authenticate,
  authorize('user'),
  [...sortQueryValidation, handleValidation],
  async (req, res) => {
    const { sortBy = 'name', sortOrder = 'asc', name, address } = req.query;
    try {
      let sql = `
        SELECT s.id, s.name, s.address,
          COALESCE(ROUND(AVG(r.rating), 2), 0) AS overall_rating,
          ur.rating AS user_rating
        FROM stores s
        LEFT JOIN ratings r ON r.store_id = s.id
        LEFT JOIN ratings ur ON ur.store_id = s.id AND ur.user_id = $1
      `;

      const params = [req.user.id];
      const conditions = [];
      let paramIndex = 2;

      if (name) {
        conditions.push(`LOWER(s.name) LIKE LOWER($${paramIndex++})`);
        params.push(`%${name}%`);
      }
      if (address) {
        conditions.push(`LOWER(s.address) LIKE LOWER($${paramIndex++})`);
        params.push(`%${address}%`);
      }

      if (conditions.length > 0) {
        sql += ` WHERE ${conditions.join(' AND ')}`;
      }

      sql += ' GROUP BY s.id, s.name, s.address, ur.rating';

      const allowedSort = ['name', 'address', 'overall_rating'];
      const sortField = allowedSort.includes(sortBy) ? sortBy : 'name';
      const order = sortOrder === 'desc' ? 'DESC' : 'ASC';

      const sortColumn =
        sortField === 'overall_rating' ? 'overall_rating' : `s.${sortField}`;
      sql += ` ORDER BY ${sortColumn} ${order}`;

      const result = await query(sql, params);
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

router.post(
  '/:storeId/ratings',
  authenticate,
  authorize('user'),
  [ratingValidation, handleValidation],
  async (req, res) => {
    const { storeId } = req.params;
    const { rating } = req.body;

    try {
      const store = await query('SELECT id FROM stores WHERE id = $1', [storeId]);
      if (store.rows.length === 0) {
        return res.status(404).json({ message: 'Store not found' });
      }

      const existing = await query(
        'SELECT id FROM ratings WHERE user_id = $1 AND store_id = $2',
        [req.user.id, storeId]
      );

      if (existing.rows.length > 0) {
        return res.status(409).json({ message: 'Rating already exists. Use PUT to update.' });
      }

      await query(
        `INSERT INTO ratings (user_id, store_id, rating)
         VALUES ($1, $2, $3)`,
        [req.user.id, storeId, rating]
      );
      const result = await query(
        `SELECT id, store_id, rating, created_at
         FROM ratings
         WHERE user_id = $1 AND store_id = $2`,
        [req.user.id, storeId]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

router.put(
  '/:storeId/ratings',
  authenticate,
  authorize('user'),
  [ratingValidation, handleValidation],
  async (req, res) => {
    const { storeId } = req.params;
    const { rating } = req.body;

    try {
      await query(
        `UPDATE ratings SET rating = $1, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $2 AND store_id = $3`,
        [rating, req.user.id, storeId]
      );
      const result = await query(
        `SELECT id, store_id, rating, updated_at
         FROM ratings
         WHERE user_id = $1 AND store_id = $2`,
        [req.user.id, storeId]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Rating not found' });
      }

      res.json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router;
