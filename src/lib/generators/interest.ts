import { isClean, num, numericDistractors, rs, type GeneratorTopic } from "./core";

export const simpleInterest: GeneratorTopic = {
  topicId: "b1-simple-interest",
  unitId: "B-I",
  families: [
    {
      id: "si-basic",
      difficulty: "easy",
      make(r) {
        const p = r.int(2, 60) * 500;
        const rate = r.pick([4, 5, 6, 8, 9, 10, 12, 15]);
        const t = r.int(1, 5);
        const si = (p * rate * t) / 100;
        if (!isClean(si)) return null;
        return {
          prompt: `Find the simple interest on ${rs(p)} for ${t} year${t > 1 ? "s" : ""} at ${rate}% per annum.`,
          answer: rs(si),
          distractors: numericDistractors(si, [p + si, (p * rate) / 100, (p * rate * (t + 1)) / 100], rs),
          explanation: `SI = PRT/100 = (${num(p)} × ${rate} × ${t})/100 = ${rs(si)}.`,
          trick: "SI = PRT/100 — find 1 year's interest (P × R/100) first, then multiply by T.",
        };
      },
    },
    {
      id: "si-double-time",
      difficulty: "easy",
      make(r) {
        const rate = r.pick([2, 2.5, 4, 5, 6.25, 8, 10, 12.5, 16, 20, 25]);
        const mult = r.pick([2, 3, 4, 5]);
        const t = ((mult - 1) * 100) / rate;
        if (!isClean(t)) return null;
        const word = { 2: "double", 3: "triple", 4: "become 4 times", 5: "become 5 times" }[mult]!;
        return {
          prompt: `In how many years will a sum ${word} itself at ${rate}% per annum simple interest?`,
          answer: `${num(t)} years`,
          distractors: numericDistractors(t, [(mult * 100) / rate, 100 / rate, t + 5], (n) => `${num(n)} years`),
          explanation: `To ${word}, SI must be ${mult - 1} × P. T = ${(mult - 1) * 100}/R = ${(mult - 1) * 100}/${rate} = ${num(t)} years.`,
          trick: `Becoming n times means SI = (n−1)P, so T = (n−1)×100/R — use n−1, not n.`,
        };
      },
    },
    {
      id: "si-rate-from-multiple",
      difficulty: "easy",
      make(r) {
        const t = r.pick([4, 5, 8, 10, 12, 16, 20, 25, 40, 50]);
        const mult = r.pick([2, 3]);
        const rate = ((mult - 1) * 100) / t;
        if (!isClean(rate)) return null;
        const word = mult === 2 ? "doubles" : "triples";
        return {
          prompt: `A sum ${word} itself in ${t} years at simple interest. Find the rate per annum.`,
          answer: `${num(rate)}%`,
          distractors: numericDistractors(rate, [(mult * 100) / t, 100 / t / 2, rate + 2.5], (n) => `${num(n)}%`),
          explanation: `SI = ${mult - 1}P in ${t} years, so R = ${(mult - 1) * 100}/${t} = ${num(rate)}%.`,
          trick: "R × T = (n−1) × 100 for a sum that becomes n times itself.",
        };
      },
    },
    {
      id: "si-rate-from-amount",
      difficulty: "medium",
      make(r) {
        const p = r.int(4, 40) * 1000;
        const rate = r.pick([4, 5, 6, 7, 8, 9, 10, 12]);
        const t = r.int(2, 5);
        const a = p + (p * rate * t) / 100;
        return {
          prompt: `A sum of ${rs(p)} becomes ${rs(a)} in ${t} years at simple interest. Find the rate per annum.`,
          answer: `${rate}%`,
          distractors: numericDistractors(rate, [(((a - p) * 100) / p), rate * t, rate + 1], (n) => `${num(n)}%`),
          explanation: `SI = ${num(a)} − ${num(p)} = ${num(a - p)}. R = (SI × 100)/(P × T) = (${num(a - p)} × 100)/(${num(p)} × ${t}) = ${rate}%.`,
          trick: "Subtract first to get SI, then R = 100·SI/(P·T).",
        };
      },
    },
    {
      id: "si-principal",
      difficulty: "easy",
      make(r) {
        const p = r.int(2, 50) * 500;
        const rate = r.pick([4, 5, 6, 8, 10, 12]);
        const t = r.int(2, 5);
        const si = (p * rate * t) / 100;
        if (!Number.isInteger(si)) return null;
        return {
          prompt: `What sum will yield ${rs(si)} as simple interest in ${t} years at ${rate}% per annum?`,
          answer: rs(p),
          distractors: numericDistractors(p, [(si * 100) / rate, (si * rate * t) / 100 + si, p * 1.2], rs),
          explanation: `P = (SI × 100)/(R × T) = (${num(si)} × 100)/(${rate} × ${t}) = ${rs(p)}.`,
          trick: "P = 100·SI/(R·T) — just rearrange SI = PRT/100.",
        };
      },
    },
    {
      id: "si-two-amounts",
      difficulty: "medium",
      make(r) {
        const p = r.int(4, 40) * 500;
        const rate = r.pick([4, 5, 6, 8, 10, 12, 15]);
        const t1 = r.int(2, 4);
        const t2 = t1 + r.int(1, 3);
        const yearly = (p * rate) / 100;
        if (!Number.isInteger(yearly)) return null;
        const a1 = p + yearly * t1;
        const a2 = p + yearly * t2;
        return {
          prompt: `A sum amounts to ${rs(a1)} in ${t1} years and ${rs(a2)} in ${t2} years at simple interest. Find the principal.`,
          answer: rs(p),
          distractors: numericDistractors(p, [a1 - yearly, a1 - (a2 - a1), p + yearly], rs),
          explanation: `Interest for ${t2 - t1} year(s) = ${num(a2)} − ${num(a1)} = ${num(a2 - a1)}, so 1 year = ${num(yearly)}. P = ${num(a1)} − ${t1} × ${num(yearly)} = ${rs(p)}.`,
          trick: "The gap between two amounts is pure interest for the gap in years — get one year's SI, then strip it off.",
        };
      },
    },
    {
      id: "si-split",
      difficulty: "hard",
      make(r) {
        const total = r.int(5, 30) * 1000;
        const r1 = r.pick([10, 12, 15]);
        const r2 = r.pick([5, 6, 8]);
        const x = r.int(1, total / 1000 - 1) * 1000;
        const interest = (x * r1 + (total - x) * r2) / 100;
        if (!Number.isInteger(interest)) return null;
        return {
          prompt: `${rs(total)} is lent partly at ${r1}% and partly at ${r2}% simple interest, giving a total annual interest of ${rs(interest)}. Find the amount lent at ${r1}%.`,
          answer: rs(x),
          distractors: numericDistractors(x, [total - x, x + 1000, x - 1000], rs),
          explanation: `Let x be at ${r1}%: ${r1}x/100 + ${r2}(${num(total)} − x)/100 = ${num(interest)} → ${r1 - r2}x = ${num(interest * 100 - total * r2)} → x = ${rs(x)}.`,
          trick: `Alligation: if everything were at ${r2}%, interest would be ${num((total * r2) / 100)}; the extra ${num(interest - (total * r2) / 100)} comes from the ${r1 - r2}% gap.`,
        };
      },
    },
    {
      id: "si-rate-increase",
      difficulty: "medium",
      make(r) {
        const p = r.int(4, 40) * 500;
        const inc = r.pick([1, 2, 3, 4, 5]);
        const t = r.int(2, 6);
        const extra = (p * inc * t) / 100;
        if (!Number.isInteger(extra)) return null;
        return {
          prompt: `If the rate of interest is increased by ${inc}%, a sum yields ${rs(extra)} more as simple interest over ${t} years. Find the sum.`,
          answer: rs(p),
          distractors: numericDistractors(p, [(extra * 100) / inc, (extra * 100) / t, p * 2], rs),
          explanation: `Extra SI = P × ${inc} × ${t}/100 = ${num(extra)} → P = ${num(extra)} × 100/${inc * t} = ${rs(p)}.`,
          trick: "Only the rate change earns the extra interest: P = 100 × extra/(ΔR × T).",
        };
      },
    },
  ],
};

