// Validates content/full-mock-bank/*.json (or just the files passed as arguments):
// schema, 4 distinct options, answer index, unique ids, topicId belongs to the unit,
// passage references, and near-duplicates against every topic + bank prompt.
// Run: npx jiti scripts/checks/validate-bank.ts [file ...]
import { readFileSync, readdirSync } from "fs";
import path from "path";
import { z } from "zod";
import { MockQuestionSchema } from "../../src/lib/types";

const ROOT = path.join(__dirname, "..", "..");
const BANK_DIR = path.join(ROOT, "content", "full-mock-bank");
const TOPICS_DIR = path.join(ROOT, "content", "topics");

const BankFileSchema = z.object({
  unitId: z.string(),
  passages: z.array(z.object({ id: z.string(), title: z.string().optional(), text: z.string().min(200) })).default([]),
  questions: z.array(MockQuestionSchema.extend({ topicId: z.string(), passageId: z.string().optional() })),
});

const tokens = (s: string) =>
  new Set(
    s
      .toLowerCase()
      .replace(/[^a-z0-9஀-௿]+/g, " ")
      .split(" ")
      .filter((w) => w.length > 2)
  );
function jaccard(a: Set<string>, b: Set<string>) {
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  return inter / (a.size + b.size - inter || 1);
}

type Ref = { where: string; prompt: string; tok: Set<string>; options: string; passageKey?: string; stemTok?: Set<string> };
const existing: Ref[] = [];
const topicUnit = new Map<string, string>();
for (const f of readdirSync(TOPICS_DIR).filter((f) => f.endsWith(".json"))) {
  const t = JSON.parse(readFileSync(path.join(TOPICS_DIR, f), "utf8"));
  topicUnit.set(t.topicId, t.unitId);
  for (const q of t.mockTest.questions)
    existing.push({ where: `${t.topicId}/${q.id}`, prompt: q.prompt, tok: tokens(q.prompt), options: [...q.options].sort().join("|") });
}

const allBankFiles = readdirSync(BANK_DIR).filter((f) => f.endsWith(".json"));
const targets = process.argv.slice(2).length ? process.argv.slice(2).map((p) => path.basename(p)) : allBankFiles;

let errors = 0;
const err = (m: string) => {
  errors++;
  if (errors <= 60) console.log("ERROR", m);
};
const seenIds = new Set<string>();
const positions = [0, 0, 0, 0];
let count = 0;

// Other bank files count as "existing" for duplicate checks too.
for (const f of allBankFiles.filter((f) => !targets.includes(f))) {
  const b = JSON.parse(readFileSync(path.join(BANK_DIR, f), "utf8"));
  for (const q of b.questions) {
    seenIds.add(q.id);
    existing.push({ where: `${f}/${q.id}`, prompt: q.prompt, tok: tokens(q.prompt), options: [...q.options].sort().join("|") });
  }
}

for (const f of targets) {
  let bank: z.infer<typeof BankFileSchema>;
  try {
    bank = BankFileSchema.parse(JSON.parse(readFileSync(path.join(BANK_DIR, f), "utf8")));
  } catch (e) {
    err(`${f}: ${(e as Error).message.slice(0, 500)}`);
    continue;
  }
  const passageIds = new Set(bank.passages.map((p) => p.id));
  const usedPassages = new Map<string, number>();
  const local: Ref[] = [];
  for (const q of bank.questions) {
    count++;
    const where = `${f}/${q.id}`;
    if (seenIds.has(q.id)) err(`${where}: duplicate id`);
    seenIds.add(q.id);
    if (!q.id.startsWith(`bank-${bank.unitId}-`)) err(`${where}: id must start with bank-${bank.unitId}-`);
    if (topicUnit.get(q.topicId) !== bank.unitId) err(`${where}: topicId ${q.topicId} is not a ${bank.unitId} topic`);
    if (q.options.length !== 4) err(`${where}: needs exactly 4 options`);
    if (new Set(q.options.map((o) => o.trim().toLowerCase())).size !== q.options.length) err(`${where}: duplicate options`);
    if (q.correctIndex < 0 || q.correctIndex >= q.options.length) err(`${where}: correctIndex out of range`);
    else positions[q.correctIndex]++;
    if (q.explanation.trim().length < 15) err(`${where}: explanation too thin`);
    if (q.passageId) {
      if (!passageIds.has(q.passageId)) err(`${where}: unknown passageId ${q.passageId}`);
      usedPassages.set(q.passageId, (usedPassages.get(q.passageId) ?? 0) + 1);
    }
    // Passage questions have generic stems ("What is the main idea?"), so compare them
    // together with their passage text.
    const passage = q.passageId ? bank.passages.find((p) => p.id === q.passageId)?.text ?? "" : "";
    const tok = tokens(`${passage} ${q.prompt}`);
    const opts = [...q.options].sort().join("|");
    if (tok.size >= 4) {
      const passageKey = q.passageId ? `${f}:${q.passageId}` : undefined;
      const stemTok = tokens(q.prompt);
      for (const other of [...existing, ...local]) {
        // Two questions on the same passage share its text — compare their stems only.
        const samePassage = passageKey !== undefined && other.passageKey === passageKey;
        const sim = samePassage ? jaccard(stemTok, other.stemTok!) : jaccard(tok, other.tok);
        if (sim > 0.8 || (sim > 0.6 && opts === other.options)) {
          err(`${where}: near-duplicate (${sim.toFixed(2)}) of ${other.where}: "${other.prompt.slice(0, 90)}"`);
          break;
        }
      }
    }
    local.push({
      where,
      prompt: q.prompt,
      tok,
      options: opts,
      passageKey: q.passageId ? `${f}:${q.passageId}` : undefined,
      stemTok: tokens(q.prompt),
    });
  }
  for (const p of bank.passages) if (!usedPassages.has(p.id)) err(`${f}: passage ${p.id} has no questions`);
}

const total = positions.reduce((a, b) => a + b, 0) || 1;
console.log(`${count} questions checked in ${targets.length} file(s).`);
console.log("Correct-answer positions A-D:", positions.map((p) => `${Math.round((p / total) * 100)}%`).join(" "));
console.log(errors === 0 ? "VALID" : `${errors} error(s)`);
process.exit(errors === 0 ? 0 : 1);
