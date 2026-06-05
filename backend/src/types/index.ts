// ===== 用户相关 =====

export interface User {
  id: string;
  anonymous_id: string;
  created_at: Date;
}

// ===== 故事相关 =====

export type StoryStyle = '古风' | '科幻' | '悬疑' | '言情' | '职场' | '无限流' | '末日';
export type StoryStatus = 'ongoing' | 'completed' | 'abandoned';

export interface Story {
  id: string;
  title: string;
  setting: string;
  style: StoryStyle;
  cover_url?: string;
  author_id: string;
  status: StoryStatus;
  likes_count: number;
  favorites_count: number;
  reads_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface StoryWithChapters extends Story {
  chapters: Chapter[];
}

// ===== 章节相关 =====

export interface Chapter {
  id: string;
  story_id: string;
  sequence: number;
  title: string;
  content: string;
  choices: ChoiceOption[];
  world_state: WorldState;
  created_at: Date;
}

export interface ChoiceOption {
  id: string;
  text: string;
}

export interface ChoiceRecord {
  id: string;
  chapter_id: string;
  user_id: string;
  choice_index: number;
  created_at: Date;
}

// ===== 世界状态 =====

export interface WorldState {
  characters: CharacterState[];
  keyEvents: string[];
  currentScene: string;
  atmosphere: string;
}

export interface CharacterState {
  name: string;
  relationship: string;
  status: string;
}

// ===== 点赞/收藏 =====

export interface Like {
  id: string;
  story_id: string;
  user_id: string;
  created_at: Date;
}

export interface Favorite {
  id: string;
  story_id: string;
  user_id: string;
  created_at: Date;
}

// ===== 分享 =====

export interface ShareLink {
  id: string;
  code: string;
  story_id: string;
  chapter_id?: string;
  created_at: Date;
}

// ===== 反馈 =====

export type FeedbackType = 'bug' | 'feature' | 'experience' | 'other';
export type FeedbackStatus = 'open' | 'reviewing' | 'accepted' | 'rejected' | 'resolved';

export interface DeviceInfo {
  userAgent?: string;
  platform?: string;
  language?: string;
  screen?: {
    width: number;
    height: number;
  };
}

export interface Feedback {
  id: string;
  user_id?: string;
  type: FeedbackType;
  content: string;
  screenshot?: string;
  page_path?: string;
  device_info?: DeviceInfo;
  status: FeedbackStatus;
  created_at: Date;
}

// ===== API 响应格式 =====

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
  };
}

// ===== AI 生成相关 =====

export interface GenerateChapterRequest {
  storyId: string;
  previousChapterId?: string;
  userChoice?: number;
}

export interface GenerateChapterResponse {
  chapter: Chapter;
}

export interface CreateStoryRequest {
  title: string;
  setting: string;
  style: StoryStyle;
}

export interface StoryListQuery {
  page?: number;
  pageSize?: number;
  category?: string;
  sort?: 'hot' | 'latest' | 'favorites';
}
