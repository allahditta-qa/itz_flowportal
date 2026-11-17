// Custom reporter: HAR test run ki alag, date-wise report folder banata hai. Purani runs ki reports kabhi overwrite nahi hoti.
//
// Folder structure:
//   reports/index.html                                   -> sab runs ki history (date-wise, newest upar) + har sub-module ki latest report
//   reports/runs/<YYYY-MM-DD>/<HH-mm-ss>/index.html      -> is run ka summary (kaun se modules, kitne pass/fail)
//   reports/runs/<date>/<time>/<module>/<sub> test report.html   -> us module/sub-module ki report (screenshots ke saath)
//   reports/runs/<date>/<time>/run.json                  -> is run ka data (history index isi se banta hai)
//
// Module/sub-module ka naam: tests/<module>/<submodule>.spec.ts  ->  <module>/<submodule> test report.html
// Reports single file hain, bina server/internet ke double-click se khulti hain.
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

interface Summary {
  module: string;
  sub: string;
  file: string; // run folder ke andar relative path
  total: number;
  passed: number;
  failed: number;
  skipped: number;
}

interface RunInfo {
  date: string; // YYYY-MM-DD
  time: string; // HH-mm-ss
  started: string; // readable
  durationSec: number;
  overall: string;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  modules: Summary[];
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
    if (this.groups.size === 0) return; // koi test chala hi nahi (e.g. --list): koi report folder nahi banta

    const d = this.startedAt;
    const date = `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}`;
    const time = `${two(d.getHours())}-${two(d.getMinutes())}-${two(d.getSeconds())}`;
    const runDir = path.join(this.reportsDir, 'runs', date, time);
    const durationSec = Math.round((Date.now() - d.getTime()) / 1000);

    const modules: Summary[] = [];
    const written: string[] = [];
    for (const g of [...this.groups.values()].sort((a, b) => `${a.module}/${a.sub}`.localeCompare(`${b.module}/${b.sub}`))) {
      const rows = [...g.rows.values()].sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true }));
      const file = `${g.module}/${g.sub.replace(/[-_]/g, ' ')} test report.html`;
      const full = path.join(runDir, file);
      fs.mkdirSync(path.dirname(full), { recursive: true });
      const s: Summary = {
        module: g.module,
        sub: g.sub,
        file,
        total: rows.length,
        passed: rows.filter((r) => r.status === 'passed').length,
        failed: rows.filter((r) => r.status === 'failed' || r.status === 'timedOut').length,
        skipped: rows.filter((r) => r.status === 'skipped').length,
      };
      fs.writeFileSync(full, this.renderModule(g, rows, s, d, durationSec, result.status), 'utf8');
      modules.push(s);
      written.push(full);
    }

    const run: RunInfo = {
      date,
      time,
      started: d.toLocaleString(),
      durationSec,
      overall: result.status,
      total: modules.reduce((n, m) => n + m.total, 0),
      passed: modules.reduce((n, m) => n + m.passed, 0),
      failed: modules.reduce((n, m) => n + m.failed, 0),
      skipped: modules.reduce((n, m) => n + m.skipped, 0),
      modules,
    };
    fs.writeFileSync(path.join(runDir, 'run.json'), JSON.stringify(run, null, 2), 'utf8');
    const runIndex = path.join(runDir, 'index.html');
    fs.writeFileSync(runIndex, this.renderRunIndex(run), 'utf8');
    const rootIndex = this.writeRootIndex();

    for (const w of written) console.log(`\nModule report: ${w}`);
    console.log(`This run's summary: ${runIndex}`);
    console.log(`All runs history:   ${rootIndex}`);
    // Ek hi module chala ho to seedha uski report kholo, warna is run ka summary
    const toOpen = written.length === 1 ? written[0] : runIndex;
    if (this.autoOpen) {
      exec(`start "" "${toOpen}"`, (err) => { if (err) console.log('Report auto-open failed:', err.message); });
    }
  }

  // ───────────── HTML banane wale helpers ─────────────

  private renderModule(g: Group, rows: Row[], s: Summary, started: Date, durationSec: number, overall: string): string {
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
<title>${esc(pretty(g.module))} - ${esc(pretty(g.sub))} - Test Report</title><style>${STYLE}</style></head><body><main>
<p class="meta"><a href="../index.html">&larr; This run's summary</a> · <a href="../../../../index.html">All runs history</a></p>
<h1>${esc(pretty(g.module))} &rsaquo; ${esc(pretty(g.sub))}</h1>
<div class="meta">Run: ${esc(started.toLocaleString())} · duration ${durationSec}s · overall: ${esc(overall)} · click a screenshot to enlarge</div>
<div class="sum"><div><b>${s.total}</b>total</div><div><b class="pass-t">${s.passed}</b>passed</div><div><b class="fail-t">${s.failed}</b>failed</div><div><b class="skip-t">${s.skipped}</b>skipped</div></div>
${cards}
</main></body></html>`;
  }

  private moduleTable(modules: Summary[], hrefPrefix: (s: Summary) => string): string {
    const rows = modules
      .map(
        (s) => `<tr><td>${esc(pretty(s.module))}</td><td><a href="${esc(encodeURI(hrefPrefix(s)))}">${esc(pretty(s.sub))}</a></td><td>${s.total}</td>
<td class="pass-t">${s.passed}</td><td class="${s.failed ? 'fail-t' : ''}">${s.failed}</td><td class="skip-t">${s.skipped}</td>
<td class="${s.failed ? 'fail-t' : 'pass-t'}">${s.failed ? 'Failed' : 'Passed'}</td></tr>`,
      )
      .join('\n');
    return `<table><thead><tr><th>Module</th><th>Sub-module</th><th>Total</th><th>Pass</th><th>Fail</th><th>Skip</th><th>Result</th></tr></thead><tbody>${rows}</tbody></table>`;
  }

  private renderRunIndex(run: RunInfo): string {
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Test Run ${esc(run.date)} ${esc(run.time)}</title><style>${STYLE}</style></head><body><main>
<p class="meta"><a href="../../../index.html">&larr; All runs history</a></p>
<h1>Test run: ${esc(run.date)} ${esc(run.time.replace(/-/g, ':'))}</h1>
<div class="meta">Started ${esc(run.started)} · duration ${run.durationSec}s · overall: ${esc(run.overall)}</div>
<div class="sum"><div><b>${run.total}</b>total</div><div><b class="pass-t">${run.passed}</b>passed</div><div><b class="fail-t">${run.failed}</b>failed</div><div><b class="skip-t">${run.skipped}</b>skipped</div></div>
<div class="meta" style="margin-bottom:8px">Click a sub-module to open its report.</div>
${this.moduleTable(run.modules, (s) => s.file)}
</main></body></html>`;
  }

  // reports/runs/* ko scan karke history page banata hai (newest upar) + har sub-module ki latest report
  private writeRootIndex(): string {
    const runsDir = path.join(this.reportsDir, 'runs');
    const runs: RunInfo[] = [];
    for (const date of fs.existsSync(runsDir) ? fs.readdirSync(runsDir) : []) {
      for (const time of fs.readdirSync(path.join(runsDir, date))) {
        try {
          runs.push(JSON.parse(fs.readFileSync(path.join(runsDir, date, time, 'run.json'), 'utf8')));
        } catch { /* adhoori folder: chhod do */ }
      }
    }
    runs.sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));

    // Har sub-module ki sab se nayi report
    const latest = new Map<string, { s: Summary; run: RunInfo }>();
    for (const r of runs) for (const s of r.modules) if (!latest.has(`${s.module}/${s.sub}`)) latest.set(`${s.module}/${s.sub}`, { s, run: r });
    const latestRows = [...latest.values()].sort((a, b) => `${a.s.module}/${a.s.sub}`.localeCompare(`${b.s.module}/${b.s.sub}`));
    const latestTable = `<table><thead><tr><th>Module</th><th>Sub-module</th><th>Total</th><th>Pass</th><th>Fail</th><th>Skip</th><th>Result</th><th>Run</th></tr></thead><tbody>${latestRows
      .map(
        ({ s, run }) => `<tr><td>${esc(pretty(s.module))}</td><td><a href="${esc(encodeURI(`runs/${run.date}/${run.time}/${s.file}`))}">${esc(pretty(s.sub))}</a></td><td>${s.total}</td>
