import { gcd, lcm, num, numericDistractors, type GeneratorTopic } from "./core";

const coprimePair = (r: { int(a: number, b: number): number }, max: number): [number, number] | null => {
  const a = r.int(2, max);
  const b = r.int(2, max);
  return a !== b && gcd(a, b) === 1 ? [Math.min(a, b), Math.max(a, b)] : null;
};

export const hcf: GeneratorTopic = {
  topicId: "b1-hcf",
  unitId: "B-I",
  families: [
    {
      id: "hcf-ratio-larger",
      difficulty: "easy",
      make(r) {
        const pair = coprimePair(r, 11);
        if (!pair) return null;
        const h = r.int(3, 25);
        const k = r.int(1, 4);
        const [a, b] = pair;
        return {
          prompt: `Two numbers are in the ratio ${a * k}:${b * k} and their HCF is ${h}. Find the larger number.`,
          answer: num(b * h),
          distractors: numericDistractors(b * h, [b * k * h, a * h, (a + b) * h]),
          explanation: `${a * k}:${b * k} = ${a}:${b} in lowest terms, so the numbers are ${a}×${h} and ${b}×${h}. Larger = ${b * h}.`,
          trick: "Reduce the ratio to lowest terms first — then numbers = ratio terms × HCF.",
        };
      },
    },
    {
      id: "hcf-lcm-other",
      difficulty: "easy",
      make(r) {
        const pair = coprimePair(r, 12);
        if (!pair) return null;
        const h = r.int(2, 15);
        const [a, b] = pair;
        const x = a * h;
        const y = b * h;
        const l = a * b * h;
        return {
          prompt: `The HCF and LCM of two numbers are ${h} and ${num(l)} respectively. If one number is ${x}, find the other.`,
          answer: num(y),
          distractors: numericDistractors(y, [l / h, l - x, (l * x) / (h * 10)]),
          explanation: `Product of numbers = HCF × LCM → other = ${h} × ${num(l)}/${x} = ${y}.`,
          trick: "HCF × LCM = product of the two numbers.",
        };
      },
    },
    {
      id: "hcf-remainders",
      difficulty: "medium",
      make(r) {
        const d = r.int(12, 70);
        const r1 = r.int(1, d - 1);
        const r2 = r.int(1, d - 1);
        const n1 = d * r.int(3, 20) + r1;
        const n2 = d * r.int(21, 40) + r2;
        if (gcd(n1 - r1, n2 - r2) !== d) return null;
        return {
          prompt: `Find the greatest number that divides ${num(n1)} and ${num(n2)}, leaving remainders ${r1} and ${r2} respectively.`,
          answer: num(d),
          distractors: numericDistractors(d, [d * 2, d + r1, d - 1]),
          explanation: `Subtract the remainders: HCF(${n1 - r1}, ${n2 - r2}) = ${d}.`,
          trick: "Remove each remainder, then take the HCF of what's left.",
        };
      },
    },
    {
      id: "hcf-same-remainder",
      difficulty: "hard",
      make(r) {
        const d = r.int(7, 40);
        const rem = r.int(1, d - 1);
        const ks = [r.int(2, 8), r.int(9, 15), r.int(16, 25)];
        const ns = ks.map((k) => k * d + rem);
        const g = gcd(gcd(ns[1] - ns[0], ns[2] - ns[1]), ns[2] - ns[0]);
        if (g !== d) return null;
        return {
          prompt: `Find the greatest number that divides ${ns.join(", ")} leaving the same remainder in each case.`,
          answer: num(d),
          distractors: numericDistractors(d, [d * 2, d + rem, d - 1]),
          explanation: `Take differences: ${ns[1] - ns[0]}, ${ns[2] - ns[1]}, ${ns[2] - ns[0]}. Their HCF is ${d}.`,
          trick: "Same remainder ⇒ the differences are exact multiples — HCF of the differences.",
        };
      },
    },
    {
      id: "hcf-measure",
      difficulty: "easy",
      make(r) {
        const h = r.pick([6, 7, 8, 9, 12, 14, 15, 18, 21, 24]);
        const ms = [r.int(2, 9), r.int(2, 9), r.int(2, 9)];
        if (new Set(ms).size < 3 || gcd(gcd(ms[0], ms[1]), ms[2]) !== 1) return null;
        const vals = ms.map((m) => m * h).sort((a, b) => a - b);
        return {
          prompt: `What is the greatest capacity of a vessel that can exactly measure ${vals[0]} L, ${vals[1]} L and ${vals[2]} L of oil?`,
          answer: `${h} L`,
          distractors: numericDistractors(h, [h * 2, vals[0], h / 2 + 1], (n) => `${num(n)} L`),
          explanation: `HCF(${vals.join(", ")}) = ${h} L.`,
          trick: "'Greatest that exactly measures/divides' ⇒ HCF.",
        };
      },
    },
    {
      id: "hcf-ratio-sum",
      difficulty: "easy",
      make(r) {
        const pair = coprimePair(r, 12);
        if (!pair) return null;
        const h = r.int(2, 20);
        const [a, b] = pair;
        return {
          prompt: `Two numbers are in the ratio ${a}:${b} and their HCF is ${h}. Find their sum.`,
          answer: num((a + b) * h),
          distractors: numericDistractors((a + b) * h, [a * b * h, (b - a) * h, a + b + h]),
          explanation: `Numbers = ${a * h} and ${b * h}; sum = ${(a + b) * h}.`,
          trick: "Sum = (sum of ratio terms) × HCF.",
        };
      },
    },
    {
      id: "hcf-product",
      difficulty: "medium",
      make(r) {
        const pair = coprimePair(r, 9);
        if (!pair) return null;
        const h = r.int(3, 20);
        const [a, b] = pair;
        if (a === 1) return null;
        // Only unique when a·b has a single coprime split.
        const prod = a * b;
        let splits = 0;
        for (let i = 1; i * i <= prod; i++) if (prod % i === 0 && gcd(i, prod / i) === 1) splits++;
        if (splits !== 2) return null;
        return {
          prompt: `The product of two numbers is ${num(a * b * h * h)} and their HCF is ${h}. If neither number equals the HCF, find the larger number.`,
          answer: num(b * h),
          distractors: numericDistractors(b * h, [a * h, a * b * h, b * h + h]),
          explanation: `Numbers = ${h}x and ${h}y with xy = ${num(a * b * h * h)}/${h * h} = ${prod} and x, y coprime → ${a} and ${b}. Larger = ${b * h}.`,
          trick: "Divide the product by HCF² and split what's left into coprime factors.",
        };
      },
    },
  ],
};

