// Module ka sign-off report DRAFT khud banata hai (numbers haath se nahi likhne): run results, High priority check,
// exit criteria, defects/observations, evidence, aur recommendation. QA sirf review karke narrative jodta hai.
//   npm run signoff -- <module>                 -> docs/signoff/<module> signoff <DD-MM-YYYY>.md + evidence copy
//   node scripts/signoff.js <module> --evidence-only   -> sirf latest report/CSV ko docs/signoff/evidence mein archive karo
// Data: reports/history.json (latest run har sub-module ka), master CSV (docs/test-cases), defects (docs/defects/<module>.md)
const fs = require('fs');
const path = require('path');
const { parseCsv } = require('./export-test-cases.js');

const ROOT = path.resolve(__dirname, '..');
const REPORTS = path.join(ROOT, 'reports');
const module_ = process.argv[2];
const evidenceOnly = process.argv.includes('--evidence-only');
if (!module_) { console.log('Usage: npm run signoff -- <module>'); process.exit(1); }

const pretty = (s) => s.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
const two = (n) => String(n).padStart(2, '0');
const now = new Date();
const today = `${two(now.getDate())}-${two(now.getMonth() + 1)}-${now.getFullYear()}`;
const sortKey = (e) => `${e.date.split('-').reverse().join('')}${e.time}`;

// ── latest run of every sub-module
const histFile = path.join(REPORTS, 'history.json');
if (!fs.existsSync(histFile)) { console.log('reports/history.json nahi mila. Pehle tests chalao.'); process.exit(1); }
const history = JSON.parse(fs.readFileSync(histFile, 'utf8')).filter((e) => e.module === module_);
const latest = new Map();
for (const e of history.sort((a, b) => sortKey(b).localeCompare(sortKey(a)) || b.ts.localeCompare(a.ts))) if (!latest.has(e.sub)) latest.set(e.sub, e);
if (!latest.size) { console.log(`Module "${module_}" ki koi run nahi mili. Pehle tests chalao.`); process.exit(1); }

// ── evidence archive (report + CSV copy docs ke andar, taake git mein rahe)
const evDir = path.join(ROOT, 'docs', 'signoff', 'evidence', `${module_} ${today}`);
const evidence = [];
for (const e of latest.values()) {
  for (const rel of [e.file, e.csv].filter(Boolean)) {
    const src = path.join(REPORTS, rel);
    if (!fs.existsSync(src)) continue;
    fs.mkdirSync(evDir, { recursive: true });
    fs.copyFileSync(src, path.join(evDir, path.basename(rel)));
    evidence.push(`docs/signoff/evidence/${module_} ${today}/${path.basename(rel)}`);
  }
}
if (evidenceOnly) { console.log(`Evidence archived (${evidence.length} files): docs/signoff/evidence/${module_} ${today}/`); process.exit(0); }

// ── master CSV rows of this module
const DOCS = path.join(ROOT, 'docs', 'test-cases');
const master = new Map(); // sub -> rows
for (const f of fs.readdirSync(DOCS).filter((x) => x.endsWith('.csv'))) {
  const [, ...rows] = parseCsv(fs.readFileSync(path.join(DOCS, f), 'utf8'));
  for (const r of rows) if (r[1] === module_) { if (!master.has(r[2])) master.set(r[2], []); master.get(r[2]).push(r); }
}

// ── per sub-module numbers
const subs = [...new Set([...master.keys(), ...latest.keys()])].sort();
const tbl = [];
let T = 0, X = 0, P = 0, F = 0, N = 0;
const highNotOk = [];
let highTotal = 0, highPassed = 0, resultsMissing = false;
for (const sub of subs) {
  const rows = master.get(sub) || [];
  const e = latest.get(sub);
  const res = e && e.results;
  const total = rows.length || (e ? e.total : 0);
  let passed, failed;
  if (res) {
    passed = rows.filter((r) => res[r[0]] === 'passed').length;
    failed = rows.filter((r) => ['failed', 'timedOut'].includes(res[r[0]])).length;
  } else { passed = e ? e.passed : 0; failed = e ? e.failed : 0; if (e) resultsMissing = true; }
  const executed = passed + failed;
  const notExec = Math.max(total - executed, 0);
  T += total; X += executed; P += passed; F += failed; N += notExec;
  tbl.push(`| ${pretty(sub)} | ${total} | ${executed} | ${passed} | ${failed} | ${notExec}${notExec ? ' (' + (res ? rows.filter((r) => !['passed', 'failed', 'timedOut'].includes(res[r[0]])).map((r) => r[0]).join(', ') : 'skipped') + ')' : ''} | ${executed ? Math.round((passed / executed) * 100) + '%' : '-'} |`);
  for (const r of rows.filter((r) => r[5] === 'High')) {
    highTotal++;
    if (res && res[r[0]] === 'passed') highPassed++;
    else if (!res && !notExec && !failed) highPassed++; // results nahi, par sab pass
    else highNotOk.push(`${r[0]} (${res ? res[r[0]] || 'not executed' : 'unknown'})`);
  }
}
const passRate = X ? Math.round((P / X) * 100) : 0;

