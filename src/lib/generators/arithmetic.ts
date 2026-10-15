import { fraction, gcd, isClean, num, numericDistractors, ratio, rs, type GeneratorTopic } from "./core";

export const simplification: GeneratorTopic = {
  topicId: "b1-simplification",
  unitId: "B-I",
  families: [
    {
      id: "simp-diff-squares",
      difficulty: "easy",
      make(r) {
        const a = r.int(40, 99);
        const b = r.int(5, a - 10);
        const ans = a * a - b * b;
        return {
          prompt: `Find the value of ${a}² − ${b}².`,
          answer: num(ans),
          distractors: numericDistractors(ans, [(a - b) * (a - b), (a - b) * (a + b) + 2 * b, a * a + b * b]),
          explanation: `a² − b² = (a + b)(a − b) = ${a + b} × ${a - b} = ${num(ans)}.`,
          trick: "Never square both — (a+b)(a−b) is two quick multiplications.",
        };
      },
    },
    {
      id: "simp-diff-squares-divide",
      difficulty: "easy",
      make(r) {
        const a = r.int(150, 500);
        const b = r.int(100, a - 20);
        const ans = a + b;
        return {
          prompt: `Simplify (${a} × ${a} − ${b} × ${b}) ÷ (${a} − ${b}).`,
          answer: num(ans),
          distractors: numericDistractors(ans, [a - b, ans + 10, ans - 10]),
          explanation: `(a² − b²)/(a − b) = a + b = ${a} + ${b} = ${num(ans)}.`,
          trick: "(a² − b²)/(a − b) collapses to a + b instantly.",
        };
      },
    },
    {
      id: "simp-perfect-square",
      difficulty: "easy",
      make(r) {
        const a = r.int(51, 97);
        const b2 = r.pick([100, 110, 120, 150, 200]) - a;
        if (b2 <= 0) return null;
        const s = (a + b2) * (a + b2);
        return {
          prompt: `Find the value of ${a} × ${a} + ${b2} × ${b2} + 2 × ${a} × ${b2}.`,
          answer: num(s),
          distractors: numericDistractors(s, [a * a + b2 * b2, s - 2 * a * b2 + 1, (a - b2) * (a - b2)]),
          explanation: `a² + b² + 2ab = (a + b)² = (${a} + ${b2})² = ${a + b2}² = ${num(s)}.`,
          trick: "Spot the (a+b)² pattern — the sum usually comes out as a round number.",
        };
      },
    },
    {
      id: "simp-bodmas",
      difficulty: "easy",
      make(r) {
        const a = r.int(5, 25);
        const b = r.int(2, 9);
        const d = r.pick([2, 4, 5]);
        const c = d * r.int(2, 10);
        const e = r.int(2, 6);
        const ans = a * b - c / d + e * e;
        return {
          prompt: `Simplify: ${a} × ${b} − ${c} ÷ ${d} + ${e}².`,
          answer: num(ans),
          distractors: numericDistractors(ans, [(a * b - c) / d + e * e, a * b - c / d + 2 * e, (a * b - c / d + e) * e]),
          explanation: `Powers first: ${e}² = ${e * e}. Then × and ÷: ${a * b} and ${c / d}. Finally ${a * b} − ${c / d} + ${e * e} = ${num(ans)}.`,
          trick: "BODMAS: brackets, orders (powers), then ÷ and × left to right, then + and −.",
        };
      },
    },
    {
      id: "simp-fraction-of",
      difficulty: "easy",
      make(r) {
        const d1 = r.pick([3, 4, 5, 6, 8]);
        const n1 = r.int(1, d1 - 1);
        const d2 = r.pick([3, 5, 7, 9]);
        const n2 = r.int(1, d2 - 1);
        const x = d1 * r.int(4, 15);
        const y = d2 * r.int(4, 15);
        const ans = (n1 * x) / d1 + (n2 * y) / d2;
        return {
          prompt: `Simplify ${fraction(n1, d1)} of ${x} + ${fraction(n2, d2)} of ${y}.`,
          answer: num(ans),
          distractors: numericDistractors(ans, [(n1 * x) / d1 + y, x + (n2 * y) / d2, ans + d1]),
          explanation: `${fraction(n1, d1)} × ${x} = ${(n1 * x) / d1}; ${fraction(n2, d2)} × ${y} = ${(n2 * y) / d2}; total ${num(ans)}.`,
          trick: "'of' means multiply — divide by the denominator first to keep numbers small.",
        };
      },
    },
    {
      id: "simp-ratio-expression",
      difficulty: "medium",
      make(r) {
        const p = r.int(2, 9);
        const q = r.int(2, 9);
        if (p === q || gcd(p, q) !== 1) return null;
        const [a, b, c, d] = [r.int(2, 5), r.int(1, 4), r.int(2, 6), 1];
        const top = a * p + b * q;
        const bottom = c * p - d * q;
        if (bottom <= 0) return null;
        return {
          prompt: `If p : q = ${p} : ${q}, find (${a}p + ${b}q) : (${c}p − q).`,
          answer: ratio(top, bottom),
          distractors: [ratio(bottom, top), ratio(top + 1, bottom), ratio(a * p, c * p)].filter(
            (s, i, arr) => s !== ratio(top, bottom) && arr.indexOf(s) === i
          ),
          explanation: `Put p = ${p}, q = ${q}: (${a}×${p} + ${b}×${q}) : (${c}×${p} − ${q}) = ${top} : ${bottom} = ${ratio(top, bottom)}.`,
          trick: "Substitute the ratio terms directly as values — the common multiplier cancels.",
        };
      },
    },
    {
      id: "simp-cubes",
      difficulty: "medium",
      make(r) {
        const a = r.int(3, 12);
        const b = r.int(2, a - 1);
        const plus = r.chance(0.5);
        const ans = plus ? a * a - a * b + b * b : a * a + a * b + b * b;
        return {
          prompt: plus
            ? `Simplify (${a}³ + ${b}³) ÷ (${a}² − ${a}×${b} + ${b}²).`
            : `Simplify (${a}³ − ${b}³) ÷ (${a} − ${b}).`,
          answer: num(plus ? a + b : ans),
          distractors: numericDistractors(plus ? a + b : ans, plus ? [a - b, a * b, a + b + 1] : [a * a + b * b, a * a - a * b + b * b, ans + a]),
          explanation: plus
            ? `a³ + b³ = (a + b)(a² − ab + b²), so the quotient is a + b = ${a + b}.`
            : `a³ − b³ = (a − b)(a² + ab + b²), so the quotient is ${a}² + ${a}×${b} + ${b}² = ${ans}.`,
          trick: "Sum/difference of cubes factorises — never compute the cubes.",
        };
      },
    },
    {
      id: "simp-surds",
      difficulty: "medium",
      make(r) {
        const base = r.pick([2, 3, 5]);
        const [k1, k2, k3] = [r.int(2, 6), r.int(2, 6), r.int(1, 4)];
        const coef = k1 + k2 - k3;
        if (coef <= 0 || new Set([k1, k2, k3]).size < 3) return null;
        const show = (k: number) => `√${k * k * base}`;
        const s = (c: number) => (c === 1 ? `√${base}` : `${c}√${base}`);
        return {
          prompt: `Simplify ${show(k1)} + ${show(k2)} − ${show(k3)}.`,
          answer: s(coef),
          distractors: [s(k1 + k2 + k3), s(coef + 1), `√${(k1 * k1 + k2 * k2 - k3 * k3) * base}`].filter((x) => x !== s(coef)),
          explanation: `${show(k1)} = ${s(k1)}, ${show(k2)} = ${s(k2)}, ${show(k3)} = ${s(k3)}. Total = ${s(coef)}.`,
          trick: "Pull the largest perfect square out of each surd, then add like terms.",
        };
      },
    },
  ],
};

