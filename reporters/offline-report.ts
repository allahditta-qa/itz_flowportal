// Custom reporter: har module/sub-module ki ALAG single-file HTML report banata hai (screenshots base64 ke saath).
// Naam ka rule: tests/<module>/<submodule>.spec.ts  ->  reports/<module>/<submodule> test report.html
// Example: tests/auth/login.spec.ts  ->  reports/auth/login test report.html
// Saath mein reports/index.html bante hain jis mein sab modules ki latest report ke links hote hain.
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

interface Summary {
  module: string;
  sub: string;
  file: string; // reports folder ke relative path
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  updated: string;
}

const esc = (s: string) =>
  s.replace(/\u001b\[[0-9;]*m/g, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const pretty = (s: string) => s.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const STYLE = `
:root{--bg:#f6f7f9;--fg:#1c1f24;--card:#fff;--line:#dde1e6;--pass:#1a7f37;--fail:#cf222e;--skip:#8a6d00;--mute:#6b7380}
@media(prefers-color-scheme:dark){:root{--bg:#14161a;--fg:#e6e8eb;--card:#1d2026;--line:#2e333b;--pass:#3fb950;--fail:#ff7b72;--skip:#d4a72c;--mute:#9aa3b0}}
body{margin:0;padding:24px 16px;background:var(--bg);color:var(--fg);font:15px/1.5 system-ui,Segoe UI,sans-serif}
main{max-width:1000px;margin:auto}h1{margin:0 0 4px}.meta{color:var(--mute);font-size:13px}a{color:inherit}
.sum{display:flex;gap:12px;flex-wrap:wrap;margin:16px 0}.sum div{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:10px 16px}
.sum b{font-size:22px;display:block}.card{background:var(--card);border:1px solid var(--line);border-left:4px solid var(--line);border-radius:8px;padding:12px 16px;margin:12px 0}
.card.pass{border-left-color:var(--pass)}.card.fail{border-left-color:var(--fail)}.card.skip{border-left-color:var(--skip)}
.head{display:flex;gap:10px;align-items:baseline;flex-wrap:wrap}.badge{font-size:12px;text-transform:uppercase;padding:2px 8px;border-radius:99px;border:1px solid currentColor}
.badge.pass{color:var(--pass)}.badge.fail{color:var(--fail)}.badge.skip{color:var(--skip)}
pre{background:var(--bg);padding:10px;border-radius:6px;overflow:auto;white-space:pre-wrap;color:var(--fail)}
.shots{display:flex;gap:12px;flex-wrap:wrap;margin-top:10px}figure{margin:0}img{max-width:300px;border:1px solid var(--line);border-radius:6px;cursor:zoom-in}
img.big{max-width:100%;cursor:zoom-out}figcaption{font-size:12px;color:var(--mute)}
table{width:100%;border-collapse:collapse;background:var(--card);border:1px solid var(--line)}th,td{text-align:left;padding:8px 12px;border-bottom:1px solid var(--line)}
`;

export default class OfflineReporter implements Reporter {
  private groups = new Map<string, Group>();
  private start = Date.now();
  private outDir: string;
  private autoOpen: boolean;

  constructor(options: { outputDir?: string; open?: boolean } = {}) {
    this.outDir = path.resolve(options.outputDir ?? 'reports');
    // Run ke baad report browser mein khud khule (CI par ya OFFLINE_REPORT_OPEN=0 par nahi)
    this.autoOpen = (options.open ?? true) && !process.env.CI && process.env.OFFLINE_REPORT_OPEN !== '0';
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
    if (this.groups.size === 0) return; // koi test chala hi nahi (e.g. --list): purani reports na bigarein

    const summaryFile = path.join(this.outDir, 'summary.json');
    let summaries: Summary[] = [];
    try { summaries = JSON.parse(fs.readFileSync(summaryFile, 'utf8')); } catch { /* pehli baar */ }

    const written: string[] = [];
    for (const g of this.groups.values()) {
      const rows = [...g.rows.values()].sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true }));
      const file = `${g.module}/${g.sub.replace(/[-_]/g, ' ')} test report.html`;
      const full = path.join(this.outDir, file);
      fs.mkdirSync(path.dirname(full), { recursive: true });
      fs.writeFileSync(full, this.renderModule(g, rows, result.status), 'utf8');
      written.push(full);

      const s: Summary = {
        module: g.module, sub: g.sub, file,
        total: rows.length,
        passed: rows.filter((r) => r.status === 'passed').length,
        failed: rows.filter((r) => r.status === 'failed' || r.status === 'timedOut').length,
        skipped: rows.filter((r) => r.status === 'skipped').length,
        updated: new Date().toLocaleString(),
      };
      summaries = summaries.filter((x) => !(x.module === s.module && x.sub === s.sub)).concat(s);
    }

    summaries.sort((a, b) => `${a.module}/${a.sub}`.localeCompare(`${b.module}/${b.sub}`));
    fs.writeFileSync(summaryFile, JSON.stringify(summaries, null, 2), 'utf8');
    const indexFile = path.join(this.outDir, 'index.html');
    fs.writeFileSync(indexFile, this.renderIndex(summaries), 'utf8');

    for (const w of written) console.log(`\nModule report: ${w}`);
    console.log(`All reports index: ${indexFile}`);
    // Ek hi module chala ho to seedha uski report kholo, warna index
    const toOpen = written.length === 1 ? written[0] : indexFile;
    if (this.autoOpen) {
      exec(`start "" "${toOpen}"`, (err) => { if (err) console.log('Report auto-open failed:', err.message); });
    }
  }

  private renderModule(g: Group, rows: Row[], overall: string): string {
    const count = (s: string) => rows.filter((r) => r.status === s).length;
    const failed = rows.filter((r) => r.status === 'failed' || r.status === 'timedOut').length;
    const secs = ((Date.now() - this.start) / 1000).toFixed(1);
    const cards = rows
      .map((r) => {
        const cls = r.status === 'passed' ? 'pass' : r.status === 'skipped' ? 'skip' : 'fail';
        const imgs = r.shots
          .map((s) => `<figure><img src="${s.src}" alt="${esc(s.name)}" onclick="this.classList.toggle('big')"><figcaption>${esc(s.name)}</figcaption></figure>`)
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
<p class="meta"><a href="../index.html">&larr; All modules</a></p>
<h1>${esc(pretty(g.module))} &rsaquo; ${esc(pretty(g.sub))}</h1>
<div class="meta">${new Date().toLocaleString()} · duration ${secs}s · overall: ${esc(overall)} · click a screenshot to enlarge</div>
<div class="sum"><div><b>${rows.length}</b>total</div><div><b style="color:var(--pass)">${count('passed')}</b>passed</div><div><b style="color:var(--fail)">${failed}</b>failed</div><div><b style="color:var(--skip)">${count('skipped')}</b>skipped</div></div>
${cards}
</main></body></html>`;
  }

  private renderIndex(list: Summary[]): string {
    const rows = list
      .map((s) => {
        const color = s.failed ? 'var(--fail)' : 'var(--pass)';
        return `<tr><td>${esc(pretty(s.module))}</td><td><a href="${esc(encodeURI(s.file))}">${esc(pretty(s.sub))}</a></td><td>${s.total}</td>
<td style="color:var(--pass)">${s.passed}</td><td style="color:${s.failed ? 'var(--fail)' : 'inherit'}">${s.failed}</td><td style="color:var(--skip)">${s.skipped}</td>
<td style="color:${color}">${s.failed ? 'Failed' : 'Passed'}</td><td class="meta">${esc(s.updated)}</td></tr>`;
      })
      .join('\n');
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>ITZ Flow - All Module Reports</title><style>${STYLE}</style></head><body><main>
<h1>ITZ Flow - Module Reports</h1><div class="meta">Latest report of each module / sub-module. Click a sub-module to open its report.</div>
<table style="margin-top:16px"><thead><tr><th>Module</th><th>Sub-module</th><th>Total</th><th>Pass</th><th>Fail</th><th>Skip</th><th>Result</th><th>Last run</th></tr></thead>
<tbody>${rows}</tbody></table></main></body></html>`;
  }
}
