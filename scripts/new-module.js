// Naye module ka poora scaffold ek command mein (time bachane ke liye):
//   npm run module:new -- <module> [sub-module]
//   Example: npm run module:new -- workspace          (sub-module = module)
//            npm run module:new -- ticket detail
// Banta hai: test plan, test case doc (khali table), spec skeleton, page object skeleton, defect log.
// Jo file pehle se maujood ho use nahi chhedta.
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const [module_, subArg] = process.argv.slice(2);
if (!module_) {
  console.log('Usage: npm run module:new -- <module> [sub-module]   (e.g. npm run module:new -- workspace)');
  process.exit(1);
}
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const pretty = (s) => s.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
const pascal = (s) => pretty(s).replace(/\s+/g, '');
const m = slug(module_);
const sub = slug(subArg || module_);
const idPrefix = `TC_${sub.replace(/-/g, '').toUpperCase()}`;

function write(rel, content) {
  const f = path.join(ROOT, rel);
  if (fs.existsSync(f)) { console.log(`skip (already exists): ${rel}`); return; }
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, content, 'utf8');
  console.log(`created: ${rel}`);
}
const tpl = (name) => fs.readFileSync(path.join(ROOT, 'docs', 'templates', name), 'utf8');
const today = (() => { const d = new Date(); const t = (n) => String(n).padStart(2, '0'); return `${t(d.getDate())}-${t(d.getMonth() + 1)}-${d.getFullYear()}`; })();

write(`docs/test-plans/${m}.md`, tpl('test-plan.md').replace(/<Module>/g, pretty(m)).replace(/<module>/g, m).replace(/<sub>/g, sub).replace('DD-MM-YYYY', today));
write(`docs/defects/${m}.md`, tpl('defect-log.md').replace(/<Module>/g, pretty(m)).replace(/MODULE/g, m.replace(/-/g, '').toUpperCase()).replace('DD-MM-YYYY', today));

write(`docs/test-cases/${m}-${sub}.md`, `# ${pretty(m)} - ${pretty(sub)} Test Cases

**Automation:** \`tests/${m}/${sub}.spec.ts\`  |  **Report:** \`reports/${m}/${sub} test <DD-MM-YYYY>_<HH-mm>.html\` (all reports: \`reports/index.html\`)

## Overview
Is sub-module ka 2-3 line ka taaruf.

## Scope and notes
- Kya test hota hai, kya nahi, koi khatra (live data, lockout).

## A. Group name

| ID | Title | Priority | Preconditions | Steps | Expected result |
| --- | --- | --- | --- | --- | --- |

> ID format: \`${idPrefix}_01\`, \`${idPrefix}_02\` ... Title simple English mein, data ke saath. Rules: docs/TEST_CASE_STANDARD.md
> Cases likhne ke baad: \`npm run cases:csv\` (master CSV) aur \`npm run cases:check\`.
`);

write(`tests/${m}/${sub}.spec.ts`, `// ${pretty(m)} - ${pretty(sub)}. Test cases ka doc: docs/test-cases/${m}-${sub}.md
import { test, expect } from '../../fixtures/test-fixtures';

test.describe('${pretty(m)} - ${pretty(sub)}', () => {
  // Har test ka title: "${idPrefix}_NN - <simple English sentence with data>" aur doc ke ID se bilkul match kare.
  // test('${idPrefix}_01 - ...', async ({ page }) => { ... });
  void expect; // jab pehla test likho to ye line hata do
});
`);

write(`pages/${pascal(sub)}Page.ts`, `// ${pretty(sub)} page ka Page Object: locators aur actions sirf yahan. Test files mein locators nahi.
import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class ${pascal(sub)}Page extends BasePage {
  // readonly someElement: Locator;

  constructor(page: Page) {
    super(page);
    // this.someElement = page.getByRole('button', { name: '...' });
  }

  async open(): Promise<void> {
    await this.goto('/'); // TODO: sahi URL
  }
}

void expect;
export type { Locator };
`);

console.log(`
Agla: 1) docs/test-plans/${m}.md likho  2) app explore karke test cases doc likho  3) pages/${pascal(sub)}Page.ts + fixtures/test-fixtures.ts mein add
      4) spec likho  5) npm run cases:csv && npm run cases:check  6) npm run test:${m} (package.json mein script jodo) 7) npm run signoff -- ${m}`);
