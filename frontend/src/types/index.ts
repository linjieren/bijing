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

// 故事
export interface Story {
  id: string;
  title: string;
  summary: string;
  genre: StoryGenre;
  coverImage?: string;
  authorId: string;
  authorName: string;
  currentChapter: number;
  totalChapters: number;
  progress: number; // 0-100
  lastUpdatedAt: string;
  createdAt: string;
  status: 'reading' | 'paused' | 'completed';
  likes: number;
  bookmarks: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
}

// 章节
export interface Chapter {
  id: string;
  storyId: string;
  chapterNumber: number;
  title: string;
  content: string;
  choices: Choice[];
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
}

// 热门设定
export interface PromptSuggestion {
  id: string;
  title: string;
  description: string;
  genre: StoryGenre;
}

// 反馈
export type FeedbackType = 'bug' | 'feature' | 'experience' | 'other';

export interface Feedback {
  id?: string;
  type: FeedbackType;
  content: string;
  screenshot?: string;
  routePath?: string;
  createdAt?: string;
}
