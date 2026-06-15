require('dotenv').config({ override: true });
const path = require('path');
const fs = require('fs');

const dbMode = process.env.DB_MODE || 'embedded';

let pool;

async function createMysqlPool() {
  const mysql = require('mysql2/promise');
  const config = {
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    waitForConnections: true,
    connectionLimit: 10,
  };
  const database = process.env.MYSQL_DATABASE || 'roxiler_db';

  const bootstrap = await mysql.createConnection(config);
  await bootstrap.query(`CREATE DATABASE IF NOT EXISTS \`${database}\``);
  await bootstrap.end();

  pool = mysql.createPool({ ...config, database });
  console.log(`Using MySQL database at ${config.host}:${config.port}/${database}`);
}

if (dbMode === 'postgres') {
  const { Pool } = require('pg');
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  console.log('Using external PostgreSQL database');
} else if (dbMode === 'mysql') {
  // Pool is created asynchronously in initMysqlPool()
} else {
  const { PGlite } = require('@electric-sql/pglite');
  const dataDir = path.join(__dirname, '../../data/pgdata');
  fs.mkdirSync(dataDir, { recursive: true });
  pool = new PGlite(dataDir);
  console.log('Using embedded PostgreSQL (PGLite) at', dataDir);
}

function convertPostgresPlaceholdersToMysql(sql) {
  return sql.replace(/\$\d+/g, '?');
}

async function initMysqlPool() {
  if (dbMode === 'mysql' && !pool) {
    await createMysqlPool();
  }
}

async function query(sql, params = []) {
  if (dbMode === 'mysql') {
    await initMysqlPool();
    const mysqlSql = convertPostgresPlaceholdersToMysql(sql);
    const [rows] = await pool.execute(mysqlSql, params);
    return { rows, raw: rows };
  }
  return pool.query(sql, params);
}

async function closePool() {
  if (dbMode === 'mysql' && pool && typeof pool.end === 'function') {
    await pool.end();
  } else if (typeof pool?.end === 'function') {
    await pool.end();
  } else if (typeof pool?.close === 'function') {
    await pool.close();
  }
}

module.exports = { pool, query, closePool, dbMode, initMysqlPool };
