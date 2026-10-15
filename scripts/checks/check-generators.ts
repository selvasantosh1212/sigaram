// Stress-tests every Part B generator family: run with `npx jiti scripts/checks/check-generators.ts`.
import { GENERATOR_TOPICS, generateFromFamily } from "../../src/lib/generators";

const RUNS = 1000;
let failures = 0;
for (const topic of GENERATOR_TOPICS) {
  for (const family of topic.families) {
    let nulls = 0;
    const prompts = new Set<string>(); // prompt + options, so option-only variation counts
    for (let i = 0; i < RUNS; i++) {
      const q = generateFromFamily(topic, family, i * 104729 + 17);
      if (!q) {
        nulls++;
        continue;
      }
      prompts.add(q.prompt + q.options.join("|"));
      const text = [q.prompt, ...q.options, q.explanation].join(" ");
      const bad =
        /NaN|undefined|Infinity|\bnull\b/.test(text) ||
        new Set(q.options).size !== 4 ||
        q.options.some((o) => o.trim() === "");
      if (bad) {
        failures++;
        if (failures < 15) console.log("BAD", family.id, JSON.stringify(q));
      }
    }
    const flag = nulls > 0 || prompts.size < 30 ? "  <-- check" : "";
    console.log(`${topic.topicId.padEnd(26)} ${family.id.padEnd(30)} unique=${prompts.size} failed=${nulls}${flag}`);
  }
}
console.log(failures === 0 ? "ALL OK" : `${failures} bad questions`);
process.exit(failures === 0 ? 0 : 1);
