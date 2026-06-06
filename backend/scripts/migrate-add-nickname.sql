-- Migration: add nickname, avatar_color, phone to users table
-- Run: psql $DATABASE_URL -f scripts/migrate-add-nickname.sql

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
