import { StoryLength, StoryStyle } from '../types';

const LENGTH_RANGES: Record<StoryLength, { min: number; max: number }> = {
  short: { min: 5, max: 8 },
  medium: { min: 12, max: 18 },
  long: { min: 20, max: 30 },
};

const DEFAULT_LENGTH_BY_STYLE: Record<StoryStyle, StoryLength> = {
  '悬疑': 'short',
  '无限流': 'short',
  '言情': 'medium',
  '职场': 'medium',
  '古风': 'long',
  '科幻': 'long',
  '末日': 'long',
};

export function resolveLengthPreference(
  preference: StoryLength | undefined,
  style: StoryStyle
): StoryLength {
  if (preference && ['short', 'medium', 'long'].includes(preference)) {
    return preference;
  }
  return DEFAULT_LENGTH_BY_STYLE[style];
}

export function calculateMaxChapters(length: StoryLength): number {
  const range = LENGTH_RANGES[length];
  return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
}

export function getPacingHint(
  length: StoryLength,
  currentChapter: number,
  maxChapters: number
): string {
  const ratio = currentChapter / maxChapters;

  let baseHint = '';
  switch (length) {
    case 'short':
      baseHint = '这是一个短篇故事，节奏必须紧凑，快速推进剧情，减少铺垫。';
      break;
    case 'medium':
      baseHint = '这是一个中篇故事，保持标准节奏，允许适度铺垫和转折。';
      break;
    case 'long':
      baseHint = '这是一个长篇故事，允许详细展开世界观、支线剧情和人物弧光。';
      break;
  }

  let stageHint = '';
  if (ratio < 0.3) {
    stageHint = '当前处于故事前期，请做好设定和悬念铺垫。';
  } else if (ratio < 0.6) {
    stageHint = '当前处于故事中期，可以展开冲突和转折。';
  } else if (ratio < 0.85) {
    stageHint = '当前处于故事后期，请开始收束支线，推进主线高潮。';
  } else {
    stageHint = '当前处于故事尾声，请尽快收尾，给出结局或开放式收束。如果这是最后一章，请在正文末尾添加 ###FINALE### 标记。';
  }

  return `${baseHint}\n当前是第 ${currentChapter} 章，总共约 ${maxChapters} 章。${stageHint}`;
}
