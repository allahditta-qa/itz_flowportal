// Custom reporter: har module/sub-module ki ALAG single-file HTML report banata hai (screenshots base64 ke saath).
//
// Structure (purana hi): har module ka apna folder, report file ke NAAM mein date aur time:
//   reports/<module>/<submodule> test <DD-MM-YYYY>_<HH-mm>.html
//   Example: reports/theme/theme test 17-11-2026_03-05.html
//            reports/theme/theme test 17-11-2026_03-17.html
// Purani report kabhi overwrite nahi hoti (naya run = nayi file, kyunke naam mein time hai).
// reports/index.html mein sab reports ki history (date-wise) + har module ki latest report ka link hota hai.
// Reports bina server/internet ke double-click se khulti hain.
import type { FullResult, Reporter, TestCase, TestResult } from '@playwright/test/reporter';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

interface Row {
  id: string;
  title: string;
  group: string;
  status: string;
  duration: number;
  retry: number;
  error: string;
  shots: { name: string; src: string }[];
}

interface Group {
  module: string;
  sub: string;
  rows: Map<string, Row>;
}

// history.json ki ek entry = ek report file
interface Entry {
  module: string;
  sub: string;
  file: string; // reports folder se relative path (e.g. theme/theme test 17-11-2026_03-05.html)
  ts: string; // ISO time (sorting ke liye)
  date: string; // DD-MM-YYYY
  time: string; // HH:mm
  total: number;
  passed: number;
  failed: number;
  skipped: number;
}

