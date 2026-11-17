// Regression / smoke runner: master CSV (docs/test-cases/*.csv) se test cases chun kar sirf wahi chalata hai.
//   npm run test:regression                 -> Regression = Yes wale sab cases
//   npm run test:smoke                      -> sirf High priority (jaldi check)
//   node scripts/run-regression.js --module auth        -> sirf ek module
//   node scripts/run-regression.js --priority High --dry  -> kya chalega wo dikhao, chalao nahi
// Baqi flags (jaise --headed, --workers=1) seedha Playwright ko chale jate hain.
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { parseCsv } = require('./export-test-cases.js');

const DOCS = path.resolve(__dirname, '..', 'docs', 'test-cases');
const args = process.argv.slice(2);
let priority = null, module_ = null, dry = false;
const pass = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--priority') priority = args[++i];
  else if (args[i] === '--module') module_ = args[++i];
  else if (args[i] === '--dry') dry = true;
  else pass.push(args[i]);
}

const ids = [];
const modules = new Set();
for (const f of fs.readdirSync(DOCS).filter((x) => x.endsWith('.csv'))) {
  const [, ...rows] = parseCsv(fs.readFileSync(path.join(DOCS, f), 'utf8'));
  for (const r of rows) {
    // r: 0 ID, 1 Module, 5 Priority, 10 Regression
    if (r[10] !== 'Yes') continue;
    if (priority && r[5] !== priority) continue;
    if (module_ && r[1] !== module_) continue;
    ids.push(r[0]);
    modules.add(r[1]);
  }
}
if (!ids.length) {
  console.log('Koi test case nahi mila. Master CSV banao: npm run cases:csv');
  process.exit(1);
}

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const grep = `(${ids.map(esc).join('|')}) - `;
console.log(`${priority ? priority + ' priority ' : 'Regression '}suite: ${ids.length} cases, modules: ${[...modules].join(', ')}`);
if (dry) { console.log(ids.join(', ')); process.exit(0); }

const cli = require.resolve('@playwright/test/cli');
const res = spawnSync(process.execPath, [cli, 'test', '-g', grep, ...pass], { stdio: 'inherit', cwd: path.resolve(__dirname, '..') });
process.exit(res.status ?? 1);