export const lcmTopic: GeneratorTopic = {
  topicId: "b1-lcm",
  unitId: "B-I",
  families: [
    {
      id: "lcm-bells",
      difficulty: "easy",
      make(r) {
        const ivs = [r.pick([6, 8, 9, 10, 12, 15]), r.pick([16, 18, 20, 24, 25]), r.pick([27, 30, 36, 40, 45])];
        const l = ivs.reduce(lcm);
        if (l > 1800) return null;
        const mins = l % 60 === 0;
        return {
          prompt: `Three bells toll together and then at intervals of ${ivs.join(", ")} seconds respectively. After how many seconds will they next toll together?`,
          answer: `${num(l)} seconds`,
          distractors: numericDistractors(l, [ivs[0] * ivs[1] * ivs[2], ivs.reduce(gcd), l * 2], (n) => `${num(n)} seconds`),
          explanation: `LCM(${ivs.join(", ")}) = ${num(l)} seconds${mins ? ` (${l / 60} min)` : ""}.`,
          trick: "'Together again' ⇒ LCM of the intervals.",
        };
      },
    },
    {
      id: "lcm-remainders",
      difficulty: "medium",
      make(r) {
        const ds = [r.pick([4, 6, 8, 12]), r.pick([9, 10, 15]), r.pick([16, 18, 20, 24])];
        const gap = r.int(2, Math.min(...ds) - 1);
        const l = ds.reduce(lcm);
        const ans = l - gap;
        return {
          prompt: `Find the least number which, when divided by ${ds.join(", ")}, leaves remainders ${ds.map((d) => d - gap).join(", ")} respectively.`,
          answer: num(ans),
          distractors: numericDistractors(ans, [l + gap, l, l - (ds[0] - gap)]),
          explanation: `Each remainder is ${gap} short of its divisor, so the number = LCM − ${gap} = ${l} − ${gap} = ${ans}.`,
          trick: "Divisor − remainder constant ⇒ answer = LCM − that constant.",
        };
      },
    },
    {
      id: "lcm-same-remainder",
      difficulty: "easy",
      make(r) {
        const ds = [r.pick([3, 4, 5]), r.pick([6, 8, 9]), r.pick([10, 12, 15])];
        const rem = r.int(1, Math.min(...ds) - 1);
        const l = ds.reduce(lcm);
        return {
          prompt: `Find the least number which, when divided by ${ds.join(", ")}, leaves the same remainder ${rem} in each case.`,
          answer: num(l + rem),
          distractors: numericDistractors(l + rem, [l - rem, l, l * 2 + rem]),
          explanation: `LCM(${ds.join(", ")}) = ${l}; add the remainder: ${l + rem}.`,
          trick: "Same remainder ⇒ LCM + remainder.",
        };
      },
    },
    {
      id: "lcm-hcf-other",
      difficulty: "easy",
      make(r) {
        const h = r.int(2, 12);
        const a = r.int(2, 9);
        const b = r.int(2, 11);
        if (a === b || gcd(a, b) !== 1) return null;
        const l = a * b * h;
        return {
          prompt: `The LCM and HCF of two numbers are ${l} and ${h} respectively. If one number is ${a * h}, find the other.`,
          answer: num(b * h),
          distractors: numericDistractors(b * h, [l / a, l - a * h, b]),
          explanation: `Other = LCM × HCF / ${a * h} = ${l} × ${h}/${a * h} = ${b * h}.`,
          trick: "Product of the numbers = LCM × HCF.",
        };
      },
    },
    {
      id: "lcm-ratio-largest",
      difficulty: "medium",
      make(r) {
        const t = [r.int(2, 4), r.int(5, 6), r.int(7, 9)];
        if (gcd(gcd(t[0], t[1]), t[2]) !== 1) return null;
        const k = r.int(2, 12);
        const l = t.reduce(lcm) * k;
        return {
          prompt: `Three numbers are in the ratio ${t.join(":")} and their LCM is ${num(l)}. Find the largest number.`,
          answer: num(t[2] * k),
          distractors: numericDistractors(t[2] * k, [l / t[2], t[0] * k, t[2] * k * 2]),
          explanation: `Numbers = ${t.map((x) => `${x}k`).join(", ")}; LCM = ${t.reduce(lcm)}k = ${l} → k = ${k}. Largest = ${t[2] * k}.`,
          trick: "Write the numbers as ratio × k; LCM = LCM(ratio terms) × k.",
        };
      },
    },
    {
      id: "lcm-increase",
      difficulty: "medium",
      make(r) {
        const ds = [r.pick([6, 8, 12]), r.pick([9, 15, 18]), r.pick([20, 24, 27, 30])];
        const add = r.int(2, 9);
        const l = ds.reduce(lcm);
        return {
          prompt: `Find the least number which, when increased by ${add}, is exactly divisible by ${ds.join(", ")}.`,
          answer: num(l - add),
          distractors: numericDistractors(l - add, [l + add, l, l * 2 - add]),
          explanation: `Number + ${add} = LCM = ${l}, so the number = ${l - add}.`,
          trick: "'Increased by x' ⇒ LCM − x; 'decreased by x' ⇒ LCM + x.",
        };
      },
    },
    {
      id: "lcm-traffic-lights",
      difficulty: "easy",
      make(r) {
        const ivs = [r.pick([30, 36, 40, 45]), r.pick([48, 60, 72]), r.pick([80, 90, 120])];
        const l = ivs.reduce(lcm);
        if (l % 60 !== 0 || l > 3600) return null;
        return {
          prompt: `Three traffic lights change every ${ivs.join(", ")} seconds. If they all change together now, after how many minutes will they next change together?`,
          answer: `${l / 60} min`,
          distractors: numericDistractors(l / 60, [l / 10, ivs.reduce((a, b) => a + b) / 60, (l / 60) * 2], (n) => `${num(n)} min`),
          explanation: `LCM(${ivs.join(", ")}) = ${l} s = ${l / 60} min.`,
          trick: "Take the LCM in seconds, then convert — don't convert first and lose precision.",
        };
      },
    },
  ],
};
