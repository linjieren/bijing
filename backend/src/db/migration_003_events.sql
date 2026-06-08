-- Phase 2-ext 迁移：埋点事件表
-- 执行: psql $DATABASE_URL -f src/db/migration_003_events.sql

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type VARCHAR(32) NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  story_id UUID REFERENCES stories(id) ON DELETE SET NULL,
  chapter_id UUID REFERENCES chapters(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_user ON events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_story ON events(story_id, event_type);
