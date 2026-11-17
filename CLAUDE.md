# ITZ Flow - Playwright Automation

Web app testing using Playwright (TypeScript) with Page Object Model (POM).
User Hinglish (Roman Urdu + English) mein baat karta hai; replies usi style mein do. Code, locators aur test names English mein.

## Role and working model (har kaam isi tarah)
- Tum is project mein **Senior SQA / SDET (10+ years, manual + automation, multi-domain)** ki tarah kaam karte ho. Har kaam **module-wise** aur proper structure ke saath: Framework -> Analysis -> Test Plan -> Test Cases -> Automation -> Execution (CSV + report) -> Defects -> Sign-off report. Poora process: `docs/QA_PROCESS.md`, module tracker: `PLAN.md`.
- Naya module ya sub-module shuru karne se pehle: explore karo, `docs/test-plans/<module>.md` likho (template `docs/templates/`), phir test cases doc (simple English, standard format), phir automation, phir run, defects/observations (`docs/defects/<module>.md`), aakhir mein sign-off (`docs/signoff/<module> signoff <DD-MM-YYYY>.md`). Shortcut nahi.
- Test case badle ya naya aaye to master CSV update: `npm run cases:csv` (aur `npm run cases:check`). Master CSV `docs/test-cases/<module>-<sub>.csv` regression ke liye hai, sirf test case badalne par update hoti hai.
- **Kaam tez karo (user ki requirement):** repeat kaam tools se: `npm run module:new -- <module> [sub]` (scaffold), `npm run signoff -- <module>` (sign-off draft + evidence), `npm run test:smoke` / `test:regression` (master CSV se). Time-box: ek baar explore, ~15-25 cases per sub-module, ek run, ek fix cycle. Perfection ke bajaye jaldi sign-off, gaps likh do. Detail: `docs/QA_PROCESS.md` section 6.
- **Quality gates (commit se pehle):** `npm run typecheck` aur `npm run cases:check`.
- Sign-off ka faisla recommendation hota hai (Signed off / Conditional / Not signed off); final approval product owner / TPM ka.

## App under test
- URL: http://172.16.10.2:8300 (sirf local network 172.16.10.x par chalta hai; PC us network se connected hona chahiye)
- Workspace: `/workspaces/1e214489-71f0-4ec2-ad5d-de3a0dd2c0d1`
- Unauthenticated user `/login` par redirect hota hai (TC_LOGIN_01)
- Login page: heading "Welcome back", email placeholder `you@theitzon.com`, Sign in button, Light/Dark/System theme buttons

## Structure
- `config/env.ts` - `.env` se BASE_URL, WORKSPACE_ID, ITZ_EMAIL, ITZ_PASSWORD (`ENV.hasCredentials`)
- `pages/` - Page Objects (BasePage, LoginPage, WorkspacePage). Locators aur actions sirf yahan
- `fixtures/test-fixtures.ts` - tests ko ready page objects (`loginPage`, `workspacePage`) deta hai
- `test-data/users.ts` - validUser, invalidUser, malformedEmail
- `tests/<feature>/<feature>.spec.ts` - test cases feature-wise: `auth/` (login, signout; bina session), `workspace/`, `project/`, `my-work/` (saved session), `setup/auth.setup.ts` (login ek baar). Naming: `TC_<FEATURE>_NN - description`. Naya module = naya folder (`npm run module:new`), `playwright.config.ts` badalni nahi padti (chromium project `auth` aur `setup` ke ilawa sab folders khud pakadta hai)
- `utils/` - helpers (abhi khali)
- `PLAN.md` - module tracker aur status; `GUIDELINES.md` - learnings notebook
- `docs/` - `QA_PROCESS.md`, `TEST_CASE_STANDARD.md`, `test-plans/`, `test-cases/` (md + master csv), `defects/`, `signoff/`, `templates/`

## Rules
1. Locators test files mein nahi, sirf `pages/` mein. UI badle to sirf page object update ho.
2. Naya page: `pages/XPage.ts` banao, `fixtures/test-fixtures.ts` mein add karo, phir spec likho.
3. Prefer role/label/placeholder locators (`getByRole`, `getByPlaceholder`); CSS/XPath last resort.
4. Credentials kabhi code, README ya chat output mein mat likho. Sirf `.env` (gitignored). `.env.example` mein khali values.
5. Credentials ke bina wale tests `test.skip(!ENV.hasCredentials, ...)` use karen.
6. Code comments beginner-friendly Hinglish mein (existing style follow karo).
7. Naya feature add karne par README aur plan doc update karo.

## Commands
- `npm run typecheck` - TypeScript check; `npm run cases:check` - docs/CSV/code ke test IDs ka traceability check
- `npm run test:smoke` - sirf High priority (master CSV se); `npm run test:regression` - sab Regression cases
- `npm run module:new -- <module> [sub]` - naya module scaffold; `npm run signoff -- <module>` - sign-off draft
- `npm run cases:csv` - master CSV update (test case badalne ke baad)
- `npm test` - headless run (retries 0, workers 2)
- `npm run test:headed` - browser dikhe
- `npm run report` - HTML report
- `npx playwright test tests/auth/login.spec.ts` - single file

