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
    WHERE table_name = 'stories' AND column_name = 'is_public'
  ) THEN
    ALTER TABLE stories ADD COLUMN is_public BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

UPDATE stories SET is_public = TRUE WHERE is_public IS NULL;

CREATE TABLE IF NOT EXISTS verification_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(20) NOT NULL,
  code VARCHAR(6) NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verification_codes_phone ON verification_codes(phone);
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires ON verification_codes(expires_at);
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
