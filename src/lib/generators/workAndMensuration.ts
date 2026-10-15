import { isClean, lcm, num, numericDistractors, type GeneratorTopic } from "./core";

const days = (n: number) => `${num(n)} days`;

export const timeAndWork: GeneratorTopic = {
  topicId: "b1-time-and-work",
  unitId: "B-I",
  families: [
    {
      id: "work-men-days",
      difficulty: "easy",
      make(r) {
        const m1 = r.int(4, 30);
        const d1 = r.int(6, 40);
        const m2 = r.int(4, 40);
        const d2 = (m1 * d1) / m2;
        if (m1 === m2 || !Number.isInteger(d2)) return null;
        return {
          prompt: `${m1} men complete a work in ${d1} days. In how many days will ${m2} men finish the same work?`,
          answer: days(d2),
          distractors: numericDistractors(d2, [(m2 * d1) / m1, d1 + m1 - m2, d2 + 2], days),
          explanation: `Men × days is constant: ${m1} × ${d1} = ${m2} × x → x = ${d2} days.`,
          trick: "More men ⇒ fewer days: M₁D₁ = M₂D₂.",
        };
      },
    },
    {
      id: "work-together",
      difficulty: "easy",
      make(r) {
        const a = r.int(4, 40);
        const b = r.int(4, 40);
        const t = (a * b) / (a + b);
        if (a === b || !isClean(t)) return null;
        return {
          prompt: `A can finish a job in ${a} days and B in ${b} days. How long will they take working together?`,
          answer: days(t),
          distractors: numericDistractors(t, [(a + b) / 2, Math.abs(a - b), t + 2], days),
          explanation: `Together = ab/(a+b) = ${a}×${b}/${a + b} = ${num(t)} days. (Or: total work = LCM ${lcm(a, b)} units; A does ${lcm(a, b) / a}/day, B ${lcm(a, b) / b}/day.)`,
          trick: "Take total work = LCM of the days; add the per-day units.",
        };
      },
    },
    {
      id: "work-one-alone",
      difficulty: "medium",
      make(r) {
        const t = r.int(4, 30);
        const a = r.int(t + 2, 60);
        const b = (a * t) / (a - t);
        if (!Number.isInteger(b)) return null;
        return {
          prompt: `A and B together finish a job in ${t} days; A alone takes ${a} days. How long does B alone take?`,
          answer: days(b),
          distractors: numericDistractors(b, [a - t, a + t, (a + t) / 2], days),
          explanation: `B's rate = 1/${t} − 1/${a} = 1/${b}, so B takes ${b} days.`,
          trick: "Subtract rates, never the day counts.",
        };
      },
    },
    {
      id: "work-three-together",
      difficulty: "medium",
      make(r) {
        const total = r.pick([60, 72, 90, 120, 144, 180, 240, 360]);
        const divisors = Array.from({ length: 55 }, (_, i) => i + 6).filter((d) => total % d === 0);
        const xs = [r.pick(divisors), r.pick(divisors), r.pick(divisors)].sort((a, b) => a - b);
        const rate = xs.reduce((s, x) => s + total / x, 0);
        const t = total / rate;
        if (new Set(xs).size < 3 || !isClean(t) || xs.reduce(lcm) !== total) return null;
        return {
          prompt: `A, B and C can each do a job alone in ${xs.join(", ")} days respectively. Working together, how long will they take?`,
          answer: days(t),
          distractors: numericDistractors(t, [xs.reduce((a, b) => a + b) / 3, Math.min(...xs) / 2, t + 2], days),
          explanation: `Total work = LCM = ${total} units; rates ${xs.map((x) => total / x).join(" + ")} = ${rate} units/day → ${num(t)} days.`,
          trick: "LCM-as-total-work turns fractions into whole-number rates.",
        };
      },
    },
    {
      id: "work-pipes-leak",
      difficulty: "hard",
      make(r) {
        const f1 = r.int(6, 20);
        const f2 = r.int(8, 30);
        const e = r.int(10, 60);
        const total = [f1, f2, e].reduce(lcm);
        const net = total / f1 + total / f2 - total / e;
        const t = total / net;
        if (f1 === f2 || net <= 0 || !isClean(t) || total > 600) return null;
        return {
          prompt: `Two pipes fill a tank in ${f1} and ${f2} minutes separately; a third pipe empties it in ${e} minutes. With all three open, how long does the tank take to fill?`,
          answer: `${num(t)} minutes`,
          distractors: numericDistractors(t, [(f1 * f2) / (f1 + f2), total / (total / f1 + total / f2 + total / e), t + 3], (n) => `${num(n)} minutes`),
          explanation: `Tank = ${total} units. Rates: +${total / f1}, +${total / f2}, −${total / e} = ${net} units/min → ${num(t)} minutes.`,
          trick: "Treat the emptying pipe as a negative rate.",
        };
      },
    },
    {
      id: "work-efficiency",
      difficulty: "medium",
      make(r) {
        const k = r.pick([2, 3]);
        const t = r.int(4, 30);
        const aAlone = (t * (k + 1)) / k;
        if (!Number.isInteger(aAlone)) return null;
        return {
          prompt: `A is ${k === 2 ? "twice" : "thrice"} as efficient as B. Together they finish a job in ${t} days. How long would A alone take?`,
          answer: days(aAlone),
          distractors: numericDistractors(aAlone, [t * (k + 1), t * k, t / k], days),
          explanation: `Rates A:B = ${k}:1, so A does ${k}/${k + 1} of the joint rate. A alone = ${t} × ${k + 1}/${k} = ${aAlone} days.`,
          trick: "Efficiency ratio k:1 ⇒ A alone = joint time × (k+1)/k.",
        };
      },
    },
    {
      id: "work-provisions",
      difficulty: "medium",
      make(r) {
        const s = r.int(4, 20) * 100;
        const d = r.int(20, 90);
        const join = r.int(1, 10) * 100;
        const nd = (s * d) / (s + join);
        if (!Number.isInteger(nd)) return null;
        return {
          prompt: `${num(s)} soldiers have provisions for ${d} days. If ${num(join)} more soldiers join, how long will the provisions last?`,
          answer: days(nd),
          distractors: numericDistractors(nd, [d - join / 100, (d * (s - join)) / s, nd + 5], days),
          explanation: `Soldier-days constant: ${num(s)} × ${d} = ${num(s + join)} × x → x = ${nd} days.`,
          trick: "Total provisions = people × days; divide by the new head-count.",
        };
      },
    },
    {
      id: "work-fraction-left",
      difficulty: "medium",
      make(r) {
        const a = r.int(6, 30);
        const b = r.int(6, 30);
        const w = r.int(1, 5);
        const total = lcm(a, b);
        const done = w * (total / a + total / b);
        if (a === b || done >= total) return null;
        const left = total - done;
        const g = (x: number, y: number): number => (y ? g(y, x % y) : x);
        const d = g(left, total);
        const ans = `${left / d}/${total / d}`;
        const doneStr = `${done / g(done, total)}/${total / g(done, total)}`;
        return {
          prompt: `A can do a job in ${a} days and B in ${b} days. They work together for ${w} day${w > 1 ? "s" : ""}. What fraction of the job remains?`,
          answer: ans,
          distractors: [doneStr, `${left / d + 1}/${total / d}`, `${Math.max(1, left / d - 1)}/${total / d}`].filter(
            (s, i, arr) => s !== ans && arr.indexOf(s) === i
          ),
          explanation: `Total = ${total} units; per day together ${total / a + total / b} units. In ${w} day(s): ${done} done, ${left} left = ${ans}.`,
          trick: "Work in LCM units, then convert the remainder back to a fraction.",
        };
      },
    },
  ],
};

