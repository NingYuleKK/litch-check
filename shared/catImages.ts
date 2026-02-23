/**
 * Cat mascot image CDN URLs.
 * 4 states based on daily check-in completion.
 */
export const CAT_IMAGES = {
  /** Normal/idle state - default mascot */
  normal: "https://files.manuscdn.com/user_upload_by_module/session_file/86672527/BglxMwZIXlCzeEKM.png",
  /** Encourage state - ≥3 tasks completed, cat gives thumbs up */
  encourage: "https://files.manuscdn.com/user_upload_by_module/session_file/86672527/DsRmieIeBrNgghoc.png",
  /** Perfect state - all 5 tasks completed, cat holds lotus */
  perfect: "https://files.manuscdn.com/user_upload_by_module/session_file/86672527/tnhepFYrpObYBPIp.png",
  /** Lazy state - 0 or <3 tasks completed, cat reminds you */
  lazy: "https://files.manuscdn.com/user_upload_by_module/session_file/86672527/VDtRTmFopDjJiMuK.png",
} as const;

export type CatState = keyof typeof CAT_IMAGES;

/**
 * Get the appropriate cat image based on completion count.
 * - 0 completions: normal (idle)
 * - 1-2 completions: lazy (not enough)
 * - 3-4 completions: encourage (thumbs up)
 * - 5 completions: perfect (lotus)
 */
export function getCatState(completedCount: number): CatState {
  if (completedCount >= 5) return "perfect";
  if (completedCount >= 3) return "encourage";
  if (completedCount > 0) return "lazy";
  return "normal";
}

// ─── Sassy Cat Dialogue System ──────────────────────────────────

/**
 * Cat dialogue lines by completion state.
 * Tone: sassy, cute, like a sharp-tongued friend who secretly cares.
 */
export const CAT_DIALOGUES: Record<CatState, string[]> = {
  normal: [
    "Litch 还不来快活吗？",
    "今天打算躺平？本猫不同意。",
    "醒醒，你的五个任务在哭泣。",
    "又想摸鱼？被本猫抓到了吧。",
  ],
  lazy: [
    "才这点？你在逗我？",
    "加油啊，离星星还差一点点。",
    "本猫相信你不止于此。",
  ],
  encourage: [
    "不错嘛，今天有点东西。",
    "三个了！本猫赐你一颗星。",
  ],
  perfect: [
    "大圆满！本猫为你骄傲！",
    "完美的一天，值得抱莲花庆祝。",
    "你是本猫见过最自律的人类。",
  ],
};

/**
 * Streak-based bonus messages.
 * These are appended to the main dialogue when streak milestones are hit.
 */
export const STREAK_MESSAGES: { threshold: number; messages: string[] }[] = [
  { threshold: 30, messages: ["一个月！本猫跪了。🙇"] },
  { threshold: 14, messages: ["两周连胜，你是机器人吗？🤖"] },
  { threshold: 7, messages: ["一周了，太厉害了！💪"] },
  { threshold: 3, messages: ["三天了，开始有点意思。😏"] },
];

/**
 * Pick a random dialogue based on completion state.
 * Uses a seeded approach based on dateStr for consistency within the same day,
 * but changes when completedCount changes.
 */
export function getCatDialogue(
  completedCount: number,
  dateStr: string
): string {
  const state = getCatState(completedCount);
  const lines = CAT_DIALOGUES[state];
  // Use a simple hash of dateStr + completedCount for stable random within same state
  const seed = hashCode(dateStr + completedCount);
  const index = Math.abs(seed) % lines.length;
  return lines[index];
}

/**
 * Get streak bonus message if applicable.
 * Returns null if no milestone is reached.
 */
export function getStreakMessage(streak: number): string | null {
  for (const { threshold, messages } of STREAK_MESSAGES) {
    if (streak >= threshold) {
      return messages[0];
    }
  }
  return null;
}

/**
 * Simple string hash for deterministic "random" selection.
 */
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

// ─── Legacy exports (kept for backward compat) ─────────────────

export const CAT_MESSAGES: Record<CatState, { title: string; subtitle: string }> = {
  normal: { title: "准备好了吗？", subtitle: "开始今天的打卡吧！" },
  lazy: { title: "还差一点哦~", subtitle: "再加把劲，完成3个获得认可！" },
  encourage: { title: "猫猫认可！", subtitle: "太棒了，继续保持！" },
  perfect: { title: "大圆满！", subtitle: "今天全部完成，完美！" },
};
