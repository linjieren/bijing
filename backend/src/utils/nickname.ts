export const NICKNAME_POOL = [
  '墨尘', '青衣客', '云游子', '竹影', '折扇书生', '夜归人', '醉月', '听雨',
  '孤舟', '寒江', '落英', '抚琴', '长歌', '辞镜', '南柯', '浮生', '白芷',
  '紫苏', '凌霄', '沉香', '墨羽', '青鸾', '玄霜', '赤焰', '流萤',
];

export const AVATAR_COLORS = [
  '#8B5CF6', // 紫
  '#06B6D4', // 青
  '#F59E0B', // 金
  '#EF4444', // 赤
  '#374151', // 墨
];

export function randomNickname(): string {
  return NICKNAME_POOL[Math.floor(Math.random() * NICKNAME_POOL.length)];
}

export function randomAvatarColor(): string {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}
