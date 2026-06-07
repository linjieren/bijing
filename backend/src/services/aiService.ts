import axios from 'axios';
import { Readable } from 'stream';
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

class KimiApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'KimiApiError';
  }
}

async function callKimi(messages: KimiMessage[], temperature = 0.8): Promise<string> {
  if (!KIMI_API_KEY) {
    throw new KimiApiError('KIMI_API_KEY not configured');
  }

  // Rate limit
  const now = Date.now();
  const waitTime = MIN_INTERVAL_MS - (now - lastRequestTime);
  if (waitTime > 0) {
    await new Promise(r => setTimeout(r, waitTime));
  }
  lastRequestTime = Date.now();

  try {
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
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      if (status === 401 || status === 403 || status === 429) {
        throw new KimiApiError(`Moonshot API returned ${status}`, status);
      }
    }
    throw err;
  }
}

// ===== 流式调用 Kimi =====
export async function* callKimiStream(
  messages: KimiMessage[],
  temperature = 0.8
): AsyncGenerator<string, void, unknown> {
  if (!KIMI_API_KEY) {
    throw new KimiApiError('KIMI_API_KEY not configured');
  }

  // Rate limit
  const now = Date.now();
  const waitTime = MIN_INTERVAL_MS - (now - lastRequestTime);
  if (waitTime > 0) {
    await new Promise((r) => setTimeout(r, waitTime));
  }
  lastRequestTime = Date.now();

  try {
    const response = await axios.post(
      KIMI_API_URL,
      {
        model: KIMI_MODEL,
        messages,
        temperature,
        max_tokens: 4000,
        stream: true,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${KIMI_API_KEY}`,
        },
        timeout: 120000,
        responseType: 'stream',
      }
    );

    const stream = response.data as Readable;
    let buffer = '';

    for await (const chunk of stream) {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === ': keep-alive') continue;
        if (!trimmed.startsWith('data:')) continue;

        const data = trimmed.slice(5).trim();
        if (data === '[DONE]') return;

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (typeof content === 'string') {
            yield content;
          }
        } catch {
          // ignore parse errors for malformed lines
        }
      }
    }
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      if (status === 401 || status === 403 || status === 429) {
        throw new KimiApiError(`Moonshot API returned ${status}`, status);
      }
    }
    throw err;
  }
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

function generateMockChapter(
  storyTitle: string,
  storySetting: string,
  style: StoryStyle,
  previousChapter: Chapter | null,
  userChoiceIndex: number | null
): { title: string; content: string; choices: ChoiceOption[]; worldState: WorldState } {
  const styleLabel: Record<StoryStyle, string> = {
    '古风': '古风',
    '科幻': '科幻',
    '悬疑': '悬疑',
    '言情': '言情',
    '职场': '职场',
    '无限流': '无限流',
    '末日': '末日',
  };

  let title: string;
  let content: string;

  if (previousChapter) {
    const choiceText = userChoiceIndex !== null
      ? previousChapter.choices[userChoiceIndex]?.text || '继续前行'
      : '继续前行';
    title = `${previousChapter.title} · 续`;
    content = `你选择了"${choiceText}"。\n\n在${storySetting}的背景下，故事继续向前推进。主角一行人来到了新的场景，周围的气氛变得越来越紧张。远处传来的异响打破了短暂的平静，新的挑战正在酝酿。\n\n（当前为模拟生成章节：Moonshot API 暂时不可用，系统已自动降级到本地 mock。）`;
  } else {
    title = `${storyTitle} · 序章`;
    content = `欢迎来到《${storyTitle}》。\n\n${storySetting}\n\n这是一个${styleLabel[style]}风格的故事。你的每一次选择都会影响剧情走向。现在，故事的第一幕缓缓拉开，主角的命运之轮开始转动。\n\n（当前为模拟生成章节：Moonshot API 暂时不可用，系统已自动降级到本地 mock。）`;
  }

  return {
    title,
    content,
    choices: [
      { id: '1', text: '选项 A：谨慎行事，观察局势' },
      { id: '2', text: '选项 B：主动出击，把握先机' },
      { id: '3', text: '选项 C：寻求帮助，联合他人' },
    ],
    worldState: previousChapter?.world_state || {
      characters: [{ name: '主角', relationship: '自己', status: '踏上旅程' }],
      keyEvents: ['故事开始'],
      currentScene: storySetting,
      atmosphere: styleLabel[style],
    },
  };
}

// ===== 生成下一章 =====
export async function generateNextChapter(
  storyTitle: string,
  storySetting: string,
  style: StoryStyle,
  previousChapter: Chapter | null,
  userChoiceIndex: number | null
): Promise<{ title: string; content: string; choices: ChoiceOption[]; worldState: WorldState }> {
  if (MOCK_MODE) {
    return generateMockChapter(storyTitle, storySetting, style, previousChapter, userChoiceIndex);
  }

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

请根据用户的选择，续写下一章。
**字数要求：严格控制在 800-1200 字之间。不得少于 800 字，不要超过 1500 字。**
**节奏要求：本章是故事的中间章节，请保持剧情推进，留有悬念，不要在此处完结。**`;
  } else {
    userPrompt += `这是故事的第一章（开场）。
**字数要求：严格控制在 800-1200 字之间。不得少于 800 字，不要超过 1500 字。**
**节奏要求：作为开场，需要建立世界观、引入核心冲突，并埋下后续伏笔。**
请根据设定展开故事。`;
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
3. content 要写得精彩，有画面感，符合${style}风格，**严格 800-1200 字**
4. worldState 要准确反映本章后的新状态`;

  const systemPrompt = `你是一个专业的互动式网文作家。你擅长根据用户的设定和选择生成分支剧情。
你的输出必须是严格的 JSON 格式，不要有任何 markdown 代码块标记或额外文字。
确保 JSON 格式合法，可以直接被 JSON.parse 解析。`;

  let rawResponse: string;
  try {
    rawResponse = await callKimi([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);
  } catch (err) {
    if (err instanceof KimiApiError) {
      return generateMockChapter(storyTitle, storySetting, style, previousChapter, userChoiceIndex);
    }
    throw err;
  }

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

// ===== 流式生成下一章 =====
export async function generateNextChapterStream(
  storyTitle: string,
  storySetting: string,
  style: StoryStyle,
  previousChapter: Chapter | null,
  userChoiceIndex: number | null,
  onChunk: (chunk: string) => void
): Promise<{ title: string; content: string; choices: ChoiceOption[]; worldState: WorldState }> {
  if (MOCK_MODE) {
    const result = generateMockChapter(storyTitle, storySetting, style, previousChapter, userChoiceIndex);
    onChunk(result.content);
    return result;
  }

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

请根据用户的选择，续写下一章。`;
  } else {
    userPrompt += `这是故事的第一章（开场）。请根据设定展开故事。`;
  }

  userPrompt += `
**字数要求：严格控制在 800-1200 字之间。不得少于 800 字，不要超过 1500 字。**
**节奏要求：${previousChapter ? '本章是故事的中间章节，请保持剧情推进，留有悬念，不要在此处完结。' : '作为开场，需要建立世界观、引入核心冲突，并埋下后续伏笔。'}**

你必须严格按以下格式输出：

1. 先写章节正文内容（精彩、有画面感、符合${style}风格）
2. 正文结束后，单独一行输出分隔符：###META###
3. 然后输出 JSON 格式的元数据（不要 markdown 代码块）：

###META###
{
  "title": "章节标题",
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
3. content 要写得精彩，有画面感，符合${style}风格，严格 800-1200 字
4. worldState 要准确反映本章后的新状态
5. 正文和元数据之间必须用 ###META### 分隔，不要有任何其他标记`;

  const systemPrompt = `你是一个专业的互动式网文作家。你擅长根据用户的设定和选择生成分支剧情。
请严格按照要求的格式输出：先写正文，然后换行输出 ###META###，再输出 JSON 元数据。
确保 JSON 格式合法。`;

  let accumulated = '';
  let contentEmitted = 0;
  let inMeta = false;
  const META_SEP = '\n###META###\n';

  try {
    for await (const chunk of callKimiStream([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ])) {
      accumulated += chunk;

      if (!inMeta) {
        const sepIdx = accumulated.indexOf(META_SEP);
        if (sepIdx !== -1) {
          const newContent = accumulated.slice(contentEmitted, sepIdx);
          if (newContent) onChunk(newContent);
          contentEmitted = sepIdx;
          inMeta = true;
        } else {
          const safeUpTo = Math.max(contentEmitted, accumulated.length - META_SEP.length + 1);
          if (safeUpTo > contentEmitted) {
            onChunk(accumulated.slice(contentEmitted, safeUpTo));
            contentEmitted = safeUpTo;
          }
        }
      }
    }
  } catch (err) {
    if (err instanceof KimiApiError) {
      const result = generateMockChapter(storyTitle, storySetting, style, previousChapter, userChoiceIndex);
      onChunk(result.content);
      return result;
    }
    throw err;
  }

  const sepIdx = accumulated.indexOf(META_SEP);
  let content: string;
  let metaStr: string;

  if (sepIdx !== -1) {
    content = accumulated.slice(0, sepIdx);
    metaStr = accumulated.slice(sepIdx + META_SEP.length);
    if (contentEmitted < sepIdx) {
      onChunk(accumulated.slice(contentEmitted, sepIdx));
    }
  } else {
    content = accumulated;
    metaStr = '';
    if (contentEmitted < accumulated.length) {
      onChunk(accumulated.slice(contentEmitted));
    }
  }

  let title = '未命名章节';
  let choices: ChoiceOption[] = [];
  let worldState: WorldState = {
    characters: [],
    keyEvents: [],
    currentScene: '',
    atmosphere: '',
  };

  if (metaStr) {
    const parsed = safeParseJSON(metaStr) as Record<string, unknown> | null;
    if (parsed && typeof parsed === 'object') {
      title = (parsed.title as string) || title;
      choices = (parsed.choices as ChoiceOption[]) || [];
      worldState = (parsed.worldState as WorldState) || worldState;
    }
  }

  if (!metaStr) {
    const parsed = safeParseJSON(content) as Record<string, unknown> | null;
    if (parsed && typeof parsed === 'object' && parsed.content) {
      content = (parsed.content as string) || content;
      title = (parsed.title as string) || title;
      choices = (parsed.choices as ChoiceOption[]) || [];
      worldState = (parsed.worldState as WorldState) || worldState;
    }
  }

  return { title, content, choices, worldState };
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

// 随机设定文案：每个风格5个，共35个
export const randomPrompts: string[] = [
  // ===== 古风 =====
  '你穿越成了大夏国最不受宠的七皇子，开局即被派去守皇陵，却意外激活了龙脉传承...',
  '你以男子身份入朝为官十年，从未被人识破。直到那个雨夜，皇帝醉酒后闯入你的寝殿...',
  '你是江湖上人人追杀的医女，那一夜你救了重伤的武林盟主，却发现他是朝廷通缉的叛贼，而你竟是他失散多年的妹妹...',
  '你被赐婚给冷面战神王爷，新婚之夜却发现他每晚都易容成刺客潜入你的房间，而他胸口的那道伤疤，与你十年前救过的少年一模一样...',
  '你是镖局唯一的女镖师，这次护送的货物竟是一口会说话的棺材，棺材里躺着的人，长着和你一模一样的脸...',
  // ===== 科幻 =====
  '2045年，你是一名星际快递员，这次要送的包裹目的地是——月球背面禁区',
  '意识上传公司承诺永生，但你发现自己的备份在三年前就停止了更新，而现在的"你"，只是第47个复制品...',
  '你是太空站唯一的维修工，在通风管道里发现了前一任维修工的日记——他在这里活了200年，而日记的最后一页写着：别相信地面控制中心',
  '机器人保姆抚养人类婴儿的第18年，婴儿第一次问你："妈妈，为什么你不会老？"你检查自己的系统日志，发现自己从未被设定过"母亲"程序...',
  '时间旅行局规定不能改变过去，但你收到一封来自未来的信，上面只有你自己的签名和一句话：快逃，他们在2026年找到了你',
  // ===== 悬疑 =====
  '连续三起命案，死者都是同一所高中的学生。作为被停职的刑警，你发现每具尸体旁都留着我的名字...',
  '搬进新家后，你发现前任房主在每一面墙里都藏了一封信，收信人全是你，而最后一封信的日期是明天...',
  '作为入殓师，你给尸体化妆时，这具尸体的眼睛突然睁开了，用只有你听得见的声音说："下一个就是你。"',
  '直播带货时，弹幕突然刷屏："你身后的衣柜里有人"，你回头看了一眼，然后直播间永久黑屏了...',
  '收到的快递里是一具和你一模一样的人体模型，模型手里握着一张明天的报纸，头条是你的死讯...',
  // ===== 言情 =====
  '为了救重病的母亲，你代替姐姐嫁入了豪门。新婚之夜，醉酒的丈夫喊的却是你的名字...',
  '离婚三年后，你在相亲节目上看到了前夫，他的每一条择偶标准都像是在描述你，而主持人念出的他的心动对象编号，正是你手里的号码牌...',
  '作为顶流明星的私人助理，你发现他的所有歌都是写给你的，而歌词里藏着你们十年前在孤儿院约定的暗号...',
  '车祸失忆后，所有人都告诉你男友已经死了，直到你在医院的电梯里遇见了他，他看着你，像看着一个陌生人...',
  '网恋三年的对象是公司新来的实习生，而你是他的直属上司。入职第一天，他在全组面前喊出了你的网名...',
  // ===== 职场 =====
  '裁员名单泄露，你发现自己的名字赫然在列。更可怕的是，名单上所有人都在一周内"意外"身亡...',
  '作为公司最底层的保洁阿姨，你意外看到了董事长的遗嘱——他把价值百亿的公司留给了一个叫"小满"的人，而你的乳名就是小满...',
  '入职第一天，发现部门里所有人都在演你。他们的真实身份是竞争对手派来的商业间谍，而你的工位下藏着他们要找的东西...',
  '给总裁当了五年替身秘书，今天他要你代替他去签一份生死合同。你才发现，合同上的乙方名字，是你已故双胞胎姐姐的名字...',
  '你的工位在厕所隔壁，但每个深夜，厕所里都会传出同事们的秘密会议。某天你推开门，发现里面坐着的全是公司高层，而他们在讨论如何让你"消失"...',
  // ===== 无限流 =====
  '每次死亡都会在周一早上醒来，这已经是第七次了。而这一次，你发现了轮回的真相——杀死你的人，就是你自己...',
  '每个副本结束后，队友都会少一个人，但系统显示全员存活。直到你在下一个副本里，遇到了已经被"淘汰"的队友，而他们变成了NPC...',
  '规则第一条：不要照镜子。但你发现这个副本里没有镜子，只有窗户。而窗户里映出的，是另一个你在对你笑...',
  '作为无限流世界的NPC，你今天突然有了自我意识，而玩家们正在屠杀你的家人。系统提示：杀死玩家，你可以取代他们回到现实...',
  '通关奖励是回到现实世界，但你发现现实世界的"你"已经被另一个玩家取代了。而那个玩家，正拿着刀站在你床前...',
  // ===== 末日 =====
  '丧尸病毒爆发的第30天，你们找到了传说中的地下避难所。但打开大门的那一刻，里面传出的是人类的呼救声，还有丧尸的嘶吼...',
  '丧尸病毒是你研发的解药变异而来，而你是唯一知道原始配方的人。军方找到你时，你发现他们的血清样本里，混着你的DNA...',
  '末世第三年，你在废墟里找到了一台还能上网的电脑，论坛里有人在实时直播你的位置。而帖子的发布者ID，是你三年前死去的队友...',
  '作为人类最后的广播员，你每天播报生存指南，直到有人回复了你的求救信号。而信号来源，是已经沦陷的禁区核心...',
  '你的血能治愈丧尸化，但每救一个人，你就会失去一段记忆。当你救完最后一个人时，你发现自己不记得为什么要救他们了...',
];

export function getRandomPrompt(): string {
  return randomPrompts[Math.floor(Math.random() * randomPrompts.length)];
}