const esc = (s: string) =>
  s.replace(/\u001b\[[0-9;]*m/g, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const pretty = (s: string) => s.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
const two = (n: number) => String(n).padStart(2, '0');

const STYLE = `
:root{--bg:#f6f7f9;--fg:#1c1f24;--card:#fff;--line:#dde1e6;--pass:#1a7f37;--fail:#cf222e;--skip:#8a6d00;--mute:#6b7380}
@media(prefers-color-scheme:dark){:root{--bg:#14161a;--fg:#e6e8eb;--card:#1d2026;--line:#2e333b;--pass:#3fb950;--fail:#ff7b72;--skip:#d4a72c;--mute:#9aa3b0}}
body{margin:0;padding:24px 16px;background:var(--bg);color:var(--fg);font:15px/1.5 system-ui,Segoe UI,sans-serif}
main{max-width:1100px;margin:auto}h1{margin:0 0 4px}h2{margin:28px 0 8px}.meta{color:var(--mute);font-size:13px}a{color:inherit}
.sum{display:flex;gap:12px;flex-wrap:wrap;margin:16px 0}.sum div{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:10px 16px}
.sum b{font-size:22px;display:block}.card{background:var(--card);border:1px solid var(--line);border-left:4px solid var(--line);border-radius:8px;padding:12px 16px;margin:12px 0}
.card.pass{border-left-color:var(--pass)}.card.fail{border-left-color:var(--fail)}.card.skip{border-left-color:var(--skip)}
.head{display:flex;gap:10px;align-items:baseline;flex-wrap:wrap}.badge{font-size:12px;text-transform:uppercase;padding:2px 8px;border-radius:99px;border:1px solid currentColor}
.badge.pass{color:var(--pass)}.badge.fail{color:var(--fail)}.badge.skip{color:var(--skip)}
pre{background:var(--bg);padding:10px;border-radius:6px;overflow:auto;white-space:pre-wrap;color:var(--fail)}
.shots{display:flex;gap:12px;flex-wrap:wrap;margin-top:10px}figure{margin:0}img{max-width:300px;border:1px solid var(--line);border-radius:6px;cursor:zoom-in}
img.big{max-width:100%;cursor:zoom-out}figcaption{font-size:12px;color:var(--mute)}
table{width:100%;border-collapse:collapse;background:var(--card);border:1px solid var(--line)}th,td{text-align:left;padding:8px 12px;border-bottom:1px solid var(--line)}
.pass-t{color:var(--pass)}.fail-t{color:var(--fail)}.skip-t{color:var(--skip)}
`;

export default class OfflineReporter implements Reporter {
  private groups = new Map<string, Group>();
  private startedAt = new Date();
  private reportsDir: string;
  private autoOpen: boolean;

  constructor(options: { outputDir?: string; open?: boolean } = {}) {
    this.reportsDir = path.resolve(options.outputDir ?? 'reports');
    // Run ke baad report browser mein khud khule (CI par ya OFFLINE_REPORT_OPEN=0 par nahi)
    this.autoOpen = (options.open ?? true) && !process.env.CI && process.env.OFFLINE_REPORT_OPEN !== '0';
  }

  onBegin(): void {
    this.startedAt = new Date();
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    // File path se module aur sub-module nikalte hain: tests/<module>/<sub>.spec.ts
    const rel = path.relative(process.cwd(), test.location.file).split(path.sep);
    const module = rel[1] ?? 'general';
    if (module === 'setup') return; // login setup internal hai, uski report nahi banti
    const sub = (rel[2] ?? rel[1] ?? 'tests').replace(/\.spec\.ts$/, '');
    const key = `${module}/${sub}`;
    if (!this.groups.has(key)) this.groups.set(key, { module, sub, rows: new Map() });

    const shots = result.attachments
      .filter((a) => a.contentType.startsWith('image/'))
      .map((a) => {
        const buf = a.body ?? (a.path ? fs.readFileSync(a.path) : null);
        return buf ? { name: a.name, src: `data:${a.contentType};base64,${buf.toString('base64')}` } : null;
      })
      .filter((x): x is { name: string; src: string } => x !== null);

    const fullTitle = test.title; // sirf test ka apna title (file/describe path nahi)
    const group = test.titlePath().slice(2, -1).join(' › ');
    const id = fullTitle.match(/TC_[A-Z0-9_.]+/)?.[0] ?? '';
    // Retry hone par aakhri attempt ka result rakhte hain
    this.groups.get(key)!.rows.set(test.id, {
      id,
      title: fullTitle,
      group,
      status: result.status,
      duration: result.duration,
      retry: result.retry,
      error: result.error ? (result.error.message ?? String(result.error)) : '',
      shots,
    });
  }

  onEnd(result: FullResult): void {
    if (this.groups.size === 0) return; // koi test chala hi nahi (e.g. --list): koi report nahi banti

    const d = this.startedAt;
    const date = `${two(d.getDate())}-${two(d.getMonth() + 1)}-${d.getFullYear()}`; // DD-MM-YYYY
    const stamp = `${date}_${two(d.getHours())}-${two(d.getMinutes())}`; // 17-11-2026_03-05
    const durationSec = Math.round((Date.now() - d.getTime()) / 1000);

    const historyFile = path.join(this.reportsDir, 'history.json');
    let history: Entry[] = [];
    try { history = JSON.parse(fs.readFileSync(historyFile, 'utf8')); } catch { /* pehli baar */ }

    const written: string[] = [];
    for (const g of [...this.groups.values()].sort((a, b) => `${a.module}/${a.sub}`.localeCompare(`${b.module}/${b.sub}`))) {
      const rows = [...g.rows.values()].sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true }));
      const dir = path.join(this.reportsDir, g.module);
      fs.mkdirSync(dir, { recursive: true });

      // Naam: "<sub> test DD-MM-YYYY_HH-mm.html". Usi minute mein dobara run ho to seconds jod dete hain (overwrite nahi hota)
      const base = `${g.sub.replace(/[-_]/g, ' ')} test ${stamp}`;
      let name = `${base}.html`;
      if (fs.existsSync(path.join(dir, name))) name = `${base}-${two(d.getSeconds())}.html`;
      const full = path.join(dir, name);

      const e: Entry = {
        module: g.module,
        sub: g.sub,
        file: `${g.module}/${name}`,
        ts: d.toISOString(),
        date,
        time: `${two(d.getHours())}:${two(d.getMinutes())}`,
        total: rows.length,
        passed: rows.filter((r) => r.status === 'passed').length,
        failed: rows.filter((r) => r.status === 'failed' || r.status === 'timedOut').length,
        skipped: rows.filter((r) => r.status === 'skipped').length,
      };
      fs.writeFileSync(full, this.renderModule(g, rows, e, durationSec, result.status), 'utf8');
      history.push(e);
      written.push(full);
    }

    fs.writeFileSync(historyFile, JSON.stringify(history, null, 2), 'utf8');
    const indexFile = this.writeIndex(history);

    for (const w of written) console.log(`\nModule report: ${w}`);
    console.log(`All reports index: ${indexFile}`);
    // Ek hi module chala ho to seedha uski report kholo, warna index
    const toOpen = written.length === 1 ? written[0] : indexFile;
    if (this.autoOpen) {
      exec(`start "" "${toOpen}"`, (err) => { if (err) console.log('Report auto-open failed:', err.message); });
    }
  }

  // ───────────── HTML banane wale helpers ─────────────

  private renderModule(g: Group, rows: Row[], e: Entry, durationSec: number, overall: string): string {
    const cards = rows
      .map((r) => {
        const cls = r.status === 'passed' ? 'pass' : r.status === 'skipped' ? 'skip' : 'fail';
        const imgs = r.shots
          .map((x) => `<figure><img src="${x.src}" alt="${esc(x.name)}" onclick="this.classList.toggle('big')"><figcaption>${esc(x.name)}</figcaption></figure>`)
          .join('');
        return `<section class="card ${cls}">
  <div class="head"><span class="badge ${cls}">${esc(r.status)}</span><b>${esc(r.title)}</b>
  <span class="meta">${esc(r.group)} · ${(r.duration / 1000).toFixed(1)}s${r.retry ? ` · retry #${r.retry}` : ''}</span></div>
  ${r.error ? `<pre>${esc(r.error)}</pre>` : ''}
  ${imgs ? `<div class="shots">${imgs}</div>` : '<p class="meta">No screenshot (test was skipped)</p>'}
</section>`;
      })
      .join('\n');

    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(pretty(g.sub))} Test Report ${esc(e.date)} ${esc(e.time)}</title><style>${STYLE}</style></head><body><main>
<p class="meta"><a href="../index.html">&larr; All reports</a></p>
<h1>${esc(pretty(g.module))} &rsaquo; ${esc(pretty(g.sub))}</h1>
<div class="meta">Run: ${esc(e.date)} ${esc(e.time)} · duration ${durationSec}s · overall: ${esc(overall)} · click a screenshot to enlarge</div>
<div class="sum"><div><b>${e.total}</b>total</div><div><b class="pass-t">${e.passed}</b>passed</div><div><b class="fail-t">${e.failed}</b>failed</div><div><b class="skip-t">${e.skipped}</b>skipped</div></div>
${cards}
</main></body></html>`;
  }

  // reports/index.html: har module ki latest report + date-wise history (newest upar)
  private writeIndex(history: Entry[]): string {
    const sorted = [...history].sort((a, b) => b.ts.localeCompare(a.ts));
    const link = (e: Entry, text: string) => `<a href="${esc(encodeURI(e.file))}">${esc(text)}</a>`;
    const counts = (e: Entry) => `<td>${e.total}</td><td class="pass-t">${e.passed}</td><td class="${e.failed ? 'fail-t' : ''}">${e.failed}</td><td class="skip-t">${e.skipped}</td>
<td class="${e.failed ? 'fail-t' : 'pass-t'}">${e.failed ? 'Failed' : 'Passed'}</td>`;

    const latest = new Map<string, Entry>();
    for (const e of sorted) if (!latest.has(`${e.module}/${e.sub}`)) latest.set(`${e.module}/${e.sub}`, e);
    const latestRows = [...latest.values()]
      .sort((a, b) => `${a.module}/${a.sub}`.localeCompare(`${b.module}/${b.sub}`))
      .map((e) => `<tr><td>${esc(pretty(e.module))}</td><td>${link(e, pretty(e.sub))}</td>${counts(e)}<td class="meta">${esc(e.date)} ${esc(e.time)}</td></tr>`)
      .join('\n');

    let hist = '';
    let lastDate = '';
    for (const e of sorted) {
      if (e.date !== lastDate) {
        if (lastDate) hist += '</tbody></table>';
        hist += `<h2>${esc(e.date)}</h2><table><thead><tr><th>Time</th><th>Module</th><th>Sub-module</th><th>Total</th><th>Pass</th><th>Fail</th><th>Skip</th><th>Result</th></tr></thead><tbody>`;
        lastDate = e.date;
      }
      hist += `<tr><td>${esc(e.time)}</td><td>${esc(pretty(e.module))}</td><td>${link(e, pretty(e.sub))}</td>${counts(e)}</tr>`;
    }
    if (lastDate) hist += '</tbody></table>';

    const file = path.join(this.reportsDir, 'index.html');
    fs.mkdirSync(this.reportsDir, { recursive: true });
    fs.writeFileSync(
      file,
      `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>ITZ Flow - Test Reports</title><style>${STYLE}</style></head><body><main>
<h1>ITZ Flow - Test Reports</h1><div class="meta">Har run ki alag report (file ke naam mein date aur time). Purani reports kabhi overwrite nahi hoti.</div>
<h2>Latest report of each module</h2>
<table><thead><tr><th>Module</th><th>Sub-module</th><th>Total</th><th>Pass</th><th>Fail</th><th>Skip</th><th>Result</th><th>Run</th></tr></thead><tbody>${latestRows}</tbody></table>
<h2 style="margin-top:36px">History (newest first)</h2>${hist}
</main></body></html>`,
      'utf8',
    );
    return file;
  }
}
