import { num, numericDistractors, type GeneratorTopic } from "./core";

const A = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const pos = (c: string) => A.indexOf(c) + 1;
const letter = (n: number) => A[(((n - 1) % 26) + 26) % 26];
const shiftWord = (w: string, k: number) => [...w].map((c) => letter(pos(c) + k)).join("");

const WORDS = [
  "PLAN", "STAR", "MOON", "TRIM", "BOOK", "LAMP", "RIVER", "CHAIR", "SMILE", "TRAIN", "GREEN", "HOUSE",
  "PAPER", "WATER", "CLOUD", "BRICK", "FARM", "GOLD", "KITE", "NEST", "DESK", "ROAD", "SALT", "TREE",
];

export const numberSeries: GeneratorTopic = {
  topicId: "b2-number-series",
  unitId: "B-II",
  families: [
    {
      id: "series-ap-nth",
      difficulty: "easy",
      make(r) {
        const a = r.int(2, 100);
        const d = r.pick([-5, -4, -3, 2, 3, 4, 5, 6, 7, 9, 11]);
        const n = r.int(10, 30);
        const ans = a + (n - 1) * d;
        if (ans <= 0) return null;
        return {
          prompt: `Find the ${n}th term of the AP: ${[0, 1, 2, 3].map((i) => a + i * d).join(", ")}, ...`,
          answer: num(ans),
          distractors: numericDistractors(ans, [a + n * d, a + (n - 2) * d, n * d]),
          explanation: `tₙ = a + (n − 1)d = ${a} + ${n - 1} × ${d} = ${ans}.`,
          trick: "Use n − 1 steps, not n.",
        };
      },
    },
    {
      id: "series-gp-nth",
      difficulty: "easy",
      make(r) {
        const a = r.int(1, 7);
        const q = r.pick([2, 3, 4]);
        const n = r.int(5, q === 2 ? 10 : 7);
        const ans = a * q ** (n - 1);
        return {
          prompt: `Find the ${n}th term of the GP: ${[0, 1, 2].map((i) => a * q ** i).join(", ")}, ...`,
          answer: num(ans),
          distractors: numericDistractors(ans, [a * q ** n, a * q ** (n - 2), a * q * (n - 1)]),
          explanation: `tₙ = arⁿ⁻¹ = ${a} × ${q}^${n - 1} = ${num(ans)}.`,
          trick: "Count powers carefully — the first term has r⁰.",
        };
      },
    },
    {
      id: "series-second-diff",
      difficulty: "medium",
      make(r) {
        const start = r.int(1, 15);
        const d0 = r.int(2, 9);
        const dd = r.int(1, 4);
        const terms = [start];
        for (let i = 0; i < 6; i++) terms.push(terms[i] + d0 + i * dd);
        const ans = terms[6];
        return {
          prompt: `Find the next term: ${terms.slice(0, 6).join(", ")}, ?`,
          answer: num(ans),
          distractors: numericDistractors(ans, [ans + dd, ans - dd, terms[5] + d0 + 4 * dd]),
          explanation: `Differences: ${terms.slice(1, 6).map((t, i) => t - terms[i]).join(", ")} — rising by ${dd}. Next difference ${d0 + 5 * dd}, so ${terms[5]} + ${d0 + 5 * dd} = ${ans}.`,
          trick: "When gaps aren't constant, look at the gaps between the gaps.",
        };
      },
    },
    {
      id: "series-missing-middle",
      difficulty: "medium",
      make(r) {
        const start = r.int(1, 20);
        const d0 = r.int(2, 8);
        const dd = r.int(1, 3);
        const terms = [start];
        for (let i = 0; i < 6; i++) terms.push(terms[i] + d0 + i * dd);
        const gap = r.int(3, 5);
        const ans = terms[gap];
        const shown = terms.map((t, i) => (i === gap ? "___" : String(t)));
        return {
          prompt: `Fill in the blank: ${shown.join(", ")}.`,
          answer: num(ans),
          distractors: numericDistractors(ans, [ans + dd, ans - dd, ans + 2]),
          explanation: `Differences grow by ${dd}: ${terms.slice(1).map((t, i) => t - terms[i]).join(", ")}. Blank = ${ans}.`,
          trick: "Check the filled blank against the term AFTER it as well.",
        };
      },
    },
    {
      id: "series-power-plus",
      difficulty: "hard",
      make(r) {
        const p = r.pick([2, 3]);
        const c = r.pick([-2, -1, 1, 2, 3]);
        const s = r.int(1, 5);
        const terms = Array.from({ length: 6 }, (_, i) => (s + i) ** p + c);
        const ans = (s + 6) ** p + c;
        if (terms[0] <= 0) return null;
        return {
          prompt: `Find the next term: ${terms.join(", ")}, ?`,
          answer: num(ans),
          distractors: numericDistractors(ans, [(s + 6) ** p, (s + 6) ** p - c, ans + (s + 6)]),
          explanation: `Each term is n${p === 2 ? "²" : "³"} ${c < 0 ? "−" : "+"} ${Math.abs(c)} for n = ${s}, ${s + 1}, …. Next: ${s + 6}${p === 2 ? "²" : "³"} ${c < 0 ? "−" : "+"} ${Math.abs(c)} = ${ans}.`,
          trick: `Shift every term by ${-c} and check for perfect ${p === 2 ? "squares" : "cubes"}.`,
        };
      },
    },
    {
      id: "series-mul-add",
      difficulty: "medium",
      make(r) {
        const m = r.pick([2, 3]);
        const c = r.pick([-1, 1, 2, 3]);
        let t = r.int(1, 5);
        const terms = [t];
        for (let i = 0; i < 5; i++) terms.push((t = t * m + c));
        const ans = terms[5];
        if (ans > 5000 || terms[1] <= terms[0]) return null;
        return {
          prompt: `Find the next term: ${terms.slice(0, 5).join(", ")}, ?`,
          answer: num(ans),
          distractors: numericDistractors(ans, [terms[4] * m, terms[4] * m + 2 * c, terms[4] + (terms[4] - terms[3]) * 2 + 1]),
          explanation: `Each term = previous × ${m} ${c < 0 ? "−" : "+"} ${Math.abs(c)}. ${terms[4]} × ${m} ${c < 0 ? "−" : "+"} ${Math.abs(c)} = ${ans}.`,
          trick: "If the ratio of successive terms is nearly constant, try × k ± c.",
        };
      },
    },
    {
      id: "series-n-n-plus-1",
      difficulty: "easy",
      make(r) {
        const s = r.int(1, 6);
        const k = r.pick([1, 2, 3]);
        const terms = Array.from({ length: 7 }, (_, i) => (s + i) * (s + i + k));
        const gap = r.int(4, 6);
        const ans = terms[gap];
        const shown = terms.slice(0, gap + 1).map((t, i) => (i === gap ? "___" : String(t)));
        return {
          prompt: `Find the missing number: ${shown.join(", ")}.`,
          answer: num(ans),
          distractors: numericDistractors(ans, [ans + 2, (s + gap) ** 2, ans - 2]),
          explanation: `Terms are n × (n + ${k}) for n = ${s}, ${s + 1}, …: ${s + gap} × ${s + gap + k} = ${ans}.`,
          trick: "Factor each term into two numbers with a fixed gap.",
        };
      },
    },
    {
      id: "series-odd-cube",
      difficulty: "easy",
      make(r) {
        const kind = r.pick(["cube", "square"] as const);
        const pw = kind === "cube" ? 3 : 2;
        const bases = new Set<number>();
        while (bases.size < 3) bases.add(r.int(2, kind === "cube" ? 9 : 20));
        const good = [...bases].map((b) => b ** pw);
        let odd = r.int(good[0] - 5, good[2] + 30);
        while (Math.round(Math.pow(odd, 1 / pw)) ** pw === odd || odd <= 1) odd++;
        return {
          prompt: `Which of these is NOT a perfect ${kind}?`,
          answer: num(odd),
          distractors: good.map(num),
          explanation: `${good.map((g, i) => `${g} = ${[...bases][i]}${pw === 3 ? "³" : "²"}`).join(", ")}; ${odd} is not a perfect ${kind}.`,
          trick: kind === "cube" ? "Memorise cubes 1–12." : "Perfect squares never end in 2, 3, 7 or 8.",
        };
      },
    },
  ],
};