const PI = 22 / 7;

export const area: GeneratorTopic = {
  topicId: "b1-area",
  unitId: "B-I",
  families: [
    {
      id: "area-triangle",
      difficulty: "easy",
      make(r) {
        const b = r.int(4, 40);
        const h = r.int(4, 30);
        const ans = (b * h) / 2;
        return {
          prompt: `Find the area of a triangle with base ${b} cm and height ${h} cm.`,
          answer: `${num(ans)} cm²`,
          distractors: numericDistractors(ans, [b * h, b + h, ans + b], (n) => `${num(n)} cm²`),
          explanation: `Area = ½ × ${b} × ${h} = ${num(ans)} cm².`,
          trick: "Don't forget the ½.",
        };
      },
    },
    {
      id: "area-trapezium",
      difficulty: "easy",
      make(r) {
        const a = r.int(4, 30);
        const b = r.int(a + 2, 40);
        const h = r.int(3, 20);
        const ans = ((a + b) * h) / 2;
        return {
          prompt: `Find the area of a trapezium with parallel sides ${a} cm and ${b} cm, and height ${h} cm.`,
          answer: `${num(ans)} cm²`,
          distractors: numericDistractors(ans, [(a + b) * h, a * b, ans + h], (n) => `${num(n)} cm²`),
          explanation: `Area = ½(${a} + ${b}) × ${h} = ${num(ans)} cm².`,
          trick: "Average of the parallel sides × height.",
        };
      },
    },
    {
      id: "area-rhombus",
      difficulty: "easy",
      make(r) {
        const d1 = r.int(4, 30);
        const d2 = r.int(4, 30);
        const ans = (d1 * d2) / 2;
        return {
          prompt: `Find the area of a rhombus whose diagonals are ${d1} cm and ${d2} cm.`,
          answer: `${num(ans)} cm²`,
          distractors: numericDistractors(ans, [d1 * d2, (d1 + d2) * 2, ans + d1], (n) => `${num(n)} cm²`),
          explanation: `Area = ½ × d₁ × d₂ = ½ × ${d1} × ${d2} = ${num(ans)} cm².`,
          trick: "Rhombus area = half the product of diagonals.",
        };
      },
    },
    {
      id: "area-circle-from-circumference",
      difficulty: "medium",
      make(r) {
        const rad = r.pick([3.5, 7, 10.5]) * r.int(1, 6);
        const c = 2 * PI * rad;
        const ans = PI * rad * rad;
        return {
          prompt: `Find the area of a circle whose circumference is ${num(c)} cm (use π = 22/7).`,
          answer: `${num(ans)} cm²`,
          distractors: numericDistractors(ans, [PI * 4 * rad * rad, 2 * PI * rad * rad, ans + 22], (n) => `${num(n)} cm²`),
          explanation: `2πr = ${num(c)} → r = ${rad} cm. Area = 22/7 × ${rad}² = ${num(ans)} cm².`,
          trick: "Get r from the circumference first — with π = 22/7 it comes out as a multiple of 7.",
        };
      },
    },
    {
      id: "area-path-outside",
      difficulty: "medium",
      make(r) {
        const l = r.int(10, 100);
        const b = r.int(8, l);
        const w = r.int(1, 5);
        const ans = (l + 2 * w) * (b + 2 * w) - l * b;
        return {
          prompt: `A ${w} m wide path runs around the outside of a ${l} m × ${b} m rectangular field. Find the area of the path.`,
          answer: `${num(ans)} m²`,
          distractors: numericDistractors(ans, [(l + w) * (b + w) - l * b, 2 * w * (l + b), ans + 4 * w * w], (n) => `${num(n)} m²`),
          explanation: `Outer = ${l + 2 * w} × ${b + 2 * w}; inner = ${l} × ${b}. Path = ${(l + 2 * w) * (b + 2 * w)} − ${l * b} = ${num(ans)} m².`,
          trick: "Outside path: 2w(l + b + 2w).",
        };
      },
    },
    {
      id: "area-sector",
      difficulty: "medium",
      make(r) {
        const rad = 7 * r.int(1, 6);
        const ang = r.pick([30, 36, 40, 45, 60, 72, 90, 120, 135, 150, 180]);
        const ans = (ang / 360) * PI * rad * rad;
        if (!isClean(ans)) return null;
        return {
          prompt: `Find the area of a sector of radius ${rad} cm and central angle ${ang}° (use π = 22/7).`,
          answer: `${num(ans)} cm²`,
          distractors: numericDistractors(ans, [(ang / 360) * 2 * PI * rad, ans * 2, PI * rad * rad], (n) => `${num(n)} cm²`),
          explanation: `Area = θ/360 × πr² = ${ang}/360 × 22/7 × ${rad}² = ${num(ans)} cm².`,
          trick: "A sector is just θ/360 of the full circle.",
        };
      },
    },
    {
      id: "area-square-diagonal",
      difficulty: "easy",
      make(r) {
        const d = r.int(4, 30);
        const ans = (d * d) / 2;
        return {
          prompt: `Find the area of a square whose diagonal is ${d} cm.`,
          answer: `${num(ans)} cm²`,
          distractors: numericDistractors(ans, [d * d, (d * d) / 4, d * 2], (n) => `${num(n)} cm²`),
          explanation: `Area = d²/2 = ${d}²/2 = ${num(ans)} cm².`,
          trick: "Square from diagonal: d²/2 — no need to find the side.",
        };
      },
    },
    {
      id: "area-ring",
      difficulty: "medium",
      make(r) {
        const R = 3.5 * r.int(2, 12);
        const rr = 3.5 * r.int(1, R / 3.5 - 1);
        if (!isClean(PI * (R * R - rr * rr))) return null;
        const ans = PI * (R * R - rr * rr);
        return {
          prompt: `Find the area of a circular ring with outer radius ${R} cm and inner radius ${rr} cm (use π = 22/7).`,
          answer: `${num(ans)} cm²`,
          distractors: numericDistractors(ans, [PI * (R - rr) * (R - rr), PI * R * R, 2 * PI * (R - rr)], (n) => `${num(n)} cm²`),
          explanation: `π(R² − r²) = 22/7 × (${R}² − ${rr}²) = 22/7 × ${(R + rr) * (R - rr)} = ${num(ans)} cm².`,
          trick: "R² − r² = (R + r)(R − r) — faster than squaring.",
        };
      },
    },
    {
      id: "area-isosceles",
      difficulty: "hard",
      make(r) {
        const triples: Array<[number, number, number]> = [
          [3, 4, 5], [5, 12, 13], [8, 15, 17], [6, 8, 10], [9, 12, 15], [7, 24, 25],
        ];
        const [half, h, side] = r.pick(triples).slice() as [number, number, number];
        const k = r.int(1, 4);
        const base = 2 * half * k;
        const ans = (base * h * k) / 2;
        return {
          prompt: `Find the area of an isosceles triangle with equal sides ${side * k} cm and base ${base} cm.`,
          answer: `${num(ans)} cm²`,
          distractors: numericDistractors(ans, [(base * side * k) / 2, base * h * k, ans + base], (n) => `${num(n)} cm²`),
          explanation: `Height = √(${side * k}² − ${half * k}²) = ${h * k} cm. Area = ½ × ${base} × ${h * k} = ${num(ans)} cm².`,
          trick: "Drop the height to the base — it splits the triangle into two right triangles (look for a Pythagorean triple).",
        };
      },
    },
  ],
};

