-- 迁移：故事长度选择 + 完结机制
-- 执行: psql $DATABASE_URL -f src/db/migration_004_story_length.sql

-- stories 表新增长度相关字段
ALTER TABLE stories
  ADD COLUMN IF NOT EXISTS length_preference VARCHAR(16) CHECK (length_preference IN ('short', 'medium', 'long')),
  ADD COLUMN IF NOT EXISTS max_chapters INTEGER;

-- chapters 表新增 is_finale 标记
ALTER TABLE chapters
  ADD COLUMN IF NOT EXISTS is_finale BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_chapters_finale ON chapters(story_id, is_finale);
