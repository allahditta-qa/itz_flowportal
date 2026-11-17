# ITZ Flow - Test Automation Framework (Playwright + TypeScript, POM)

ITZ Flow web app (`http://172.16.10.2:8300`, sirf local network) ki QA: manual analysis + automation, module-wise, framework se sign-off report tak.

## 1. Kaam ka tareeqa (QA process)
Har module isi lifecycle se guzarta hai (detail: [docs/QA_PROCESS.md](docs/QA_PROCESS.md)):

`Framework → Analysis → Test Plan → Test Cases → Automation → Execution (CSV + Report) → Defects → Sign-off`

| Cheez | Jagah |
| --- | --- |
| Test plan (har module ka) | `docs/test-plans/<module>.md` |
| Test cases (simple English, standard format) | `docs/test-cases/<module>-<sub>.md` ([standard](docs/TEST_CASE_STANDARD.md)) |
| **Master test case CSV** (regression ke liye, sirf test case badalne par update) | `docs/test-cases/<module>-<sub>.csv` |
| Defects aur observations | `docs/defects/<module>.md` |
| Sign-off report | `docs/signoff/<module> signoff <DD-MM-YYYY>.md` |
| Templates | `docs/templates/` |
| Module tracker aur status | [PLAN.md](PLAN.md) |
| Seekhi hui baatein (app ka behaviour, gotchas) | [GUIDELINES.md](GUIDELINES.md) |

## 2. Framework structure

```
ITZ Flow/
├── config/env.ts                  .env se URL, workspace id, email, password
├── pages/                         Page Objects (POM): locators + actions, sirf yahan
├── fixtures/test-fixtures.ts      tests ko ready page objects deta hai
├── test-data/                     test data (users, stable app naam)
├── tests/<module>/<sub>.spec.ts   test cases (auth, workspace, project, my-work, theme)
├── tests/setup/auth.setup.ts      login ek baar, session save (.auth/, gitignored)
├── reporters/offline-report.ts    har run ki module-wise HTML report + run se pehle CSV + history
├── scripts/export-test-cases.js   test case CSV (master + per run)
├── docs/                          process, plans, test cases, defects, sign-off, templates
├── reports/                       (gitignored) reports/<module>/..., index.html, history.json
├── playwright.config.ts           projects: setup, auth (bina session), chromium (saved session)
└── CLAUDE.md                      project ke rules (Claude ke liye)
```

UI badle to sirf `pages/` update hoti hai, tests nahi.

## 3. Setup
1. `npm install` aur `npx playwright install chromium`
2. `.env` banao (`.env.example` dekho): `ITZ_EMAIL`, `ITZ_PASSWORD` bharo (kabhi commit nahi hota)
3. PC usi local network (172.16.10.x) se connected ho

## 4. Run commands

| Kya chalana hai | Command |
| --- | --- |
| Sab tests | `npm test` |
| Browser dikhe | `npm run test:headed` |
| Ek module | `npm run test:login`, `test:signout`, `test:theme`, `test:workspace`, `test:project`, `test:my-work`, `test:auth` |
| Ek test, naam se | `npx playwright test -g "TC_THEME_04" --headed` |
| Slow motion (dekhne ke liye) | PowerShell: `$env:SLOWMO=250; npm run test:headed` |
| **Smoke** (sirf High priority, master CSV se) | `npm run test:smoke` |
| **Regression** (sab Regression cases) | `npm run test:regression` |
| Master CSV update (test case badalne ke baad) | `npm run cases:csv` |
| Docs / CSV / code ke test IDs ka check (traceability) | `npm run cases:check` |
| TypeScript check | `npm run typecheck` |
| Naya module scaffold | `npm run module:new -- <module> [sub]` |
| Sign-off draft (numbers khud) | `npm run signoff -- <module>` |
| Reports ki history kholna | `npm run reports` |

VS Code mein: Terminal > Run Task > "Test: ..." bhi hai. Extension ke play button se report banne ki guarantee nahi.

## 5. Execution ke outputs (har run)
- **Run se pehle:** jo test cases chalne wale hain unki CSV: `reports/<module>/<sub> test cases <DD-MM-YYYY>_<HH-mm>.csv`
- **Run ke baad:** report (screenshots ke saath): `reports/<module>/<sub> test <DD-MM-YYYY>_<HH-mm>.html`
- **History:** `reports/index.html`, sab se upar date + time, neeche module-wise. Purani reports kabhi overwrite nahi hoti.

## 6. Zaroori conventions
- Test case ID: `TC_<SUB>_<NN>`. Title simple English mein, data ke saath (asli password kabhi nahi).
- Locators sirf `pages/` mein. Pehle `getByRole`, `getByPlaceholder`, `getByLabel`.
- App live hai: tests read-only. Login par galat attempts kam (15 minute lockout). Workers 2 se zyada nahi.
- Login mein email `fill()` se nahi, asli typing (`pressSequentially`) se.
- Credentials sirf `.env` mein.

## 7. Naya module add karna (tez tareeqa)
1. `npm run module:new -- <module> [sub]`: test plan, test case doc, spec, page object, defect log ban jate hain.
2. App explore karo (ek baar), `docs/test-plans/<module>.md` chhota sa likho, test cases doc bharo (~15-25 cases).
3. Page object aur `fixtures/test-fixtures.ts` mein add, spec likho (title ka ID doc se match).
4. `npm run cases:csv`, `npm run cases:check`, `npm run typecheck`. `package.json` mein `test:<module>` script jodo.
5. Chalao, reports dekho, defects `docs/defects/<module>.md` mein.
6. `npm run signoff -- <module>` (draft khud banta hai, review karke narrative jodo).
7. `PLAN.md` tracker, `GUIDELINES.md`, commit aur push.
