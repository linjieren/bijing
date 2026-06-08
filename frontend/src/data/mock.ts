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
  // ===== 古风 =====
  { id: '1', title: '穿越成废柴皇子', description: '我穿越成了大夏国最不受宠的七皇子，开局即被派去守皇陵，却意外激活了龙脉传承...', genre: 'ancient' },
  { id: '2', title: '御前女官', description: '我以男子身份入朝为官十年，从未被人识破。直到那个雨夜，皇帝醉酒后闯入我的寝殿...', genre: 'ancient' },
  { id: '9', title: '医女与盟主', description: '你是江湖上人人追杀的医女，那一夜你救了重伤的武林盟主，却发现他是朝廷通缉的叛贼，而你竟是他失散多年的妹妹...', genre: 'ancient' },
  { id: '10', title: '赐婚冷面王爷', description: '你被赐婚给冷面战神王爷，新婚之夜却发现他每晚都易容成刺客潜入你的房间，而他胸口的那道伤疤，与你十年前救过的少年一模一样...', genre: 'ancient' },
  { id: '11', title: '女镖师的棺材', description: '你是镖局唯一的女镖师，这次护送的货物竟是一口会说话的棺材，棺材里躺着的人，长着和你一模一样的脸...', genre: 'ancient' },
  // ===== 科幻 =====
  { id: '3', title: '星际拾荒者', description: '地球毁灭后的第47年，我在废弃空间站捡到了一具冷冻舱，里面躺着一个自称来自21世纪的女孩...', genre: 'scifi' },
  { id: '12', title: '意识备份第47号', description: '意识上传公司承诺永生，但你发现自己的备份在三年前就停止了更新，而现在的"你"，只是第47个复制品...', genre: 'scifi' },
  { id: '13', title: '太空站维修工', description: '你是太空站唯一的维修工，在通风管道里发现了前一任维修工的日记——他在这里活了200年，而日记的最后一页写着：别相信地面控制中心', genre: 'scifi' },
  { id: '14', title: '机器人母亲', description: '机器人保姆抚养人类婴儿的第18年，婴儿第一次问你："妈妈，为什么你不会老？"你检查自己的系统日志，发现自己从未被设定过"母亲"程序...', genre: 'scifi' },
  { id: '15', title: '时间旅行者的信', description: '时间旅行局规定不能改变过去，但你收到一封来自未来的信，上面只有你自己的签名和一句话：快逃，他们在2026年找到了你', genre: 'scifi' },
  // ===== 悬疑 =====
  { id: '4', title: '雨夜追凶', description: '连续三起命案，死者都是同一所高中的学生。作为被停职的刑警，你发现每具尸体旁都留着我的名字...', genre: 'suspense' },
  { id: '16', title: '墙里的信', description: '搬进新家后，你发现前任房主在每一面墙里都藏了一封信，收信人全是你，而最后一封信的日期是明天...', genre: 'suspense' },
  { id: '17', title: '睁眼的尸体', description: '作为入殓师，你给尸体化妆时，这具尸体的眼睛突然睁开了，用只有你听得见的声音说："下一个就是你。"', genre: 'suspense' },
  { id: '18', title: '直播间衣柜', description: '直播带货时，弹幕突然刷屏："你身后的衣柜里有人"，你回头看了一眼，然后直播间永久黑屏了...', genre: 'suspense' },
  { id: '19', title: '快递里的模型', description: '收到的快递里是一具和你一模一样的人体模型，模型手里握着一张明天的报纸，头条是你的死讯...', genre: 'suspense' },
  // ===== 言情 =====
  { id: '5', title: '替身新娘', description: '为了救重病的母亲，我代替姐姐嫁入了豪门。新婚之夜，醉酒的丈夫喊的却是我的名字...', genre: 'romance' },
  { id: '20', title: '相亲节目的前夫', description: '离婚三年后，你在相亲节目上看到了前夫，他的每一条择偶标准都像是在描述你，而主持人念出的他的心动对象编号，正是你手里的号码牌...', genre: 'romance' },
  { id: '21', title: '顶流明星的助理', description: '作为顶流明星的私人助理，你发现他的所有歌都是写给你的，而歌词里藏着你们十年前在孤儿院约定的暗号...', genre: 'romance' },
  { id: '22', title: '失忆后的重逢', description: '车祸失忆后，所有人都告诉你男友已经死了，直到你在医院的电梯里遇见了他，他看着你，像看着一个陌生人...', genre: 'romance' },
  { id: '23', title: '网恋对象是实习生', description: '网恋三年的对象是公司新来的实习生，而你是他的直属上司。入职第一天，他在全组面前喊出了你的网名...', genre: 'romance' },
  // ===== 职场 =====
  { id: '6', title: '大厂裁员名单', description: '裁员名单泄露，我发现自己的名字赫然在列。更可怕的是，名单上所有人都在一周内"意外"身亡...', genre: 'workplace' },
  { id: '24', title: '保洁阿姨的遗嘱', description: '作为公司最底层的保洁阿姨，你意外看到了董事长的遗嘱——他把价值百亿的公司留给了一个叫"小满"的人，而你的乳名就是小满...', genre: 'workplace' },
  { id: '25', title: '全员间谍', description: '入职第一天，发现部门里所有人都在演你。他们的真实身份是竞争对手派来的商业间谍，而你的工位下藏着他们要找的东西...', genre: 'workplace' },
  { id: '26', title: '替身秘书', description: '给总裁当了五年替身秘书，今天他要你代替他去签一份生死合同。你才发现，合同上的乙方名字，是你已故双胞胎姐姐的名字...', genre: 'workplace' },
  { id: '27', title: '厕所里的秘密会议', description: '你的工位在厕所隔壁，但每个深夜，厕所里都会传出同事们的秘密会议。某天你推开门，发现里面坐着的全是公司高层，而他们在讨论如何让你"消失"...', genre: 'workplace' },
  // ===== 无限流 =====
  { id: '7', title: '七日轮回', description: '每次死亡都会在周一早上醒来，这已经是第七次了。而这一次，你发现了轮回的真相——杀死你的人，就是你自己...', genre: 'infinite' },
  { id: '28', title: '消失的队友', description: '每个副本结束后，队友都会少一个人，但系统显示全员存活。直到你在下一个副本里，遇到了已经被"淘汰"的队友，而他们变成了NPC...', genre: 'infinite' },
  { id: '29', title: '不要照镜子', description: '规则第一条：不要照镜子。但你发现这个副本里没有镜子，只有窗户。而窗户里映出的，是另一个你在对你笑...', genre: 'infinite' },
  { id: '30', title: '觉醒的NPC', description: '作为无限流世界的NPC，你今天突然有了自我意识，而玩家们正在屠杀你的家人。系统提示：杀死玩家，你可以取代他们回到现实...', genre: 'infinite' },
  { id: '31', title: '被取代的现实', description: '通关奖励是回到现实世界，但你发现现实世界的"你"已经被另一个玩家取代了。而那个玩家，正拿着刀站在你床前...', genre: 'infinite' },
  // ===== 末日 =====
  { id: '8', title: '最后的避难所', description: '丧尸病毒爆发的第30天，我们找到了传说中的地下避难所。但打开大门的那一刻，里面传出的是人类的呼救声，还有丧尸的嘶吼...', genre: 'apocalypse' },
  { id: '32', title: '解药的真相', description: '丧尸病毒是你研发的解药变异而来，而你是唯一知道原始配方的人。军方找到你时，你发现他们的血清样本里，混着你的DNA...', genre: 'apocalypse' },
  { id: '33', title: '废墟里的直播', description: '末世第三年，你在废墟里找到了一台还能上网的电脑，论坛里有人在实时直播你的位置。而帖子的发布者ID，是你三年前死去的队友...', genre: 'apocalypse' },
  { id: '34', title: '最后的广播员', description: '作为人类最后的广播员，你每天播报生存指南，直到有人回复了你的求救信号。而信号来源，是已经沦陷的禁区核心...', genre: 'apocalypse' },
  { id: '35', title: '记忆换命', description: '你的血能治愈丧尸化，但每救一个人，你就会失去一段记忆。当你救完最后一个人时，你发现自己不记得为什么要救他们了...', genre: 'apocalypse' },
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
    maxChapters: 12,
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
    maxChapters: 8,
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
    maxChapters: 15,
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
