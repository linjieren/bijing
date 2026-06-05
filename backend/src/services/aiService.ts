import axios from 'axios';
import { Chapter, WorldState, ChoiceOption, StoryStyle } from '../types';

const KIMI_API_KEY = process.env.KIMI_API_KEY || '';
const KIMI_API_URL = process.env.KIMI_API_URL || 'https://api.moonshot.cn/v1/chat/completions';
const KIMI_MODEL = process.env.KIMI_MODEL || 'moonshot-v1-8k';

// 简单的 rate limit 控制
let lastRequestTime = 0;
const MIN_INTERVAL_MS = 500; // 最小请求间隔 500ms

// 是否启用 mock 模式（无 API key 时使用）
const MOCK_MODE = !KIMI_API_KEY || KIMI_API_KEY === 'your-kimi-api-key';

// ===== 安全的 JSON 解析（处理 LLM 常见输出问题） =====
function safeParseJSON(raw: string): unknown {
  raw = raw.trim();
  // 去除 markdown 代码块标记
  raw = raw.replace(/^```(?:json)?\s*/i, '');
  raw = raw.replace(/\s*```$/, '');
  // 单引号转双引号
  raw = raw.replace(/'/g, '"');
  // 去除尾随逗号
  raw = raw.replace(/,\s*([}\]])/g, '$1');

  try {
    return JSON.parse(raw);
  } catch {
    // 尝试找第一个平衡的 JSON 对象
    let depth = 0;
    let start = -1;
    for (let i = 0; i < raw.length; i++) {
      if (raw[i] === '{') {
        if (depth === 0) start = i;
        depth++;
      } else if (raw[i] === '}') {
        depth--;
        if (depth === 0 && start !== -1) {
          try {
            return JSON.parse(raw.slice(start, i + 1));
          } catch {
            continue;
          }
        }
      }
    }
  }
  return null;
}

interface KimiMessage {
  role: 'system' | 'user';
  content: string;
}

interface KimiResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

