const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const sql = fs.readFileSync(path.join(__dirname, '../src/db/init.sql'), 'utf-8');

pool.query(sql)
  .then(() => {
    console.log('Database initialized successfully');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Database initialization failed:', err.message);
    process.exit(1);
  });