export const compoundInterest: GeneratorTopic = {
  topicId: "b1-compound-interest",
  unitId: "B-I",
  families: [
    {
      id: "ci-annual",
      difficulty: "medium",
      make(r) {
        const p = r.int(1, 50) * 1000;
        const rate = r.pick([5, 10, 15, 20]);
        const t = r.pick([2, 2, 3]);
        const a = p * Math.pow(1 + rate / 100, t);
        const ci = a - p;
        if (!isClean(ci)) return null;
        const si = (p * rate * t) / 100;
        return {
          prompt: `Find the compound interest on ${rs(p)} at ${rate}% per annum for ${t} years, compounded annually.`,
          answer: rs(ci),
          distractors: numericDistractors(ci, [si, a, ci + (p * rate) / 100], rs),
          explanation: `A = ${num(p)} × (1 + ${rate}/100)^${t} = ${num(a)}. CI = ${num(a)} − ${num(p)} = ${rs(ci)}.`,
          trick: `Year-by-year: add ${rate}% to the running amount each year — easier than computing the power for small T.`,
        };
      },
    },
    {
      id: "ci-si-difference",
      difficulty: "medium",
      make(r) {
        const p = r.int(2, 40) * 1000;
        const rate = r.pick([4, 5, 8, 10, 12, 15, 20]);
        const d = (p * rate * rate) / 10000;
        if (!isClean(d)) return null;
        return {
          prompt: `Find the difference between compound interest and simple interest for 2 years on ${rs(p)} at ${rate}% per annum.`,
          answer: rs(d),
          distractors: numericDistractors(d, [(p * rate) / 100, d * 2, (p * rate * 2) / 100], rs),
          explanation: `For 2 years, CI − SI = P(R/100)² = ${num(p)} × (${rate}/100)² = ${rs(d)}.`,
          trick: "2-year CI−SI = P·R²/10000 — it's just the interest earned on the first year's interest.",
        };
      },
    },
    {
      id: "ci-depreciation",
      difficulty: "easy",
      make(r) {
        const v = r.int(2, 50) * 4000;
        const rate = r.pick([5, 10, 15, 20, 25]);
        const t = 2;
        const after = v * Math.pow(1 - rate / 100, t);
        if (!isClean(after)) return null;
        return {
          prompt: `A machine valued at ${rs(v)} depreciates by ${rate}% every year. Find its value after ${t} years.`,
          answer: rs(after),
          distractors: numericDistractors(after, [v * (1 - (rate * t) / 100), v * (1 - rate / 100), v * Math.pow(1 + rate / 100, t)], rs),
          explanation: `Value = ${num(v)} × (1 − ${rate}/100)² = ${rs(after)}.`,
          trick: "Depreciation is compound interest with a minus sign — multiply by (1 − R/100) once per year.",
        };
      },
    },
    {
      id: "ci-population",
      difficulty: "easy",
      make(r) {
        const base = r.int(2, 80) * 1600;
        const rate = r.pick([5, 10, 12.5, 20, 25]);
        const after = base * Math.pow(1 + rate / 100, 2);
        if (!Number.isInteger(after)) return null;
        return {
          prompt: `A town's population of ${num(base)} grows by ${rate}% every year. Find the population after 2 years.`,
          answer: num(after),
          distractors: numericDistractors(after, [base * (1 + (2 * rate) / 100), base * (1 + rate / 100), after + base / 100]),
          explanation: `${num(base)} × (1 + ${rate}/100)² = ${num(after)}.`,
          trick: "Growth compounds: the second year's increase is on the already-grown figure.",
        };
      },
    },
    {
      id: "ci-two-amounts",
      difficulty: "hard",
      make(r) {
        const rate = r.pick([10, 20, 25, 50]);
        const p = r.int(1, 40) * r.pick([1000, 1600, 2000, 2500, 5000, 8000, 10000]);
        const a2 = p * Math.pow(1 + rate / 100, 2);
        const a4 = p * Math.pow(1 + rate / 100, 4);
        if (!Number.isInteger(a2) || !Number.isInteger(a4)) return null;
        return {
          prompt: `A sum becomes ${rs(a2)} after 2 years and ${rs(a4)} after 4 years at compound interest. Find the original sum.`,
          answer: rs(p),
          distractors: numericDistractors(p, [a2 - (a4 - a2), a2 / (1 + rate / 100), p * 1.1], rs),
          explanation: `Growth factor for 2 years = ${num(a4)}/${num(a2)} = ${num(a4 / a2)}. P = ${num(a2)}/${num(a4 / a2)} = ${rs(p)}.`,
          trick: "Equal gaps in time mean equal growth factors: P = A₂²/A₄.",
        };
      },
    },
    {
      id: "ci-half-yearly",
      difficulty: "hard",
      make(r) {
        const p = r.int(1, 50) * 2000;
        const rate = r.pick([4, 8, 10, 12, 20]);
        const half = rate / 2;
        const a = p * Math.pow(1 + half / 100, 2);
        const ci = a - p;
        if (!isClean(ci)) return null;
        return {
          prompt: `Find the compound interest on ${rs(p)} for 1 year at ${rate}% per annum, compounded half-yearly.`,
          answer: rs(ci),
          distractors: numericDistractors(ci, [(p * rate) / 100, ci + 100, (p * half) / 100], rs),
          explanation: `Half-yearly: rate ${half}% per half-year, 2 periods. A = ${num(p)} × (1.${String(half).padStart(2, "0")})² = ${num(a)}; CI = ${rs(ci)}.`,
          trick: "Half-yearly compounding: halve the rate, double the periods.",
        };
      },
    },
    {
      id: "ci-net-change",
      difficulty: "easy",
      make(r) {
        const up = r.pick([10, 15, 20, 25, 30, 40, 50, 60]);
        const down = r.chance(0.4) ? up : r.pick([5, 10, 15, 20, 25, 30, 40]);
        const net = up - down - (up * down) / 100;
        if (!isClean(net)) return null;
        const fmt = (n: number) => (n === 0 ? "No change" : `${num(Math.abs(n))}% ${n < 0 ? "decrease" : "increase"}`);
        const wrong = [up - down, -(up * down) / 100 + 1, -net].map(fmt).filter((s) => s !== fmt(net));
        const options = Array.from(new Set(wrong));
        while (options.length < 3) options.push(`${num(Math.abs(net) + options.length * 2 + 1)}% decrease`);
        return {
          prompt: `A quantity is first increased by ${up}% and then decreased by ${down}%. What is the net percentage change?`,
          answer: fmt(net),
          distractors: options.slice(0, 3),
          explanation: `Net = a + b + ab/100 = ${up} − ${down} − (${up}×${down})/100 = ${num(net)}%.`,
          trick: "Successive change formula: a + b + ab/100, with decreases taken as negative.",
        };
      },
    },
  ],
};