async function callKimi(messages: KimiMessage[], temperature = 0.8): Promise<string> {
  if (!KIMI_API_KEY) {
    throw new Error('KIMI_API_KEY not configured');
  }

  // Rate limit
  const now = Date.now();
  const waitTime = MIN_INTERVAL_MS - (now - lastRequestTime);
  if (waitTime > 0) {
    await new Promise(r => setTimeout(r, waitTime));
  }
  lastRequestTime = Date.now();

  const response = await axios.post<KimiResponse>(
    KIMI_API_URL,
    {
      model: KIMI_MODEL,
      messages,
      temperature,
      max_tokens: 4000,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KIMI_API_KEY}`,
      },
      timeout: 60000,
    }
  );

  return response.data.choices[0]?.message?.content || '';
}

// ===== 风格描述映射 =====
const styleDescriptions: Record<StoryStyle, string> = {
  '古风': '中国古代背景，用词典雅，有诗词韵味，注重意境和人物情感',
  '科幻': '未来科技背景，逻辑严密，探索人类与科技的关系，有硬核设定',
  '悬疑': '谜团重重，氛围紧张，线索层层递进，结局出人意料',
  '言情': '细腻的情感描写，聚焦人物关系发展，有甜蜜或虐心的情感张力',
  '职场': '现代职场背景，真实接地气，展现职场斗争、成长与选择',
  '无限流': '多世界穿越，每个副本有不同规则，紧张刺激的生存挑战',
  '末日': '末世生存背景，资源匮乏，人性考验，有压迫感和求生欲',
};

// ===== 生成下一章 =====
export async function generateNextChapter(
  storyTitle: string,
  storySetting: string,
  style: StoryStyle,
  previousChapter: Chapter | null,
  userChoiceIndex: number | null
): Promise<{ title: string; content: string; choices: ChoiceOption[]; worldState: WorldState }> {

  const styleDesc = styleDescriptions[style];

  let userPrompt = `你正在写一个互动式${style}网文。

故事标题：${storyTitle}
故事设定：${storySetting}
风格要求：${styleDesc}

`;

  if (previousChapter) {
    const choiceText = userChoiceIndex !== null
      ? previousChapter.choices[userChoiceIndex]?.text || '继续故事'
      : '继续故事';

    userPrompt += `上一章标题：${previousChapter.title}
上一章内容概要：${previousChapter.content.substring(0, 500)}...

用户的选择是："${choiceText}"

当前世界状态：
${JSON.stringify(previousChapter.world_state, null, 2)}

请根据用户的选择，续写下一章（约800-1200字），并更新世界状态。`;
  } else {
    userPrompt += `这是故事的第一章（开场），约800-1200字。请根据设定展开故事。`;
  }

  userPrompt += `

你必须严格按以下 JSON 格式输出，不要添加任何其他文字：

{
  "title": "章节标题",
  "content": "章节正文内容...",
  "choices": [
    { "id": "1", "text": "选项1描述" },
    { "id": "2", "text": "选项2描述" },
    { "id": "3", "text": "选项3描述" }
  ],
  "worldState": {
    "characters": [
      { "name": "角色名", "relationship": "与主角关系", "status": "当前状态" }
    ],
    "keyEvents": ["关键事件1", "关键事件2"],
    "currentScene": "当前场景描述",
    "atmosphere": "当前氛围"
  }
}

要求：
1. choices 必须提供 2-3 个有意义的分支选项
2. 选项要引导故事往不同方向发展
3. content 要写得精彩，有画面感，符合${style}风格
4. worldState 要准确反映本章后的新状态`;

  const systemPrompt = `你是一个专业的互动式网文作家。你擅长根据用户的设定和选择生成分支剧情。
你的输出必须是严格的 JSON 格式，不要有任何 markdown 代码块标记或额外文字。
确保 JSON 格式合法，可以直接被 JSON.parse 解析。`;

  const rawResponse = await callKimi([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]);

  // 解析响应
  const parsed = safeParseJSON(rawResponse) as Record<string, unknown> | null;
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('AI response does not contain valid JSON');
  }

  return {
    title: (parsed.title as string) || '未命名章节',
    content: (parsed.content as string) || '',
    choices: (parsed.choices as ChoiceOption[]) || [],
    worldState: (parsed.worldState as WorldState) || {
      characters: [],
      keyEvents: [],
      currentScene: '',
      atmosphere: '',
    },
  };
}

// ===== 世界状态总结 =====
export async function summarizeWorldState(
  storyTitle: string,
  style: StoryStyle,
  chapterContent: string,
  previousWorldState: WorldState
): Promise<WorldState> {
  const styleDesc = styleDescriptions[style];

  const userPrompt = `你是一个专业的网文世界观管理助手。

故事：${storyTitle}
风格：${styleDesc}

上一章内容：${chapterContent.substring(0, 1000)}

之前的世界状态：
${JSON.stringify(previousWorldState, null, 2)}

请总结本章对世界状态的影响，输出更新后的世界状态。严格按 JSON 格式：

{
  "characters": [
    { "name": "角色名", "relationship": "与主角关系", "status": "当前状态" }
  ],
  "keyEvents": ["关键事件1", "关键事件2"],
  "currentScene": "当前场景",
  "atmosphere": "当前氛围"
}`;

  const rawResponse = await callKimi([
    { role: 'system', content: '你是一个专业的网文世界观管理助手。输出必须是严格 JSON 格式。' },
    { role: 'user', content: userPrompt },
  ], 0.5);

  const parsed = safeParseJSON(rawResponse) as WorldState | null;
  if (!parsed || typeof parsed !== 'object') {
    return previousWorldState;
  }

  return parsed;
}

// 随机设定文案
export const randomPrompts: string[] = [
  '你在深山中遇到了一个自称"山神"的老者，他递给你一枚玉佩...',
  '2045年，你是一名星际快递员，这次要送的包裹目的地是——月球背面禁区',
  '你醒来发现自己被困在一个无限循环的酒店房间里，每次死亡都会从第一天重新开始',
  '作为一名法医，你在尸体上发现了一个不属于这个时代的刺青图案...',
  '末日降临的第三十七天，你在废墟中捡到了一台还能开机的收音机',
  '你是一家互联网大厂的HR，面试时发现候选人的简历上写着"我来自十年后"',
  '你在古玩市场淘到一面铜镜，镜中映出的不是你的脸，而是另一个时代的人',
  '作为一名无限流玩家，这是你经历的第七个副本，规则书只有一句话：不要相信任何人',
];

export function getRandomPrompt(): string {
  return randomPrompts[Math.floor(Math.random() * randomPrompts.length)];
}
