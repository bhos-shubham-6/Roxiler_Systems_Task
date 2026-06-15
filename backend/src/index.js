require('dotenv').config({ override: true });
const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./db/init');

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const storeRoutes = require('./routes/stores');
const storeOwnerRoutes = require('./routes/storeOwner');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/store-owner', storeOwnerRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

async function start() {
  try {
    await initDatabase({ closeAfter: false });
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    if (process.env.DB_MODE === 'mysql') {
      console.error('\nMySQL connection failed. Check backend/.env:');
      console.error('  MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE');
      if (err.code === 'ER_ACCESS_DENIED_ERROR') {
        console.error('  -> Wrong MySQL username or password');
      } else if (err.code === 'ECONNREFUSED') {
        console.error('  -> MySQL server is not running on that port');
      }
    }
    console.error('Failed to start server:', err.message || err);
    process.exit(1);
  }
}

start();
