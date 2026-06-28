export const USER_NAME = "Kirthi";

function pick<T>(items: T[], seed: number): T {
  return items[Math.abs(Math.trunc(seed)) % items.length];
}

export function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return `Good morning, ${USER_NAME}`;
  if (hour < 17) return `Good afternoon, ${USER_NAME}`;
  return `Good evening, ${USER_NAME}`;
}

const READING_LINES = [
  `Take your time, ${USER_NAME} — understanding beats speed-reading.`,
  `Every page you finish here is ground your competition hasn't covered, ${USER_NAME}.`,
  `Read it once for the facts, once more for how they connect, ${USER_NAME}.`,
  `You're building real depth, ${USER_NAME}. Keep going.`,
  `Small, steady steps, ${USER_NAME} — that's exactly how 119 days get finished.`,
  `Stay curious, ${USER_NAME} — the questions below will feel familiar once you've read this.`,
];

export function getReadingEncouragement(seed: number): string {
  return pick(READING_LINES, seed);
}

const PRE_MOCK_LINES = [
  `Relax, ${USER_NAME} — this is practice. Every mistake here is a free lesson before the real exam.`,
  `You read it, now own it, ${USER_NAME}. Go show what stuck.`,
  `Aim for 80%+, ${USER_NAME} — and remember, you can retake this as many times as you want.`,
  `Take a breath, ${USER_NAME}. You've prepared for this — trust it.`,
];

export function getPreMockEncouragement(seed: number): string {
  return pick(PRE_MOCK_LINES, seed);
}

export function getStreakNudge(
  daysSinceLastActivity: number | null,
  currentStreak: number,
  passThreshold = 80
): string {
  const defaultLine = `Score ${passThreshold}%+ on a mock to clear that day and unlock the next.`;
  if (daysSinceLastActivity === null) return defaultLine;
  if (currentStreak > 0) return `\u{1F525} ${currentStreak}-day streak — don't break it now, ${USER_NAME}.`;
  if (daysSinceLastActivity >= 4) {
    return `It's been ${daysSinceLastActivity} days, ${USER_NAME} — no pressure, just pick up right where you left off.`;
  }
  if (daysSinceLastActivity >= 2) {
    return `Welcome back, ${USER_NAME} — today still counts. Let's restart the streak.`;
  }
  return defaultLine;
}

export type ResultMessage = { headline: string; detail: string };

// `gated` = true for daily mock tests where clearing the threshold unlocks the next
// day's reading; full-mock practice sessions don't gate anything, so the copy there
// skips the "next day" framing.
export function getResultMessage(
  scorePercent: number,
  opts: { gated: boolean; passThreshold?: number }
): ResultMessage {
  const threshold = opts.passThreshold ?? 80;
  const rounded = Math.round(scorePercent * 10) / 10;

  if (scorePercent >= 95) {
    return {
      headline: `Outstanding, ${USER_NAME}! \u{1F31F}`,
      detail: opts.gated
        ? `${rounded}% is exam-ready form. Next day's material is unlocked — keep this momentum going.`
        : `${rounded}% — that's the kind of score that wins this exam. Brilliant work.`,
    };
  }
  if (scorePercent >= threshold) {
    return {
      headline: `Well done, ${USER_NAME}! \u{1F389}`,
      detail: opts.gated
        ? `You cleared the ${threshold}% bar with ${rounded}% — the next day's material is unlocked. Onward!`
        : `${rounded}% — solid practice round. Check the review below for anything worth a second look.`,
    };
  }
  if (scorePercent >= threshold - 15) {
    return {
      headline: `So close, ${USER_NAME}!`,
      detail: opts.gated
        ? `${rounded}% — just shy of the ${threshold}% needed to unlock the next day. Skim the explanations below, then retake whenever you're ready. No limit on attempts.`
        : `${rounded}% — you're right on the edge. A quick look at the review below and you'll have it.`,
    };
  }
  return {
    headline: `Good effort, ${USER_NAME} — this is how learning happens.`,
    detail: opts.gated
      ? `${rounded}% is below the ${threshold}% needed to move on, but every attempt sharpens recall. Re-read the tricky parts, then retake — as many times as you need, no penalty.`
      : `${rounded}% — use the review below to spot the gaps, then go again. Every retake makes the next one easier.`,
  };
}

// Weekly/monthly cycle tests are revision, not a gate — attempting one (any score)
// already unlocked the next day's reading by the time this renders. The threshold
// only drives whether we nudge toward a retake, never whether they can move on.
export function getCycleTestResultMessage(scorePercent: number, passThreshold = 80): ResultMessage {
  const rounded = Math.round(scorePercent * 10) / 10;

  if (scorePercent >= 95) {
    return {
      headline: `Outstanding revision, ${USER_NAME}! \u{1F31F}`,
      detail: `${rounded}% — this material is locked in. Next day's reading is already unlocked.`,
    };
  }
  if (scorePercent >= passThreshold) {
    return {
      headline: `Well done, ${USER_NAME}! \u{1F389}`,
      detail: `${rounded}% clears the ${passThreshold}% bar — solid revision. Next day's reading is already unlocked.`,
    };
  }
  return {
    headline: `Good attempt, ${USER_NAME} — that's revision done.`,
    detail: `${rounded}% is below the ${passThreshold}% bar, so a retake would help cement this stretch of material. Next day's reading is unlocked either way, no pressure.`,
  };
}
