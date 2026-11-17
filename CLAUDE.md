# ITZ Flow - Playwright Automation

Web app testing using Playwright (TypeScript) with Page Object Model (POM).
User Hinglish (Roman Urdu + English) mein baat karta hai; replies usi style mein do. Code, locators aur test names English mein.

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
- `tests/<feature>/<feature>.spec.ts` - test cases feature-wise: `auth/` (login, signout; bina session), `workspace/`, `project/`, `my-work/` (saved session), `setup/auth.setup.ts` (login ek baar). Naming: `TC_<FEATURE>_NN - description`. Naya feature = naya folder + file, aur `playwright.config.ts` ke `chromium` project `testMatch` mein add
- `utils/` - helpers (abhi khali)
- `PLAN.md` - project plan aur status; `GUIDELINES.md` - learnings notebook

## Rules
1. Locators test files mein nahi, sirf `pages/` mein. UI badle to sirf page object update ho.
2. Naya page: `pages/XPage.ts` banao, `fixtures/test-fixtures.ts` mein add karo, phir spec likho.
3. Prefer role/label/placeholder locators (`getByRole`, `getByPlaceholder`); CSS/XPath last resort.
4. Credentials kabhi code, README ya chat output mein mat likho. Sirf `.env` (gitignored). `.env.example` mein khali values.
5. Credentials ke bina wale tests `test.skip(!ENV.hasCredentials, ...)` use karen.
6. Code comments beginner-friendly Hinglish mein (existing style follow karo).
7. Naya feature add karne par README aur plan doc update karo.

## Commands
- `npm test` - headless run (config: 1 retry, parallel)
- `npm run test:headed` - browser dikhe
- `npm run report` - HTML report
- `npx playwright test tests/auth/login.spec.ts` - single file

## Reports (kam effort rakhna, user ki preference)
- Har test ka screenshot report mein aata hai (`screenshot: 'on'`).
- Online: `npm run report` (playwright-report/).
- Offline (har sub-module ki alag): `reports/<module>/<submodule> test report.html`, jaise `reports/auth/login test report.html`. Sab ka index `reports/index.html`. Single file, screenshots embedded, double-click se khulti hai, har run ke baad khud banti hai.
- Har run ke baad report khud banti hai (config reporters). `--reporter=...` flag mat do warna report nahi banti. Offline report browser mein auto-open hoti hai (`OFFLINE_REPORT_OPEN=0` se band; background runs mein band rakho).
- Reporting par zyada time/effort mat lagao; custom reporter `reporters/offline-report.ts` jaisa hai waisa hi rehne do jab tak kuch toot na jaye.

## Status (2026-11-16)
- 22/22 tests pass (setup, auth, workspace, project, my-work). Sab read-only: app live hai, create/delete/ClickUp sync kabhi nahi.
- Credentials `.env` mein set hain; login ke liye `fill()` nahi, `pressSequentially` (GUIDELINES.md).
- Theme module done: 16/16 pass (`tests/theme/theme.spec.ts`, doc `docs/test-cases/theme.md`).
- Login module: 28 pass, 5 opt-in skip. Titles plain English with data.
- Next: user se aur modules/flows confirm karna (ticket view, sprint detail, search), `.auth/` aur `reports/` gitignored.

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
