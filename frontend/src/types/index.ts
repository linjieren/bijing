// 故事风格
export type StoryGenre =
  | 'ancient'
  | 'scifi'
  | 'suspense'
  | 'romance'
  | 'workplace'
  | 'infinite'
  | 'apocalypse';

export interface StoryGenreConfig {
  key: StoryGenre;
  label: string;
  color: string;
  bgColor: string;
}

// 故事长度
export type StoryLength = 'short' | 'medium' | 'long';

export interface StoryLengthConfig {
  key: StoryLength;
  label: string;
  chapterRange: string;
  minChapters: number;
  maxChapters: number;
}

// 故事
export interface Story {
  id: string;
  title: string;
  summary: string;
  genre: StoryGenre;
  coverImage?: string;
  authorId: string;
  authorName: string;
  authorNickname?: string;
  authorAvatarColor?: string;
  currentChapter: number;
  totalChapters: number;
  maxChapters: number;
  progress: number; // 0-100
  lastUpdatedAt: string;
  createdAt: string;
  status: 'reading' | 'paused' | 'completed';
  likes: number;
  bookmarks: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  isPublic?: boolean;
}

// 章节
export interface Chapter {
  id: string;
  storyId: string;
  chapterNumber: number;
  title: string;
  content: string;
  choices: Choice[];
  isFinale?: boolean;
  createdAt: string;
}

// 选项
export interface Choice {
  id: string;
  text: string;
  nextChapterId?: string;
}

// 世界状态
export interface WorldState {
  storyId: string;
  characters: Character[];
  timeline: TimelineEvent[];
  currentChapter: number;
}

export interface Character {
  id: string;
  name: string;
  description: string;
  relationship: string;
  avatar?: string;
}

export interface TimelineEvent {
  id: string;
  chapterNumber: number;
  event: string;
  timestamp: string;
}

// 阅读进度
export interface ReadingProgress {
  storyId: string;
  currentChapter: number;
  lastReadAt: string;
  choicesMade: Record<number, string>; // chapterNumber -> choiceId
}

// 用户
export interface User {
  id: string;
  name: string;
  avatar?: string;
  phone?: string;
}

// 认证用户
export interface AuthUser {
  id: string;
  nickname: string;
  avatar_color: string;
  phone?: string;
}

export interface UserStats {
  storiesCount: number;
  totalLikesReceived: number;
}

// 热门设定
export interface PromptSuggestion {
  id: string;
  title: string;
  description: string;
  genre: StoryGenre;
}

// 随机设定
export interface RandomPrompt {
  title: string;
  description: string;
  genre: StoryGenre;
}

// 分享链接
export interface ShareLink {
  shortUrl: string;
  code: string;
}

// 反馈
export interface FeedbackItem {
  id: string;
  type: 'bug' | 'feature' | 'experience' | 'other';
  content: string;
  screenshot?: string;
  pagePath?: string;
  createdAt: string;
}
