const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const sql = `
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'nickname'
  ) THEN
    ALTER TABLE users ADD COLUMN nickname VARCHAR(64);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'avatar_color'
  ) THEN
    ALTER TABLE users ADD COLUMN avatar_color VARCHAR(16);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'phone'
  ) THEN
    ALTER TABLE users ADD COLUMN phone VARCHAR(20);
  END IF;
END $$;
`;

pool.query(sql)
  .then(() => {
    console.log('Migration OK');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Migration fail:', err.message);
    process.exit(1);
  })
  .finally(() => pool.end());