export const volume: GeneratorTopic = {
  topicId: "b1-volume",
  unitId: "B-I",
  families: [
    {
      id: "vol-cylinder",
      difficulty: "easy",
      make(r) {
        const rad = r.pick([3.5, 7, 14, 21]);
        const h = r.int(2, 30);
        const ans = PI * rad * rad * h;
        if (!isClean(ans)) return null;
        return {
          prompt: `Find the volume of a cylinder with radius ${num(rad)} cm and height ${h} cm (use π = 22/7).`,
          answer: `${num(ans)} cm³`,
          distractors: numericDistractors(ans, [2 * PI * rad * h, ans / 3, PI * rad * h], (n) => `${num(n)} cm³`),
          explanation: `V = πr²h = 22/7 × ${num(rad)}² × ${h} = ${num(ans)} cm³.`,
          trick: "Cancel the 7 in 22/7 against r first.",
        };
      },
    },
    {
      id: "vol-cone",
      difficulty: "easy",
      make(r) {
        const rad = r.pick([3.5, 7, 14, 21]);
        const h = 3 * r.int(1, 10);
        const ans = (PI * rad * rad * h) / 3;
        if (!isClean(ans)) return null;
        return {
          prompt: `Find the volume of a cone with radius ${num(rad)} cm and height ${h} cm (use π = 22/7).`,
          answer: `${num(ans)} cm³`,
          distractors: numericDistractors(ans, [ans * 3, ans / 2, PI * rad * h], (n) => `${num(n)} cm³`),
          explanation: `V = ⅓πr²h = ⅓ × 22/7 × ${num(rad)}² × ${h} = ${num(ans)} cm³.`,
          trick: "A cone is one-third of the cylinder with the same base and height.",
        };
      },
    },
    {
      id: "vol-cuboid",
      difficulty: "easy",
      make(r) {
        const [l, b, h] = [r.int(3, 25), r.int(2, 20), r.int(2, 15)];
        const ans = l * b * h;
        return {
          prompt: `Find the volume of a cuboid measuring ${l} cm × ${b} cm × ${h} cm.`,
          answer: `${num(ans)} cm³`,
          distractors: numericDistractors(ans, [2 * (l * b + b * h + h * l), l * b + h, ans + l * b], (n) => `${num(n)} cm³`),
          explanation: `V = l × b × h = ${l} × ${b} × ${h} = ${num(ans)} cm³.`,
          trick: "Volume multiplies all three; surface area adds pairwise products.",
        };
      },
    },
    {
      id: "vol-cube-surface",
      difficulty: "medium",
      make(r) {
        const a = r.int(3, 25);
        const v = a * a * a;
        const ans = 6 * a * a;
        return {
          prompt: `If a cube's volume is ${num(v)} cm³, find its total surface area.`,
          answer: `${num(ans)} cm²`,
          distractors: numericDistractors(ans, [4 * a * a, a * a, 6 * a], (n) => `${num(n)} cm²`),
          explanation: `Side = ∛${num(v)} = ${a} cm. TSA = 6a² = ${num(ans)} cm².`,
          trick: "Know cubes up to 20³ by heart for quick cube roots.",
        };
      },
    },
    {
      id: "vol-melt-spheres",
      difficulty: "medium",
      make(r) {
        const small = r.pick([0.5, 1, 1.5, 2, 2.5, 3, 3.5]);
        const k = r.int(2, 6);
        const big = small * k;
        const n = k * k * k;
        return {
          prompt: `A metal sphere of radius ${num(big)} cm is melted and recast into small spheres of radius ${num(small)} cm each. How many small spheres are made?`,
          answer: num(n),
          distractors: numericDistractors(n, [k * k, k, n * 2]),
          explanation: `Number = (R/r)³ = (${num(big)}/${num(small)})³ = ${k}³ = ${n}.`,
          trick: "Volumes scale with the cube of the radius ratio.",
        };
      },
    },
    {
      id: "vol-water-rise",
      difficulty: "hard",
      make(r) {
        const a = r.pick([4, 5, 6, 8, 10, 12]);
        const l = r.pick([10, 12, 15, 16, 20, 24, 25, 30, 40]);
        const b = r.pick([8, 10, 12, 15, 16, 20, 25]);
        const rise = (a * a * a) / (l * b);
        if (!isClean(rise)) return null;
        return {
          prompt: `A solid cube of side ${a} cm is dropped into a rectangular tank of base ${l} cm × ${b} cm containing water. Find the rise in water level.`,
          answer: `${num(rise)} cm`,
          distractors: numericDistractors(rise, [(a * a) / (l + b), (a * a * a) / (l * b * 2), rise + 0.5], (n) => `${num(n)} cm`),
          explanation: `Displaced volume = ${a}³ = ${a * a * a} cm³. Rise = ${a * a * a}/(${l} × ${b}) = ${num(rise)} cm.`,
          trick: "Rise = volume immersed ÷ base area of the tank.",
        };
      },
    },
    {
      id: "vol-sphere-ratio",
      difficulty: "easy",
      make(r) {
        const k = r.int(2, 6);
        const m = r.int(1, k - 1);
        if (m > 1 && k % m === 0) return null;
        const kind = r.pick(["volumes", "surface areas"] as const);
        const g = (x: number, y: number): number => (y ? g(y, x % y) : x);
        if (g(k, m) !== 1) return null;
        const ans = kind === "volumes" ? `${k ** 3}:${m ** 3}` : `${k * k}:${m * m}`;
        return {
          prompt: `The radii of spheres A and B are in the ratio ${k}:${m}. What is the ratio of their ${kind} (A:B)?`,
          answer: ans,
          distractors: [`${k}:${m}`, kind === "volumes" ? `${k * k}:${m * m}` : `${k ** 3}:${m ** 3}`, `${2 * k}:${2 * m + 1}`].filter((s) => s !== ans),
          explanation: `${kind === "volumes" ? "Volume ∝ r³" : "Surface area ∝ r²"}, so the ratio is ${ans}.`,
          trick: "Length ratio k ⇒ area ratio k², volume ratio k³.",
        };
      },
    },
  ],
};
