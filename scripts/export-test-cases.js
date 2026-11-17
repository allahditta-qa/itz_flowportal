// Test cases ki CSV ke liye helper. docs/test-cases/*.md ke tables parh kar test case ki details (steps, expected...) deta hai.
// Reporter (reporters/offline-report.ts) run shuru hote hi isay use karta hai: jo test cases chalne wale hain unki CSV
// reports/<module>/<submodule> test cases <DD-MM-YYYY>_<HH-mm>.csv mein bana deta hai.
// CSV Excel mein seedha khulti hai (UTF-8 BOM). Test cases haath se CSV mein nahi, .md doc mein badlo.
const fs = require('fs');
const path = require('path');

const DOCS = path.resolve(__dirname, '..', 'docs', 'test-cases');
const HEADER = ['ID', 'Module', 'Sub-module', 'Group', 'Title', 'Priority', 'Preconditions', 'Steps', 'Expected Result', 'Automation'];
const quote = (v) => `"${String(v).replace(/"/g, '""')}"`;
const clean = (v) => v.trim().replace(/`/g, '');

// Sab docs parh kar { "<module>/<sub>/<ID>": row } map banata hai
function loadDocs() {
  const map = new Map();
  if (!fs.existsSync(DOCS)) return map;
  for (const file of fs.readdirSync(DOCS).filter((f) => f.endsWith('.md'))) {
    const lines = fs.readFileSync(path.join(DOCS, file), 'utf8').split(/\r?\n/);
    const auto = lines.join('\n').match(/tests\/([\w-]+)\/([\w-]+)\.spec\.ts/);
    const module = auto ? auto[1] : path.basename(file, '.md');
    const sub = auto ? auto[2] : module;
    let group = '';
    for (const line of lines) {
      const h = line.match(/^##\s+(?:[A-Z]\.\s*)?(.*)$/);
      if (h) { group = h[1].trim(); continue; }
      const m = line.match(/^\|\s*(TC_[A-Z0-9_.]+)\s*\|(.*)\|\s*$/);
      if (!m) continue;
      const cells = m[2].split('|').map(clean);
      if (cells.length !== 5) continue;
      const [title, priority, pre, steps, expected] = cells;
      map.set(`${module}/${sub}/${m[1]}`, [m[1], module, sub, group, title, priority, pre, steps, expected,
        /\(Opt-in\)/i.test(title) ? 'Opt-in (skipped by default)' : 'Yes']);
    }
  }
  return map;
}

// tests = [{ id, title }] jo is run mein chalne wale hain. Doc mein na mile to "Not documented yet" ke saath row.
function buildRows(module, sub, tests) {
  const docs = loadDocs();
  const rows = tests.map((t) => docs.get(`${module}/${sub}/${t.id}`) ??
    [t.id, module, sub, '', t.title, '', '', '', 'Not documented yet (add it to docs/test-cases)', 'Yes']);
  return rows.sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }));
}

function toCsv(rows) {
  return '﻿' + [HEADER, ...rows].map((r) => r.map(quote).join(',')).join('\r\n') + '\r\n';
}

module.exports = { buildRows, toCsv };
