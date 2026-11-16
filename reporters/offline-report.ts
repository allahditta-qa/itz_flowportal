// Custom reporter: ek single self-contained HTML file banata hai (screenshots base64 ke saath).
// Is file ko kisi ko bhi email/copy karo, bina server ya internet ke double-click se khul jati hai.
import type { FullResult, Reporter, TestCase, TestResult } from '@playwright/test/reporter';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

interface Row {
  title: string;
  file: string;
  status: string;
  duration: number;
  retry: number;
  error: string;
  shots: { name: string; src: string }[];
}

const esc = (s: string) =>
  s.replace(/\u001b\[[0-9;]*m/g, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export default class OfflineReporter implements Reporter {
  private rows = new Map<string, Row>();
  private start = Date.now();
  private outFile: string;

  private autoOpen: boolean;

  constructor(options: { outputFile?: string; open?: boolean } = {}) {
    // Run ke baad report browser mein khud khule (CI par ya OFFLINE_REPORT_OPEN=0 par nahi)
    this.autoOpen = (options.open ?? true) && !process.env.CI && process.env.OFFLINE_REPORT_OPEN !== '0';
    this.outFile = path.resolve(options.outputFile ?? 'reports/offline-report.html');
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    const shots = result.attachments
      .filter((a) => a.contentType.startsWith('image/'))
      .map((a) => {
        const buf = a.body ?? (a.path ? fs.readFileSync(a.path) : null);
        return buf ? { name: a.name, src: `data:${a.contentType};base64,${buf.toString('base64')}` } : null;
      })
      .filter((x): x is { name: string; src: string } => x !== null);

    // Retry hone par aakhri attempt ka result rakhte hain
    this.rows.set(test.id, {
      title: test.titlePath().slice(2).join(' › '),
      file: path.relative(process.cwd(), test.location.file),
      status: result.status,
      duration: result.duration,
      retry: result.retry,
      error: result.error ? (result.error.message ?? String(result.error)) : '',
      shots,
    });
  }

  onEnd(result: FullResult): void {
    const rows = [...this.rows.values()].sort((a, b) => a.title.localeCompare(b.title));
    if (rows.length === 0) return; // koi test chala hi nahi (e.g. --list): purani report na bigarein
    const count = (s: string) => rows.filter((r) => r.status === s).length;
    const passed = count('passed');
    const failed = rows.filter((r) => r.status === 'failed' || r.status === 'timedOut').length;
    const skipped = count('skipped');
    const secs = ((Date.now() - this.start) / 1000).toFixed(1);

    const cards = rows
      .map((r) => {
        const cls = r.status === 'passed' ? 'pass' : r.status === 'skipped' ? 'skip' : 'fail';
        const imgs = r.shots
          .map((s) => `<figure><img src="${s.src}" alt="${esc(s.name)}" onclick="this.classList.toggle('big')"><figcaption>${esc(s.name)}</figcaption></figure>`)
          .join('');
        return `<section class="card ${cls}">
  <div class="head"><span class="badge ${cls}">${esc(r.status)}</span><b>${esc(r.title)}</b>
  <span class="meta">${esc(r.file)} · ${(r.duration / 1000).toFixed(1)}s${r.retry ? ` · retry #${r.retry}` : ''}</span></div>
  ${r.error ? `<pre>${esc(r.error)}</pre>` : ''}
  ${imgs ? `<div class="shots">${imgs}</div>` : '<p class="meta">Screenshot nahi (test skip hua)</p>'}
</section>`;
      })
      .join('\n');

    const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>ITZ Flow - Offline Test Report</title>
<style>
:root{--bg:#f6f7f9;--fg:#1c1f24;--card:#fff;--line:#dde1e6;--pass:#1a7f37;--fail:#cf222e;--skip:#8a6d00}
@media(prefers-color-scheme:dark){:root{--bg:#14161a;--fg:#e6e8eb;--card:#1d2026;--line:#2e333b;--pass:#3fb950;--fail:#ff7b72;--skip:#d4a72c}}
body{margin:0;padding:24px 16px;background:var(--bg);color:var(--fg);font:15px/1.5 system-ui,Segoe UI,sans-serif}
main{max-width:1000px;margin:auto}h1{margin:0 0 4px}.meta{color:#7d8590;font-size:13px}
.sum{display:flex;gap:12px;flex-wrap:wrap;margin:16px 0}.sum div{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:10px 16px}
.sum b{font-size:22px;display:block}.card{background:var(--card);border:1px solid var(--line);border-left:4px solid var(--line);border-radius:8px;padding:12px 16px;margin:12px 0}
.card.pass{border-left-color:var(--pass)}.card.fail{border-left-color:var(--fail)}.card.skip{border-left-color:var(--skip)}
.head{display:flex;gap:10px;align-items:baseline;flex-wrap:wrap}.badge{font-size:12px;text-transform:uppercase;padding:2px 8px;border-radius:99px;border:1px solid currentColor}
.badge.pass{color:var(--pass)}.badge.fail{color:var(--fail)}.badge.skip{color:var(--skip)}
pre{background:var(--bg);padding:10px;border-radius:6px;overflow:auto;white-space:pre-wrap;color:var(--fail)}
.shots{display:flex;gap:12px;flex-wrap:wrap;margin-top:10px}figure{margin:0}img{max-width:300px;border:1px solid var(--line);border-radius:6px;cursor:zoom-in}
img.big{max-width:100%;cursor:zoom-out}figcaption{font-size:12px;color:#7d8590}
</style></head><body><main>
<h1>ITZ Flow - Test Report</h1>
<div class="meta">${new Date().toLocaleString()} · duration ${secs}s · overall: ${esc(result.status)} · screenshot par click karo = bara</div>
<div class="sum"><div><b>${rows.length}</b>total</div><div><b style="color:var(--pass)">${passed}</b>passed</div><div><b style="color:var(--fail)">${failed}</b>failed</div><div><b style="color:var(--skip)">${skipped}</b>skipped</div></div>
${cards}
</main></body></html>`;

    fs.mkdirSync(path.dirname(this.outFile), { recursive: true });
    fs.writeFileSync(this.outFile, html, 'utf8');
    console.log(`\nOffline report: ${this.outFile}`);
    if (this.autoOpen) {
      // Windows: default browser mein report khol do
      exec(`start "" "${this.outFile}"`, (err) => { if (err) console.log('Report auto-open failed:', err.message); });
    }
  }
}