export const percentage: GeneratorTopic = {
  topicId: "b1-percentage",
  unitId: "B-I",
  families: [
    {
      id: "pct-of-of",
      difficulty: "easy",
      make(r) {
        const a = r.pick([10, 20, 25, 30, 40, 50, 60, 75]);
        const b = r.pick([10, 20, 25, 30, 40, 50, 60, 80]);
        const n = r.pick([200, 400, 500, 600, 800, 1000, 1200, 1500, 2000]);
        const ans = (a * b * n) / 10000;
        if (!isClean(ans)) return null;
        return {
          prompt: `What is ${a}% of ${b}% of ${num(n)}?`,
          answer: num(ans),
          distractors: numericDistractors(ans, [((a + b) * n) / 100, (a * n) / 100, ans * 10]),
          explanation: `${a}/100 × ${b}/100 × ${num(n)} = ${num(ans)}.`,
          trick: "Multiply the two percentages first (a×b/100 %) — then take that % of the number.",
        };
      },
    },
    {
      id: "pct-reverse",
      difficulty: "easy",
      make(r) {
        const p = r.pick([12, 15, 25, 35, 40, 45, 60, 75]);
        const y = r.int(4, 60) * 20;
        const part = (p * y) / 100;
        if (!Number.isInteger(part)) return null;
        return {
          prompt: `If ${p}% of y = ${num(part)}, find y.`,
          answer: num(y),
          distractors: numericDistractors(y, [(part * p) / 100, part + p, y * 1.1]),
          explanation: `y = ${num(part)} × 100/${p} = ${num(y)}.`,
          trick: "Value ÷ percentage × 100.",
        };
      },
    },
    {
      id: "pct-increase",
      difficulty: "easy",
      make(r) {
        const old = r.int(2, 60) * 50;
        const pct = r.pick([5, 10, 12, 15, 20, 25, 30, 40]);
        const nw = old * (1 + pct / 100);
        if (!Number.isInteger(nw)) return null;
        const wrong = ((nw - old) / nw) * 100;
        return {
          prompt: `The price of an item rises from ₹${num(old)} to ₹${num(nw)}. What is the percentage increase?`,
          answer: `${pct}%`,
          distractors: numericDistractors(pct, [wrong, nw - old, pct + 5], (n) => `${num(n)}%`),
          explanation: `Increase = ${num(nw - old)}. % increase = ${num(nw - old)}/${num(old)} × 100 = ${pct}%.`,
          trick: "Always divide the change by the ORIGINAL value, not the new one.",
        };
      },
    },
    {
      id: "pct-savings",
      difficulty: "easy",
      make(r) {
        const spend = r.pick([60, 65, 70, 75, 80, 85, 90]);
        const income = r.int(10, 80) * 1000;
        const save = (income * (100 - spend)) / 100;
        if (!Number.isInteger(save)) return null;
        return {
          prompt: `A person spends ${spend}% of their income and saves the rest. If they save ₹${num(save)}, find their income.`,
          answer: `₹${num(income)}`,
          distractors: numericDistractors(income, [(save * 100) / spend, save * spend / 10, income + save], (n) => `₹${num(n)}`),
          explanation: `Savings = ${100 - spend}% of income → income = ${num(save)} × 100/${100 - spend} = ₹${num(income)}.`,
          trick: "Use the savings percentage (100 − spend), not the spend percentage.",
        };
      },
    },
    {
      id: "pct-successive-discount",
      difficulty: "medium",
      make(r) {
        const d1 = r.pick([10, 15, 20, 25]);
        const d2 = r.pick([5, 10, 20]);
        const price = r.int(4, 60) * 500;
        const sold = price * (1 - d1 / 100) * (1 - d2 / 100);
        if (!Number.isInteger(sold)) return null;
        return {
          prompt: `An item is sold for ₹${num(sold)} after successive discounts of ${d1}% and ${d2}%. Find its marked price.`,
          answer: `₹${num(price)}`,
          distractors: numericDistractors(price, [sold / (1 - (d1 + d2) / 100), sold * (1 + (d1 + d2) / 100), price - 500], (n) => `₹${num(n)}`),
          explanation: `Marked × ${(100 - d1) / 100} × ${(100 - d2) / 100} = ${num(sold)} → marked = ₹${num(price)}.`,
          trick: "Successive discounts multiply — they are NOT the same as one discount of their sum.",
        };
      },
    },
    {
      id: "pct-profit",
      difficulty: "easy",
      make(r) {
        const cp = r.int(2, 60) * 40;
        const pct = r.pick([5, 10, 12.5, 15, 20, 25, 30]);
        const sp = cp * (1 + pct / 100);
        if (!Number.isInteger(sp)) return null;
        return {
          prompt: `A trader buys an item for ₹${num(cp)} and sells it for ₹${num(sp)}. Find the profit percentage.`,
          answer: `${num(pct)}%`,
          distractors: numericDistractors(pct, [((sp - cp) / sp) * 100, sp - cp, pct + 5], (n) => `${num(n)}%`),
          explanation: `Profit = ₹${num(sp - cp)}. Profit% = ${num(sp - cp)}/${num(cp)} × 100 = ${num(pct)}%.`,
          trick: "Profit % is always on cost price.",
        };
      },
    },
    {
      id: "pct-marks",
      difficulty: "easy",
      make(r) {
        const total = r.pick([25, 40, 50, 60, 75, 80, 100, 120, 125, 150, 200, 250, 300, 400, 500]);
        const pct = r.pick([45, 55, 60, 64, 72, 75, 80, 85, 90]);
        const got = (total * pct) / 100;
        if (!Number.isInteger(got)) return null;
        return {
          prompt: `A student scores ${got} out of ${total} marks. What percentage did the student score?`,
          answer: `${pct}%`,
          distractors: numericDistractors(pct, [got, pct - 5, pct + 5], (n) => `${num(n)}%`),
          explanation: `${got}/${total} × 100 = ${pct}%.`,
          trick: `Scale ${total} to 100: multiply both numbers by ${num(100 / total)}.`,
        };
      },
    },
    {
      id: "pct-area-error",
      difficulty: "hard",
      make(r) {
        const a = r.pick([2, 4, 5, 6, 8, 10, 12, 15, 20, 25]);
        const b = r.pick([2, 4, 5, 6, 8, 10, 20]);
        const sign = r.chance(0.5) ? -1 : 1;
        const net = a + sign * b + (a * sign * b) / 100;
        if (!isClean(net) || net === 0) return null;
        const fmt = (n: number) => `${num(Math.abs(n))}% ${n > 0 ? "excess" : "deficit"}`;
        const wrongs = [a + sign * b, -net, a * b / 100].filter((v) => v !== 0 && fmt(v) !== fmt(net));
        return {
          prompt: `The length of a rectangle is measured ${a}% in excess and the breadth ${b}% ${sign < 0 ? "in deficit" : "in excess"}. Find the percentage error in the calculated area.`,
          answer: fmt(net),
          distractors: Array.from(new Set(wrongs.map(fmt))).slice(0, 3),
          explanation: `Error = a + b + ab/100 = ${a} ${sign < 0 ? "−" : "+"} ${b} + (${a}×${sign * b})/100 = ${num(net)}%.`,
          trick: "Area error uses the successive-change formula a + b + ab/100.",
        };
      },
    },
  ],
};

