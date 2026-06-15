const { query, closePool, dbMode, initMysqlPool } = require('./pool');
const bcrypt = require('bcryptjs');

const postgresStatements = [
  `CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(60) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    address VARCHAR(400) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'user', 'store_owner')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS stores (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    address VARCHAR(400) NOT NULL,
    owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS ratings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, store_id)
  )`,
  'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
  'CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)',
  'CREATE INDEX IF NOT EXISTS idx_stores_owner ON stores(owner_id)',
  'CREATE INDEX IF NOT EXISTS idx_ratings_store ON ratings(store_id)',
  'CREATE INDEX IF NOT EXISTS idx_ratings_user ON ratings(user_id)',
];

const mysqlStatements = [
  `CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(60) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    address VARCHAR(400) NOT NULL,
    role ENUM('admin', 'user', 'store_owner') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS stores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    address VARCHAR(400) NOT NULL,
    owner_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_stores_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL
  )`,
  `CREATE TABLE IF NOT EXISTS ratings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    store_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_user_store (user_id, store_id),
    CONSTRAINT fk_ratings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_ratings_store FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
  )`,
  'CREATE INDEX idx_users_email ON users(email)',
  'CREATE INDEX idx_users_role ON users(role)',
  'CREATE INDEX idx_stores_owner ON stores(owner_id)',
  'CREATE INDEX idx_ratings_store ON ratings(store_id)',
  'CREATE INDEX idx_ratings_user ON ratings(user_id)',
];

async function initDatabase({ closeAfter = true } = {}) {
  if (dbMode === 'mysql') {
    await initMysqlPool();
  }

  const statements = dbMode === 'mysql' ? mysqlStatements : postgresStatements;
  for (const sql of statements) {
    try {
      await query(sql);
    } catch (err) {
      // MySQL may error if index already exists on restart
      if (dbMode === 'mysql' && err.code === 'ER_DUP_KEYNAME') continue;
      throw err;
    }
  }

  const adminEmail = 'admin@roxiler.com';
  const existing = await query('SELECT id FROM users WHERE email = $1', [adminEmail]);

  if (existing.rows.length === 0) {
    const hashedPassword = await bcrypt.hash('Admin@123', 10);
    await query(
      `INSERT INTO users (name, email, password, address, role)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        'System Administrator Account',
        adminEmail,
        hashedPassword,
        '123 Admin Street, System City, Country',
        'admin',
      ]
    );
    console.log('Default admin created: admin@roxiler.com / Admin@123');
  }

  console.log('Database initialized successfully.');

  if (closeAfter) {
    await closePool();
  }
}

if (require.main === module) {
  initDatabase().catch((err) => {
    console.error('Database initialization failed:', err);
    process.exit(1);
  });
}

module.exports = { initDatabase };
