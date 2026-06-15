const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query, dbMode } = require('../db/pool');
const { authenticate } = require('../middleware/auth');
const { body } = require('express-validator');
const {
  handleValidation,
  nameValidation,
  emailValidation,
  addressValidation,
  passwordValidation,
} = require('../validators');

const router = express.Router();

const signToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );

router.post(
  '/register',
  [nameValidation, emailValidation, addressValidation, passwordValidation, handleValidation],
  async (req, res) => {
    const { name, email, address, password } = req.body;
    try {
      const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
      if (existing.rows.length > 0) {
        return res.status(409).json({ message: 'Email already registered' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      await query(
        `INSERT INTO users (name, email, password, address, role)
         VALUES ($1, $2, $3, $4, 'user')`,
        [name, email, hashedPassword, address]
      );
      const result = await query(
        dbMode === 'mysql'
          ? 'SELECT id, name, email, address, role FROM users WHERE email = $1 LIMIT 1'
          : 'SELECT id, name, email, address, role FROM users WHERE email = $1',
        [email]
      );
      const user = result.rows[0];
      const token = signToken(user);
      res.status(201).json({ message: 'Registration successful', token, user });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

router.post(
  '/login',
  [emailValidation, body('password').notEmpty().withMessage('Password is required'), handleValidation],
  async (req, res) => {
    const { email, password } = req.body;
    try {
      const result = await query(
        'SELECT id, name, email, password, address, role FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      const user = result.rows[0];
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      const { password: _, ...safeUser } = user;
      const token = signToken(safeUser);
      res.json({ message: 'Login successful', token, user: safeUser });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

router.put(
  '/password',
  authenticate,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    passwordValidation,
    handleValidation,
  ],
  async (req, res) => {
    const { currentPassword, password } = req.body;
    try {
      const result = await query('SELECT password FROM users WHERE id = $1', [req.user.id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      const isMatch = await bcrypt.compare(currentPassword, result.rows[0].password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      await query(
        'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [hashedPassword, req.user.id]
      );

      res.json({ message: 'Password updated successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

router.get('/me', authenticate, async (req, res) => {
  try {
    const result = await query(
      'SELECT id, name, email, address, role FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
