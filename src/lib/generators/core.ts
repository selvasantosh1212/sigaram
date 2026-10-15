// Shared plumbing for Part B "fresh numbers" generators. Each family is a hand-written
// question pattern (lifted from the static topic questions) that picks new values on
// every call, computes the answer, and builds distractors from typical mistakes.

export type Difficulty = "easy" | "medium" | "hard";

export type Rand = {
  int(min: number, max: number): number;
  pick<T>(items: readonly T[]): T;
  chance(p: number): boolean;
};

export type GeneratedQuestion = {
  prompt: string;
  answer: string;
  distractors: string[];
  explanation: string;
  trick: string;
};

export type Family = {
  id: string;
  difficulty: Difficulty;
  // Returns null when the drawn values don't give a clean answer — the caller retries.
  make(r: Rand): GeneratedQuestion | null;
};

export type GeneratorTopic = {
  topicId: string;
  unitId: string;
  families: Family[];
};

// mulberry32 — small seeded PRNG so a family's output is reproducible in tests.
export function makeRand(seed: number): Rand {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    pick: (items) => items[Math.floor(next() * items.length)],
    chance: (p) => next() < p,
  };
}

export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}

export function lcm(a: number, b: number): number {
  return (a / gcd(a, b)) * b;
}

// True for whole numbers and for values ending in .5 / .25 / .75 — the only
// non-integers a TNPSC aptitude answer realistically has.
export function isClean(n: number): boolean {
  return Number.isFinite(n) && Math.abs(n * 4 - Math.round(n * 4)) < 1e-9;
}

export function num(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  return rounded.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

export const rs = (n: number) => `Rs.${num(n)}`;

// Builds the 3 wrong options: the supplied typical-mistake values first, then nearby
// values, never equal to the answer and never duplicated.
export function numericDistractors(
  answer: number,
  mistakes: number[],
  format: (n: number) => string = num
): string[] {
  const ans = format(answer);
  const out: string[] = [];
  const add = (n: number) => {
    if (!isClean(n) || n <= 0) return;
    const s = format(n);
    if (s !== ans && !out.includes(s)) out.push(s);
  };
  for (const m of mistakes) {
    if (out.length === 3) break;
    add(m);
  }
  const step = Number.isInteger(answer) ? Math.max(1, Math.round(Math.abs(answer) * 0.1)) : 0.5;
  for (let k = 1; out.length < 3 && k < 50; k++) {
    add(answer + k * step);
    if (out.length < 3) add(answer - k * step);
  }
  return out;
}

export function fraction(n: number, d: number): string {
  const g = gcd(n, d);
  return d / g === 1 ? `${n / g}` : `${n / g}/${d / g}`;
}

export function ratio(...parts: number[]): string {
  const g = parts.reduce((acc, p) => gcd(acc, p));
  return parts.map((p) => p / g).join(":");
}
