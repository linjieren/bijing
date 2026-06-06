import type { Story, Chapter, WorldState, StoryGenre } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const GENRE_TO_STYLE: Record<StoryGenre, string> = {
  ancient: '古风',
  scifi: '科幻',
  suspense: '悬疑',
  romance: '言情',
  workplace: '职场',
  infinite: '无限流',
  apocalypse: '末日',
};

const STYLE_TO_GENRE: Record<string, StoryGenre> = {
  '古风': 'ancient',
  '科幻': 'scifi',
  '悬疑': 'suspense',
  '言情': 'romance',
  '职场': 'workplace',
  '无限流': 'infinite',
  '末日': 'apocalypse',
};

function getAnonymousId(): string {
  let id = localStorage.getItem('bijing-anonymous-id');
  if (!id) {
    id = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem('bijing-anonymous-id', id);
  }
  return id;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Anonymous-Id': getAnonymousId(),
      ...options?.headers,
    },
  });

  const json = await res.json();

  if (!json.success) {
    const msg = json.error?.message || `Request failed: ${res.status}`;
    throw new Error(msg);
  }

  return json.data as T;
}

// ===== 故事 API =====

export interface CreateStoryPayload {
  title: string;
  setting: string;
  style: string;
}

export interface BackendStory {
  id: string;
  title: string;
  setting: string;
  style: string;
  author_id: string;
  status: 'ongoing' | 'completed' | 'abandoned';
  likes_count: number;
  favorites_count: number;
  reads_count: number;
  created_at: string;
  updated_at: string;
  chapters?: BackendChapter[];
}

export interface BackendChapter {
  id: string;
  story_id: string;
  sequence: number;
  title: string;
  content: string;
  choices: { id: string; text: string }[];
  world_state: {
    characters: { name: string; relationship: string; status: string }[];
    keyEvents: string[];
    currentScene: string;
    atmosphere: string;
  };
  created_at: string;
}

function mapBackendStory(bs: BackendStory): Story {
  const totalChapters = bs.chapters?.length || 1;
  const currentChapter = bs.chapters?.length || 0;
  const progress = totalChapters > 0 ? Math.round((currentChapter / totalChapters) * 100) : 0;

  return {
    id: bs.id,
    title: bs.title,
    summary: bs.setting,
    genre: STYLE_TO_GENRE[bs.style] || 'ancient',
    authorId: bs.author_id,
    authorName: '匿名读者',
    currentChapter: Math.max(1, currentChapter),
    totalChapters: Math.max(1, totalChapters),
    progress: Math.min(100, progress),
    lastUpdatedAt: bs.updated_at,
    createdAt: bs.created_at,
    status: bs.status === 'abandoned' ? 'paused' : bs.status === 'completed' ? 'completed' : 'reading',
    likes: bs.likes_count || 0,
    bookmarks: bs.favorites_count || 0,
    isLiked: false,
    isBookmarked: false,
  };
}

function mapBackendChapter(bc: BackendChapter): Chapter {
  return {
    id: bc.id,
    storyId: bc.story_id,
    chapterNumber: bc.sequence,
    title: bc.title,
    content: bc.content,
    choices: bc.choices.map((c) => ({ id: c.id, text: c.text })),
    createdAt: bc.created_at,
  };
}

function mapBackendWorldState(
  ws: BackendChapter['world_state'],
  storyId: string,
  chapterNumber: number
): WorldState {
  return {
    storyId,
    characters: ws.characters.map((c, idx) => ({
      id: `char-${idx}`,
      name: c.name,
      description: c.status,
      relationship: c.relationship,
    })),
    timeline: ws.keyEvents.map((e, idx) => ({
      id: `evt-${idx}`,
      chapterNumber,
      event: e,
      timestamp: ws.currentScene || '未知时间',
    })),
    currentChapter: chapterNumber,
  };
}

export async function createStory(payload: { prompt: string; genre: StoryGenre }): Promise<Story> {
  const title = payload.prompt.slice(0, 30).trim() + (payload.prompt.length > 30 ? '…' : '');
  const data = await request<BackendStory>('/api/stories', {
    method: 'POST',
    body: JSON.stringify({
      title,
      setting: payload.prompt,
      style: GENRE_TO_STYLE[payload.genre],
    }),
  });
  return mapBackendStory(data);
}

export async function getStories(): Promise<Story[]> {
  const data = await request<{ stories: BackendStory[]; total: number }>('/api/stories');
  return data.stories.map(mapBackendStory);
}

export async function getStoryDetail(storyId: string): Promise<{ story: Story; chapters: Chapter[] }> {
  const data = await request<BackendStory>(`/api/stories/${storyId}`);
  const story = mapBackendStory(data);
  const chapters = (data.chapters || []).map(mapBackendChapter);
  return { story, chapters };
}

export async function deleteStory(storyId: string): Promise<void> {
  await request(`/api/stories/${storyId}`, { method: 'DELETE' });
}

// ===== 章节 API =====

export async function generateChapter(
  storyId: string,
  previousChapterId?: string,
  userChoiceIndex?: number
): Promise<{ chapter: Chapter; worldState: WorldState }> {
  const data = await request<BackendChapter>('/api/stories/' + storyId + '/chapters', {
    method: 'POST',
    body: JSON.stringify({
      previousChapterId: previousChapterId || undefined,
      userChoice: userChoiceIndex !== undefined ? userChoiceIndex : undefined,
    }),
  });

  const chapter = mapBackendChapter(data);
  const worldState = mapBackendWorldState(data.world_state, storyId, chapter.chapterNumber);

  return { chapter, worldState };
}

// ===== 广场 API =====

export async function getSquareStories(sort: 'hot' | 'latest' | 'favorites' = 'hot'): Promise<Story[]> {
  const data = await request<BackendStory[]>(`/api/square?sort=${sort}`);
  return data.map(mapBackendStory);
}

// ===== 点赞/收藏 API =====

export async function toggleLike(storyId: string): Promise<{ liked: boolean; likes: number }> {
  return request(`/api/stories/${storyId}/like`, { method: 'POST' });
}

export async function toggleBookmark(storyId: string): Promise<{ bookmarked: boolean }> {
  return request(`/api/stories/${storyId}/favorite`, { method: 'POST' });
}

// ===== 随机设定 API =====

export async function getRandomPrompt(): Promise<{ description: string; genre: StoryGenre | null }> {
  const data = await request<{ prompt: string }>('/api/stories/random-prompt');
  return { description: data.prompt, genre: null };
}

// ===== 分享 API =====

export async function createShareLink(storyId: string): Promise<{ shortUrl: string; code: string }> {
  const data = await request<{ code: string; url: string }>('/api/share', {
    method: 'POST',
    body: JSON.stringify({ storyId }),
  });
  const fullUrl = data.url.startsWith('http')
    ? data.url
    : `${window.location.origin}${data.url}`;
  return { shortUrl: fullUrl, code: data.code };
}

// ===== 反馈 API =====

export async function submitFeedback(payload: {
  type: string;
  content: string;
  screenshot?: string;
  routePath?: string;
}): Promise<{ id: string; created: boolean }> {
  return request('/api/feedback', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