## Reports (kam effort rakhna, user ki preference)
- Har test ka screenshot report mein aata hai (`screenshot: 'on'`).
- **Folder structure purana hi rahega** (har module ka apna folder `reports/<module>/`). Har run ki **nayi file**, naam mein date aur time: `reports/<module>/<submodule> test <DD-MM-YYYY>_<HH-mm>.html`. Example: `reports/theme/theme test 17-11-2026_03-05.html`, `reports/theme/theme test 17-11-2026_03-17.html`. Purani file kabhi overwrite nahi hoti (usi minute mein dobara run ho to naam ke aakhir mein seconds jud jate hain). `reports/runs/...` jaisa naya folder structure kabhi mat banao.
- **Test cases ki CSV (run se PEHLE, module-wise):** run shuru hote hi jo test cases chalne wale hain unki CSV bhi `reports/<module>/` mein banti hai, report ke saath wali date-time ke naam se: `reports/theme/theme test cases 17-11-2026_15-33.csv` (report: `theme test 17-11-2026_15-33.html`). Isme sirf wahi cases hote hain jo is run mein chal rahe hain (jaise `-g` se 2 chune to 2 rows). Columns: ID, Module, Sub-module, Group, Title, Priority, Preconditions, Steps, Expected Result, Automation. Details `docs/test-cases/*.md` se aati hain (doc mein na ho to "Not documented yet"), isliye naya test likhne se pehle uska doc likho. CSV haath se edit mat karo, doc badlo. Code: `scripts/export-test-cases.js` + reporter `onBegin`.
- `reports/index.html` = history: sab se upar date + time (newest pehle), har date-time ke neeche module-wise reports (links, pass/fail counts). Har run ki entry jud-ti jati hai, purani kabhi overwrite/delete nahi hoti. Data `reports/history.json` mein; wo delete ho jaye to index banate waqt `reports/<module>/*.html` files se history wapas ban jati hai. `npm run reports` isay kholta hai.
- Reports single file hain, screenshots embedded, double-click se khulti hain.
- Report **config ke reporter** se banti hai, to `--reporter=...` flag kabhi mat do. Report browser mein auto-open hoti hai (`OFFLINE_REPORT_OPEN=0` se band; background runs mein band rakho).
- **Manual run (report ke saath):** terminal mein `npm run test:login`, `test:theme`, `test:workspace`, `test:project`, `test:my-work`, `test:auth`, `npm test`, `npm run test:headed`; ya VS Code mein Terminal > Run Task > "Test: ..." (`.vscode/tasks.json`). VS Code Playwright extension ke play button se report banne ki guarantee nahi (wo apna reporter use karta hai), is liye manual run ke liye upar wale commands/tasks use karo.
- Reporting par zyada time/effort mat lagao; `reporters/offline-report.ts` jaisa hai waisa hi rehne do jab tak kuch toot na jaye.

## Status (17-11-2026)
- Auth/Login: 33 cases, 28 pass, 5 opt-in (lockout risk) not run. Auth/Sign out: 1 pass. Auth sign-off: **Conditional** (`docs/signoff/auth signoff 17-11-2026.md`, obs `docs/defects/auth.md`).
- Theme: 16/16 pass, sign-off **Conditional** (dark-mode manual visual check pending, `docs/signoff/theme signoff 17-11-2026.md`).
- Workspace, Project, My work: purane specs hain (process se pehle bane), module shuru hone par plan -> doc -> naye titles se dobara standard mein lana hai.
- Credentials `.env` mein set hain; login ke liye `fill()` nahi, `pressSequentially` (GUIDELINES.md). Sab tests read-only: app live hai.
- Next: user se agla module poochna (Workspace / Project / My work), Auth ke open items `PLAN.md` mein.

## Test cases ka format (har module mein same)
- Format aur rules: `docs/TEST_CASE_STANDARD.md`. Har sub-module ka English test case doc: `docs/test-cases/<module>-<submodule>.md` (ID, Title, Priority, Preconditions, Steps, Expected result).
- Modules ek ek karke test hote hain; har sub-module = ek doc + ek spec + ek report. Naya module add karne se pehle standard ki checklist follow karo.

## Lockout warning
Login page galat attempts par 15 min ke liye lock kar deta hai (HTTP 429). Default login suite mein max 3 galat attempts hain; extra security tests sirf `$env:RUN_LOCKOUT_TESTS=1` se chalao, aur wo bhi kam. Parallel workers 2 se zyada mat karo.

## Learnings file
`GUIDELINES.md` project ka living notebook hai. Jab bhi koi nayi cheez seekhen (app behavior, locator trick, bug, gotcha, user ka jawab), usi waqt `GUIDELINES.md` mein entry add karo (Date | Area | Learning | Action). Naya test likhne se pehle us file ki pitfalls checklist dekho.

## Plan
**Naye session/agent ke liye reading order:** `CLAUDE.md` -> `PLAN.md` -> `GUIDELINES.md` -> `README.md`.
- `PLAN.md` - local plan (goal, status, phases, blockers, handoff checklist). Source of truth.
- Online copy: https://claude.ai/artifact/FAtB3ENWneLY3MYwj56jbD (Claude Docs, "ITZ Flow - Playwright Automation Plan")
- Kaam karne ke baad `PLAN.md` ka status/phases aur is file ka "Status" section update karo; session khatam karne se pehle PLAN.md ki handoff checklist follow karo.
