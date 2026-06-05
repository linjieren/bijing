import type { Story, Chapter, WorldState, PromptSuggestion, StoryGenreConfig } from '../types';

export const genreConfigs: StoryGenreConfig[] = [
  { key: 'ancient', label: '古风', color: 'text-ancient', bgColor: 'bg-ancient/15' },
  { key: 'scifi', label: '科幻', color: 'text-scifi', bgColor: 'bg-scifi/15' },
  { key: 'suspense', label: '悬疑', color: 'text-suspense', bgColor: 'bg-suspense/15' },
  { key: 'romance', label: '言情', color: 'text-romance', bgColor: 'bg-romance/15' },
  { key: 'workplace', label: '职场', color: 'text-workplace', bgColor: 'bg-workplace/15' },
  { key: 'infinite', label: '无限流', color: 'text-infinite', bgColor: 'bg-infinite/15' },
  { key: 'apocalypse', label: '末日', color: 'text-apocalypse', bgColor: 'bg-apocalypse/15' },
];

export const promptSuggestions: PromptSuggestion[] = [
  { id: '1', title: '穿越成废柴皇子', description: '我穿越成了大夏国最不受宠的七皇子，开局即被派去守皇陵，却意外激活了龙脉传承...', genre: 'ancient' },
  { id: '2', title: '星际拾荒者', description: '地球毁灭后的第47年，我在废弃空间站捡到了一具冷冻舱，里面躺着一个自称来自21世纪的女孩...', genre: 'scifi' },
  { id: '3', title: '雨夜追凶', description: '连续三起命案，死者都是同一所高中的学生。作为被停职的刑警，我发现每具尸体旁都留着我的名字...', genre: 'suspense' },
  { id: '4', title: '替身新娘', description: '为了救重病的母亲，我代替姐姐嫁入了豪门。新婚之夜，醉酒的丈夫喊的却是我的名字...', genre: 'romance' },
  { id: '5', title: '大厂裁员名单', description: '裁员名单泄露，我发现自己的名字赫然在列。更可怕的是，名单上所有人都在一周内"意外"身亡...', genre: 'workplace' },
  { id: '6', title: '七日轮回', description: '每次死亡都会在周一早上醒来，这已经是第七次了。而这一次，我发现了轮回的真相...', genre: 'infinite' },
  { id: '7', title: '最后的避难所', description: '丧尸病毒爆发的第30天，我们找到了传说中的地下避难所。但打开大门的那一刻，里面传出的是人类的呼救声...', genre: 'apocalypse' },
  { id: '8', title: '御前女官', description: '我以男子身份入朝为官十年，从未被人识破。直到那个雨夜，皇帝醉酒后闯入我的寝殿...', genre: 'ancient' },
];

export const mockStories: Story[] = [
  {
    id: 's1',
    title: '穿越成废柴皇子',
    summary: '我穿越成了大夏国最不受宠的七皇子，开局即被派去守皇陵，却意外激活了龙脉传承...',
    genre: 'ancient',
    authorId: 'u1',
    authorName: '笔境官方',
    currentChapter: 3,
    totalChapters: 12,
    progress: 25,
    lastUpdatedAt: '2026-06-03T10:00:00Z',
    createdAt: '2026-06-01T08:00:00Z',
    status: 'reading',
    likes: 128,
    bookmarks: 45,
    isLiked: false,
    isBookmarked: true,
  },
  {
    id: 's2',
    title: '星际拾荒者',
    summary: '地球毁灭后的第47年，我在废弃空间站捡到了一具冷冻舱...',
    genre: 'scifi',
    authorId: 'u2',
    authorName: '星云旅人',
    currentChapter: 1,
    totalChapters: 8,
    progress: 0,
    lastUpdatedAt: '2026-06-02T14:00:00Z',
    createdAt: '2026-06-02T14:00:00Z',
    status: 'reading',
    likes: 256,
    bookmarks: 89,
    isLiked: true,
    isBookmarked: false,
  },
  {
    id: 's3',
    title: '雨夜追凶',
    summary: '连续三起命案，死者都是同一所高中的学生...',
    genre: 'suspense',
    authorId: 'u3',
    authorName: '夜行者',
    currentChapter: 5,
    totalChapters: 15,
    progress: 33,
    lastUpdatedAt: '2026-06-03T20:00:00Z',
    createdAt: '2026-05-28T10:00:00Z',
    status: 'paused',
    likes: 512,
    bookmarks: 167,
    isLiked: false,
    isBookmarked: false,
  },
];

export const mockChapter: Chapter = {
  id: 'c1',
  storyId: 's1',
  chapterNumber: 3,
  title: '皇陵惊变',
  content: `大夏历，元和三年，深秋。

皇陵之上，枯叶纷飞。我——七皇子萧景煜，正对着一座冰冷的石碑发呆。

三天前，我还是二十一世纪的一个普通社畜程序员，在连续加班七十二小时后，眼前一黑，再醒来就变成了这个即将被派去守皇陵的废物皇子。

"殿下，该用膳了。"

身后传来老太监周福的声音，这位是母妃生前留下的唯一心腹，也是我在这个陌生世界唯一可以信任的人。

"福伯，你说……"我转过头，看着这位头发花白的老人，"这皇陵下面，真的只有先帝们的尸骨吗？"

周福面色微变，四下张望后压低声音："殿下，这话可不能乱说。先皇们……"

话音未落，地面突然剧烈震动。

轰隆——

皇陵深处传来一声闷响，紧接着，我脚下的石板开始龟裂，一道金色的光芒从裂缝中喷涌而出，将我整个人吞没。

在失去意识的最后一刻，我听到一个苍老的声音在脑海中响起：

"龙脉觉醒，大夏将兴。承吾传承者，可得天下。"`,
  choices: [
    { id: 'ch1', text: '接受龙脉传承，获得力量', nextChapterId: 'c2' },
    { id: 'ch2', text: '拒绝传承，试图逃离皇陵', nextChapterId: 'c3' },
    { id: 'ch3', text: '假装接受，暗中调查真相', nextChapterId: 'c4' },
  ],
  createdAt: '2026-06-01T08:00:00Z',
};

export const mockWorldState: WorldState = {
  storyId: 's1',
  characters: [
    { id: 'char1', name: '萧景煜', description: '穿越而来的七皇子，原身性格懦弱，现已被穿越者取代', relationship: '主角（你）' },
    { id: 'char2', name: '周福', description: '母妃留下的老太监，忠心耿耿', relationship: '心腹随从' },
    { id: 'char3', name: '大夏先帝', description: '已故皇帝，龙脉传承的源头', relationship: '先祖/传承者' },
  ],
  timeline: [
    { id: 't1', chapterNumber: 1, event: '穿越到七皇子萧景煜身上', timestamp: '元和三年·秋' },
    { id: 't2', chapterNumber: 2, event: '被派往皇陵守墓', timestamp: '元和三年·秋' },
    { id: 't3', chapterNumber: 3, event: '皇陵震动，龙脉觉醒', timestamp: '元和三年·秋' },
  ],
  currentChapter: 3,
};