<td class="pass-t">${s.passed}</td><td class="${s.failed ? 'fail-t' : ''}">${s.failed}</td><td class="skip-t">${s.skipped}</td>
<td class="${s.failed ? 'fail-t' : 'pass-t'}">${s.failed ? 'Failed' : 'Passed'}</td><td class="meta">${esc(run.date)} ${esc(run.time.replace(/-/g, ':'))}</td></tr>`,
      )
      .join('\n')}</tbody></table>`;

    // Date-wise history
    let history = '';
    let lastDate = '';
    for (const r of runs) {
      if (r.date !== lastDate) {
        if (lastDate) history += '</tbody></table>';
        history += `<h2>${esc(r.date)}</h2><table><thead><tr><th>Time</th><th>Modules</th><th>Total</th><th>Pass</th><th>Fail</th><th>Skip</th><th>Result</th></tr></thead><tbody>`;
        lastDate = r.date;
      }
      const names = r.modules.map((m) => pretty(m.sub)).join(', ');
      history += `<tr><td><a href="${esc(encodeURI(`runs/${r.date}/${r.time}/index.html`))}">${esc(r.time.replace(/-/g, ':'))}</a></td><td>${esc(names)}</td><td>${r.total}</td>
<td class="pass-t">${r.passed}</td><td class="${r.failed ? 'fail-t' : ''}">${r.failed}</td><td class="skip-t">${r.skipped}</td>
<td class="${r.failed ? 'fail-t' : 'pass-t'}">${r.failed ? 'Failed' : 'Passed'}</td></tr>`;
    }
    if (lastDate) history += '</tbody></table>';

    const file = path.join(this.reportsDir, 'index.html');
    fs.mkdirSync(this.reportsDir, { recursive: true });
    fs.writeFileSync(
      file,
      `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>ITZ Flow - Test Reports</title><style>${STYLE}</style></head><body><main>
<h1>ITZ Flow - Test Reports</h1><div class="meta">Har test run ki alag report, date-wise. Purani runs kabhi delete ya overwrite nahi hoti.</div>
<h2>Latest report of each module</h2>${latestTable}
<h2 style="margin-top:36px">Run history (newest first)</h2>${history}
</main></body></html>`,
      'utf8',
    );
    return file;
  }
}