export const ratioProportion: GeneratorTopic = {
  topicId: "b1-ratio-proportion",
  unitId: "B-I",
  families: [
    {
      id: "ratio-share",
      difficulty: "easy",
      make(r) {
        const a = r.int(1, 9);
        const b = r.int(1, 9);
        if (a === b || gcd(a, b) !== 1) return null;
        const total = (a + b) * r.int(50, 900);
        const share = (total * b) / (a + b);
        return {
          prompt: `Rs.${num(total)} is divided between P and Q in the ratio ${a}:${b}. Find Q's share.`,
          answer: rs(share),
          distractors: numericDistractors(share, [(total * a) / (a + b), total / b, share + (a + b) * 10], rs),
          explanation: `Q's share = ${b}/${a + b} × ${num(total)} = ${rs(share)}.`,
          trick: "One part = total ÷ sum of ratio terms; then multiply by Q's term.",
        };
      },
    },
    {
      id: "ratio-chain",
      difficulty: "easy",
      make(r) {
        const [a, b, c, d] = [r.int(1, 9), r.int(2, 9), r.int(2, 9), r.int(2, 11)];
        if (a === b || c === d) return null;
        const ans = ratio(a * c, b * d);
        return {
          prompt: `If P:Q = ${a}:${b} and Q:R = ${c}:${d}, find P:R.`,
          answer: ans,
          distractors: [ratio(a, d), ratio(a * d, b * c), ratio(a + c, b + d)].filter((s, i, arr) => s !== ans && arr.indexOf(s) === i),
          explanation: `P/R = (P/Q)(Q/R) = (${a}/${b})(${c}/${d}) = ${a * c}/${b * d} = ${ans}.`,
          trick: "Multiply the ratios: P:R = (P×Q′):(Q×R) where Q′ is Q's term in the second ratio.",
        };
      },
    },
    {
      id: "ratio-fourth-proportional",
      difficulty: "easy",
      make(r) {
        const a = r.int(2, 12);
        const k = r.int(2, 8);
        const c = r.int(2, 15);
        const x = c * k;
        return {
          prompt: `Find the fourth proportional to ${a}, ${a * k} and ${c}.`,
          answer: num(x),
          distractors: numericDistractors(x, [(a * c) / k, a * k + c, x + k]),
          explanation: `${a} : ${a * k} = ${c} : x → x = ${a * k} × ${c}/${a} = ${x}.`,
          trick: "Fourth proportional = (b × c)/a.",
        };
      },
    },
    {
      id: "ratio-mean-proportional",
      difficulty: "easy",
      make(r) {
        const m = r.int(2, 9);
        const n = r.int(m + 1, 12);
        const k = r.int(1, 3);
        const a = k * m * m;
        const b = k * n * n;
        const ans = k * m * n;
        return {
          prompt: `Find the mean proportional between ${a} and ${b}.`,
          answer: num(ans),
          distractors: numericDistractors(ans, [(a + b) / 2, Math.sqrt(a + b), ans + k]),
          explanation: `Mean proportional = √(${a} × ${b}) = √${a * b} = ${ans}.`,
          trick: "Mean proportional is the geometric mean √(ab), not the average.",
        };
      },
    },
    {
      id: "ratio-mixture-water",
      difficulty: "medium",
      make(r) {
        const m = r.int(2, 7);
        const w = r.int(1, 3);
        const w2 = w + r.int(1, 3);
        const unit = r.int(2, 10);
        const total = (m + w) * unit;
        const added = (w2 - w) * unit;
        if (gcd(m, w) !== 1 || gcd(m, w2) !== 1) return null;
        return {
          prompt: `A ${total} L mixture has milk and water in the ratio ${m}:${w}. How much water must be added to make the ratio ${m}:${w2}?`,
          answer: `${num(added)} L`,
          distractors: numericDistractors(added, [(total * (w2 - w)) / (m + w2), w2 * unit, added + unit], (n) => `${num(n)} L`),
          explanation: `Milk = ${m * unit} L stays fixed. New water must be ${m * unit} × ${w2}/${m} = ${w2 * unit} L, so add ${w2 * unit} − ${w * unit} = ${num(added)} L.`,
          trick: "Hold the unchanged ingredient fixed and scale the ratio to it.",
        };
      },
    },
    {
      id: "ratio-ages-ago",
      difficulty: "easy",
      make(r) {
        const a = r.int(12, 45);
        const b = r.int(a + 3, 70);
        const t = r.int(2, 10);
        if (a - t <= 0) return null;
        const ans = ratio(a - t, b - t);
        return {
          prompt: `Two people are now ${a} and ${b} years old. Find the ratio of their ages ${t} years ago.`,
          answer: ans,
          distractors: [ratio(a, b), ratio(a + t, b + t), ratio(a - t, b)].filter((s, i, arr) => s !== ans && arr.indexOf(s) === i),
          explanation: `${t} years ago: ${a - t} and ${b - t} → ${ans}.`,
          trick: "Subtract the years from BOTH ages before forming the ratio.",
        };
      },
    },
    {
      id: "ratio-partnership",
      difficulty: "medium",
      make(r) {
        const p = r.int(2, 10) * 1000;
        const q = r.int(2, 10) * 1000;
        const mp = r.int(2, 12);
        const mq = r.int(2, 12);
        const sp = p * mp;
        const sq = q * mq;
        const g = gcd(sp, sq);
        const parts = sp / g + sq / g;
        const profit = parts * r.int(2, 40) * 50;
        const share = (profit * (sp / g)) / parts;
        return {
          prompt: `P invests Rs.${num(p)} for ${mp} months and Q invests Rs.${num(q)} for ${mq} months. If the total profit is Rs.${num(profit)}, find P's share.`,
          answer: rs(share),
          distractors: numericDistractors(share, [(profit * p) / (p + q), profit - share, (profit * mp) / (mp + mq)], rs),
          explanation: `Ratio = ${num(p)}×${mp} : ${num(q)}×${mq} = ${ratio(sp, sq)}. P's share = ${sp / g}/${parts} × ${num(profit)} = ${rs(share)}.`,
          trick: "Profit is shared in the ratio of capital × time, not capital alone.",
        };
      },
    },
    {
      id: "ratio-shadow",
      difficulty: "easy",
      make(r) {
        const pole = r.int(2, 12);
        const shadow = r.int(2, 12);
        if (pole === shadow) return null;
        const k = r.int(3, 15);
        const towerShadow = shadow * k;
        const tower = pole * k;
        return {
          prompt: `A ${pole} m pole casts a ${shadow} m shadow. At the same time a tower casts a ${towerShadow} m shadow. Find the tower's height.`,
          answer: `${tower} m`,
          distractors: numericDistractors(tower, [(towerShadow * shadow) / pole, towerShadow + pole - shadow, tower + pole], (n) => `${num(n)} m`),
          explanation: `Height/shadow is constant: ${pole}/${shadow} = h/${towerShadow} → h = ${tower} m.`,
          trick: "Same time of day ⇒ height ∝ shadow.",
        };
      },
    },
  ],
};
