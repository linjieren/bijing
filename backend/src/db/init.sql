-- 笔境互动网文平台数据库初始化脚本
-- 执行: psql $DATABASE_URL -f src/db/init.sql

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===== 用户表 =====
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  anonymous_id VARCHAR(64) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_anonymous_id ON users(anonymous_id);

-- ===== 故事表 =====
CREATE TABLE IF NOT EXISTS stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  setting TEXT NOT NULL,
  style VARCHAR(32) NOT NULL CHECK (style IN ('古风', '科幻', '悬疑', '言情', '职场', '无限流', '末日')),
  cover_url TEXT,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(32) DEFAULT 'ongoing' CHECK (status IN ('ongoing', 'completed', 'abandoned')),
  likes_count INTEGER DEFAULT 0,
  favorites_count INTEGER DEFAULT 0,
  reads_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stories_author_id ON stories(author_id);
CREATE INDEX IF NOT EXISTS idx_stories_status ON stories(status);
CREATE INDEX IF NOT EXISTS idx_stories_style ON stories(style);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON stories(created_at DESC);

-- ===== 章节表 =====
CREATE TABLE IF NOT EXISTS chapters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  sequence INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  choices JSONB NOT NULL DEFAULT '[]',
  world_state JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chapters_story_id ON chapters(story_id);
CREATE INDEX IF NOT EXISTS idx_chapters_sequence ON chapters(story_id, sequence);

-- ===== 选择记录表 =====
CREATE TABLE IF NOT EXISTS choices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  choice_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_choices_chapter_id ON choices(chapter_id);
CREATE INDEX IF NOT EXISTS idx_choices_user_id ON choices(user_id);

-- ===== 点赞表 =====
CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(story_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_likes_story_id ON likes(story_id);

-- ===== 收藏表 =====
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(story_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_story_id ON favorites(story_id);

-- ===== 分享链接表 =====
CREATE TABLE IF NOT EXISTS share_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(12) UNIQUE NOT NULL,
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES chapters(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_share_links_code ON share_links(code);
CREATE INDEX IF NOT EXISTS idx_share_links_story_id ON share_links(story_id);

-- ===== 反馈表 =====
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  type VARCHAR(32) NOT NULL CHECK (type IN ('bug', 'feature', 'experience', 'other')),
  content TEXT NOT NULL,
  screenshot TEXT,
  page_path TEXT,
  device_info JSONB DEFAULT '{}',
  status VARCHAR(32) DEFAULT 'open' CHECK (status IN ('open', 'reviewing', 'accepted', 'rejected', 'resolved')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback(type);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);

-- ===== 更新触发器：自动更新 stories.updated_at =====
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_stories_updated_at ON stories;
CREATE TRIGGER update_stories_updated_at
  BEFORE UPDATE ON stories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