export const alphanumeric: GeneratorTopic = {
  topicId: "b2-alphanumeric-reasoning",
  unitId: "B-II",
  families: [
    {
      id: "alpha-shift-code",
      difficulty: "easy",
      make(r) {
        const k = r.pick([-3, -2, -1, 1, 2, 3, 4]);
        const w1 = r.pick(WORDS);
        const w2 = r.pick(WORDS);
        if (w1 === w2) return null;
        const ans = shiftWord(w2, k);
        return {
          prompt: `If ${w1} is coded as ${shiftWord(w1, k)}, how is ${w2} coded using the same rule?`,
          answer: ans,
          distractors: [shiftWord(w2, -k), shiftWord(w2, k + 1), shiftWord(w2, k - 1)].filter((s) => s !== ans),
          explanation: `Each letter moves ${Math.abs(k)} place${Math.abs(k) > 1 ? "s" : ""} ${k > 0 ? "forward" : "back"}: ${w2} → ${ans}.`,
          trick: "Check the shift on two letters of the example before applying it.",
        };
      },
    },
    {
      id: "alpha-reverse-code",
      difficulty: "medium",
      make(r) {
        const k = r.pick([-1, 1, 2]);
        const w1 = r.pick(WORDS);
        const w2 = r.pick(WORDS);
        if (w1 === w2) return null;
        const code = (w: string) => shiftWord([...w].reverse().join(""), k);
        const ans = code(w2);
        return {
          prompt: `If ${w1} is coded as ${code(w1)}, how is ${w2} coded using the same rule?`,
          answer: ans,
          distractors: [
            shiftWord(w2, k),
            shiftWord([...w2].reverse().join(""), -k),
            shiftWord([...w2].reverse().join(""), k + 1),
            [...ans].reverse().join(""),
          ].filter(
            (s, i, arr) => s !== ans && arr.indexOf(s) === i
          ),
          explanation: `The word is reversed, then each letter is shifted ${k > 0 ? "+" : ""}${k}: ${w2} → ${[...w2].reverse().join("")} → ${ans}.`,
          trick: "If the code letters look 'backwards', reverse the word first, then find the shift.",
        };
      },
    },
    {
      id: "alpha-sum-code",
      difficulty: "easy",
      make(r) {
        const w1 = r.pick(WORDS.filter((w) => w.length === 4));
        const w2 = r.pick(WORDS.filter((w) => w.length === 4));
        if (w1 === w2) return null;
        const sum = (w: string) => [...w].reduce((s, c) => s + pos(c), 0);
        const ans = sum(w2);
        return {
          prompt: `If ${w1} is coded as ${sum(w1)} (sum of letter positions), what is ${w2} coded as?`,
          answer: num(ans),
          distractors: numericDistractors(ans, [ans + 4, ans - 4, ans + 1]),
          explanation: `${[...w2].map((c) => `${c}=${pos(c)}`).join(", ")} → ${ans}.`,
          trick: "Learn EJOTY (5, 10, 15, 20, 25) to place any letter fast.",
        };
      },
    },
    {
      id: "alpha-letter-series",
      difficulty: "easy",
      make(r) {
        const start = r.int(1, 8);
        const step = r.int(0, 1);
        const d0 = r.int(step ? 1 : 2, 4);
        const terms = [start];
        for (let i = 0; i < 4; i++) terms.push(terms[i] + d0 + i * step);
        const ans = letter(terms[4]);
        if (terms[4] > 26) return null;
        return {
          prompt: `Find the next letter in the sequence: ${terms.slice(0, 4).map(letter).join(", ")}, ?`,
          answer: ans,
          distractors: [letter(terms[4] + 1), letter(terms[4] - 1), letter(terms[4] + 2)].filter((s) => s !== ans),
          explanation: `Positions ${terms.slice(0, 4).join(", ")} — gaps ${d0}, ${d0 + step}, ${d0 + 2 * step}. Next gap ${d0 + 3 * step} → ${terms[4]} = ${ans}.`,
          trick: "Convert letters to positions and look at the gaps.",
        };
      },
    },
    {
      id: "alpha-pair-series",
      difficulty: "medium",
      make(r) {
        const a = r.int(1, 6);
        const b = r.int(20, 26);
        const da = r.int(3, 5);
        const db = r.int(3, 5);
        const pairs = Array.from({ length: 5 }, (_, i) => letter(a + i * da) + letter(b - i * db));
        if (b - 4 * db < 1 || a + 4 * da > 26) return null;
        const gap = 3;
        const ans = pairs[gap];
        const shown = pairs.map((p, i) => (i === gap ? "?" : p));
        return {
          prompt: `Find the missing term: ${shown.join(", ")}.`,
          answer: ans,
          distractors: [
            letter(a + gap * da + 1) + letter(b - gap * db),
            letter(a + gap * da) + letter(b - gap * db + 1),
            letter(a + gap * da - 1) + letter(b - gap * db - 1),
          ].filter((s) => s !== ans),
          explanation: `First letters move +${da}, second letters move −${db}: ${ans}.`,
          trick: "Track the first and second letters as two separate series.",
        };
      },
    },
  ],
};