// ── defects / observations (docs/defects/<module>.md)
const defFile = path.join(ROOT, 'docs', 'defects', `${module_}.md`);
const defects = [];
if (fs.existsSync(defFile)) {
  for (const ln of fs.readFileSync(defFile, 'utf8').split(/\r?\n/)) {
    const m = ln.match(/^\|\s*((?:DEF|OBS)_[A-Z0-9_]+)\s*\|(.*)\|\s*$/);
    if (!m) continue;
    const c = m[2].split('|').map((x) => x.trim());
    defects.push({ id: m[1], type: c[0], title: c[1], severity: c[2], status: c[3] });
  }
}
const closed = /closed|rejected|fixed/i;
const openDefs = defects.filter((d) => d.id.startsWith('DEF') && !closed.test(d.status));
const critHigh = openDefs.filter((d) => /critical|high/i.test(d.severity));
const openObs = defects.filter((d) => d.id.startsWith('OBS') && !closed.test(d.status));

// ── manual checklist from the plan
const planFile = path.join(ROOT, 'docs', 'test-plans', `${module_}.md`);
const manual = fs.existsSync(planFile) ? fs.readFileSync(planFile, 'utf8').split(/\r?\n/).filter((l) => /^- \[ \]/.test(l)) : [];

// ── criteria + recommendation
const c1 = highTotal > 0 && highPassed === highTotal;
const c2 = passRate >= 95;
const c3 = critHigh.length === 0;
const c4 = N === 0;
let rec = 'CONDITIONAL SIGN-OFF';
if (F > 0 && highNotOk.some((x) => /failed|timedOut/.test(x)) || !c3) rec = 'NOT SIGNED OFF';
else if (c1 && c2 && c3 && c4 && manual.length === 0 && openObs.length === 0) rec = 'SIGNED OFF';
const yn = (b) => (b ? 'Yes' : '**No**');

const reasons = [];
if (!c1) reasons.push(`${highTotal - highPassed} High case(s) not passed/executed: ${highNotOk.join(', ') || 'results data missing (run again)'}`);
if (!c4) reasons.push(`${N} case(s) not executed`);
if (!c2) reasons.push(`pass rate ${passRate}% is below 95%`);
if (!c3) reasons.push(`${critHigh.length} open Critical/High defect(s)`);
if (openObs.length) reasons.push(`${openObs.length} open observation(s)`);
if (manual.length) reasons.push(`${manual.length} manual check(s) pending`);

const runDates = [...latest.values()].map((e) => `${e.date} ${e.time}`).join(', ');
const md = `# ${pretty(module_)} - Sign-off Report (auto draft)

**Date:** ${today}  |  **Prepared by:** QA (SDET)  |  **Build / environment:** http://172.16.10.2:8300
**Recommendation: ${rec}**
> Numbers below are generated by \`npm run signoff -- ${module_}\` from the latest test runs. QA reviews and adds comments before approval.

## 1. Summary
${F === 0 && X > 0 ? `All ${X} executed case(s) passed` : `${P} of ${X} executed case(s) passed (${F} failed)`}${N ? `, ${N} case(s) were not executed` : ''}. ${critHigh.length ? `${critHigh.length} open Critical/High defect(s).` : 'No open Critical/High defect.'} ${reasons.length ? 'Open points: ' + reasons.join('; ') + '.' : 'All exit criteria are met and nothing is pending.'}${resultsMissing ? ' (Per-case results were missing in some runs, so some numbers use run totals. Run the module again for exact numbers.)' : ''}

## 2. Execution results

| Sub-module | Total | Executed | Passed | Failed | Not executed | Pass rate |
| --- | --- | --- | --- | --- | --- | --- |
${tbl.join('\n')}
| **${pretty(module_)} total** | **${T}** | **${X}** | **${P}** | **${F}** | **${N}** | **${passRate}%** |

**Latest runs used:** ${runDates}

**Evidence (archived in git):**
${evidence.map((e) => `- \`${e}\``).join('\n') || '- (none)'}

## 3. Exit criteria check

| Criterion | Result | Met? |
| --- | --- | --- |
| All High priority cases executed and passed | ${highPassed} of ${highTotal} passed${highNotOk.length ? ' (not ok: ' + highNotOk.join(', ') + ')' : ''} | ${yn(c1)} |
| Pass rate 95% or more | ${passRate}% (${P} of ${X}) | ${yn(c2)} |
| No open Critical or High defect | ${critHigh.length} open | ${yn(c3)} |
| All cases executed (skipped ones justified in the test plan) | ${N} not executed | ${yn(c4)} |

## 4. Defects and observations
${defects.length ? `Defect log: \`docs/defects/${module_}.md\`\n\n| ID | Title | Severity | Status |\n| --- | --- | --- | --- |\n${defects.map((d) => `| ${d.id} | ${d.title} | ${d.severity} | ${d.status} |`).join('\n')}` : 'No defect or observation logged.'}

## 5. Manual checks still pending
${manual.length ? manual.join('\n') : 'None.'}

## 6. Risks, limitations and next steps
(QA to complete: what was not covered and why, risks, what must happen before final sign-off.)

## 7. Approval

| Role | Name | Decision | Date |
| --- | --- | --- | --- |
| QA (SDET) | | Recommends: ${rec.toLowerCase()} | ${today} |
| Product Owner / TPM | | | |
`;

let out = path.join(ROOT, 'docs', 'signoff', `${module_} signoff ${today}.md`);
if (fs.existsSync(out)) out = path.join(ROOT, 'docs', 'signoff', `${module_} signoff ${today}_${two(now.getHours())}-${two(now.getMinutes())}.md`);
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, md, 'utf8');
console.log(`Sign-off draft: ${path.relative(ROOT, out)}\nRecommendation: ${rec}\nEvidence files archived: ${evidence.length}`);
