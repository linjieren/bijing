import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Story, Chapter, WorldState, ReadingProgress, StoryGenre, StoryLength } from '../types';

interface StoryState {
  // 故事列表
  stories: Story[];
  currentStory: Story | null;
  currentChapter: Chapter | null;
  worldState: WorldState | null;
  readingProgress: Record<string, ReadingProgress>;

  // 创作
  draftPrompt: string;
  draftGenre: StoryGenre | null;
  draftLength: StoryLength | null;
  draftTitle: string | null;

  // Actions
  setStories: (stories: Story[]) => void;
  setCurrentStory: (story: Story | null) => void;
  setCurrentChapter: (chapter: Chapter | null) => void;
  setWorldState: (state: WorldState | null) => void;
  updateProgress: (storyId: string, chapter: number, choiceId: string) => void;
  setDraftPrompt: (prompt: string) => void;
  setDraftGenre: (genre: StoryGenre | null) => void;
  setDraftLength: (length: StoryLength | null) => void;
  setDraftTitle: (title: string | null) => void;
  deleteStory: (storyId: string) => void;
  toggleLike: (storyId: string) => void;
  toggleBookmark: (storyId: string) => void;
}

export const useStoryStore = create<StoryState>()(
  persist(
    (set, get) => ({
      stories: [],
      currentStory: null,
      currentChapter: null,
      worldState: null,
      readingProgress: {},
      draftPrompt: '',
      draftGenre: null,
      draftLength: null,
      draftTitle: null,

      setStories: (stories) => set({ stories }),
      setCurrentStory: (story) => set({ currentStory: story }),
      setCurrentChapter: (chapter) => set({ currentChapter: chapter }),
      setWorldState: (state) => set({ worldState: state }),

      updateProgress: (storyId, chapter, choiceId) => {
        const current = get().readingProgress[storyId] || {
          storyId,
          currentChapter: 1,
          lastReadAt: new Date().toISOString(),
          choicesMade: {},
        };
        set({
          readingProgress: {
            ...get().readingProgress,
            [storyId]: {
              ...current,
              currentChapter: chapter,
              lastReadAt: new Date().toISOString(),
              choicesMade: { ...current.choicesMade, [chapter]: choiceId },
            },
          },
        });
      },

      setDraftPrompt: (prompt) => set({ draftPrompt: prompt }),
      setDraftGenre: (genre) => set({ draftGenre: genre }),
      setDraftLength: (length) => set({ draftLength: length }),
      setDraftTitle: (title) => set({ draftTitle: title }),

      deleteStory: (storyId) => {
        set({
          stories: get().stories.filter((s) => s.id !== storyId),
          currentStory: get().currentStory?.id === storyId ? null : get().currentStory,
        });
      },

      toggleLike: (storyId) => {
        set({
          stories: get().stories.map((s) =>
            s.id === storyId
              ? { ...s, isLiked: !s.isLiked, likes: s.isLiked ? s.likes - 1 : s.likes + 1 }
              : s
          ),
        });
      },

      toggleBookmark: (storyId) => {
        set({
          stories: get().stories.map((s) =>
            s.id === storyId ? { ...s, isBookmarked: !s.isBookmarked } : s
          ),
        });
      },
    }),
    { name: 'bijing-stories' }
  )
);
