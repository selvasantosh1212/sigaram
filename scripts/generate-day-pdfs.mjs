// Backup + in-app-download script: renders every day's reading material + mock test
// (with answers) into a standalone PDF. Writes to backup-pdfs/ (the archival copy)
// and public/day-pdfs/ (served directly by the running app at /day-pdfs/day-NNN.pdf).
// Usage: node scripts/generate-day-pdfs.mjs [startDay] [endDay]
import puppeteer from 'puppeteer';
import { promises as fsp } from 'fs';
import path from 'path';

const ROOT = path.resolve(import.meta.dirname, '..');
const DAYS_PATH = path.join(ROOT, 'content/days/days.json');
const TOPICS_DIR = path.join(ROOT, 'content/topics');
const OUTPUT_DIR = path.join(ROOT, 'backup-pdfs');
const PUBLIC_OUTPUT_DIR = path.join(ROOT, 'public/day-pdfs');

const startDay = Number(process.argv[2]) || 1;
const endDay = Number(process.argv[3]) || Infinity;

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderTopicSection(partLabel, topic, isFirst) {
  const qaHtml = topic.reading.qa
    .map(
      (qa) => `
      <div class="qa-item">
        <p class="q"><strong>Q:</strong> ${escapeHtml(qa.question)}</p>
        <p class="a"><strong>A:</strong> ${escapeHtml(qa.answer)}</p>
      </div>`
    )
    .join('');

  const mockHtml = topic.mockTest.questions
    .map((q, i) => {
      const optionsHtml = q.options
        .map((opt, idx) => {
          const isCorrect = idx === q.correctIndex;
          return `<li class="${isCorrect ? 'correct-option' : ''}">${String.fromCharCode(65 + idx)}. ${escapeHtml(opt)}${isCorrect ? ' &#10003;' : ''}</li>`;
        })
        .join('');
      return `
      <div class="mock-item">
        <p class="prompt"><strong>${i + 1}.</strong> ${escapeHtml(q.prompt)}</p>
        <ul class="options">${optionsHtml}</ul>
        <p class="explanation"><em>Explanation:</em> ${escapeHtml(q.explanation)} <span class="tag">[${q.difficulty}, ${q.sourceTag}]</span></p>
      </div>`;
    })
    .join('');

  return `
    <section class="part-section" style="${isFirst ? '' : 'page-break-before: always;'}">
      <h2>Part ${partLabel}: ${escapeHtml(topic.name)}</h2>
      <h3>Reading Material</h3>
      <p class="intro">${escapeHtml(topic.reading.intro)}</p>
      ${qaHtml}
      <h3>Mock Test (with answers)</h3>
      ${mockHtml}
    </section>`;
}

function renderDayHtml(dayNumber, topicA, topicB, topicC) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: Georgia, 'Times New Roman', serif; font-size: 12px; line-height: 1.5; color: #1a1a1a; margin: 0; padding: 0 24px; }
  h1 { font-size: 20px; border-bottom: 2px solid #333; padding-bottom: 8px; }
  h2 { font-size: 16px; color: #1a3d6b; margin-top: 28px; }
  h3 { font-size: 13px; color: #444; margin-top: 16px; text-transform: uppercase; letter-spacing: 0.03em; }
  .intro { font-style: italic; color: #333; margin-bottom: 12px; }
  .qa-item { margin-bottom: 8px; }
  .q { margin: 4px 0 2px 0; }
  .a { margin: 0 0 0 14px; color: #2a2a2a; }
  .mock-item { margin-bottom: 12px; }
  .prompt { margin: 6px 0 4px 0; }
  .options { list-style: none; margin: 0 0 4px 14px; padding: 0; }
  .options li { margin: 2px 0; }
  .correct-option { font-weight: bold; color: #1a6b1a; }
  .explanation { margin: 0 0 0 14px; color: #555; font-size: 11px; }
  .tag { color: #888; font-size: 10px; }
  .part-section { margin-bottom: 20px; }
</style>
</head>
<body>
  <h1>Day ${dayNumber} &mdash; TNPSC Group 2A Study Material</h1>
  ${renderTopicSection('A &ndash; General Studies', topicA, true)}
  ${renderTopicSection('B &ndash; Aptitude &amp; Mental Ability', topicB, false)}
  ${renderTopicSection('C &ndash; General English', topicC, false)}
</body>
</html>`;
}

async function main() {
  const days = JSON.parse(await fsp.readFile(DAYS_PATH, 'utf8'));
  await fsp.mkdir(OUTPUT_DIR, { recursive: true });
  await fsp.mkdir(PUBLIC_OUTPUT_DIR, { recursive: true });

  const topicCache = new Map();
  async function getTopic(topicId) {
    if (!topicCache.has(topicId)) {
      const raw = await fsp.readFile(path.join(TOPICS_DIR, `${topicId}.json`), 'utf8');
      topicCache.set(topicId, JSON.parse(raw));
    }
    return topicCache.get(topicId);
  }

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const daysToRender = days.filter((d) => d.dayNumber >= startDay && d.dayNumber <= endDay);
  console.log(`Generating ${daysToRender.length} day PDFs (Day ${startDay}-${Math.min(endDay, days.length)})...`);

  for (const day of daysToRender) {
    const [topicA, topicB, topicC] = await Promise.all([
      getTopic(day.partATopicId),
      getTopic(day.partBTopicId),
      getTopic(day.partCTopicId),
    ]);
    const html = renderDayHtml(day.dayNumber, topicA, topicB, topicC);
    await page.setContent(html, { waitUntil: 'load' });
    const fileName = `day-${String(day.dayNumber).padStart(3, '0')}.pdf`;
    const outPath = path.join(OUTPUT_DIR, fileName);
    await page.pdf({ path: outPath, format: 'A4', margin: { top: '20px', bottom: '20px', left: '10px', right: '10px' } });
    await fsp.copyFile(outPath, path.join(PUBLIC_OUTPUT_DIR, fileName));
    console.log(`  wrote ${outPath} (+ public copy)`);
  }

  await browser.close();
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
