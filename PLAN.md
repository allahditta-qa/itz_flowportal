# ITZ Flow - QA Plan and Module Tracker

Last updated: 17-11-2026
Padhne ka order (naye session ya agent ke liye): `CLAUDE.md` -> `PLAN.md` (ye file) -> `docs/QA_PROCESS.md` -> `GUIDELINES.md` -> `README.md`.

## 1. Goal and role
ITZ Flow (`http://172.16.10.2:8300`, project-management app: workspace, projects, sprints, tickets) ki module-wise QA. Role: Senior SQA / SDET (manual + automation). Har module ka poora lifecycle: **Test Plan -> Test Cases -> Automation -> Execution (CSV + report) -> Defects -> Sign-off** ([docs/QA_PROCESS.md](docs/QA_PROCESS.md)).

## 2. Module tracker

| Module | Sub-module | Test plan | Test cases | Automated | Last result | Defects / Obs | Sign-off |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Auth | Login | Done | 33 | 33 (5 opt-in) | 28 pass, 5 not run (17-11-2026) | 4 obs | **Conditional** (17-11-2026) |
| Auth | Sign out | Done | 1 | 1 | 1 pass (17-11-2026) | - | Part of Auth |
| Theme | Theme | Done | 16 | 16 | 16 pass (17-11-2026) | none | **Conditional** (manual dark-mode check pending) |
| Workspace | Workspace | Not started | not in new format | 7 old specs | not re-run | - | - |
| Project | Project page | Not started | not in new format | 5 old specs | not re-run | - | - |
| My work | My work | Not started | not in new format | 1 old spec | not re-run | - | - |
| (more) | Ticket detail, Sprint detail, Search, Notifications, Settings | Not explored | - | - | - | - | - |

Note: Workspace, Project aur My work ke purane specs (`TC_WS_*`, `TC_PRJ_*`, `TC_MW_*`) is process se pehle bane the. Jab ye modules shuru honge to inhe plan -> doc -> naye titles ke saath dobara standard mein laya jayega.

## 3. Documents per module

| Module | Test plan | Defects | Sign-off |
| --- | --- | --- | --- |
| Auth | `docs/test-plans/auth.md` | `docs/defects/auth.md` | `docs/signoff/auth signoff 17-11-2026.md` |
| Theme | `docs/test-plans/theme.md` | none | `docs/signoff/theme signoff 17-11-2026.md` |

Test cases docs aur master CSV: `docs/test-cases/` (`auth-login`, `auth-signout`, `theme`, har ek ka `.md` aur `.csv`).

## 4. Open items (agla qadam)
- [ ] Auth: autofill aur paste ka manual check (`OBS_AUTH_01`), TPM se lockout rule, phir 5 opt-in security cases ek baar chalana, tab Auth ka sign-off final.
- [ ] Theme: dark mode ka manual visual check, "pehli baar dark computer theme" ka ek case.
- [ ] Agla module chunna: Workspace (ya Project / My work).
- [ ] Credentials `.env` mein set hain (kabhi docs ya chat mein nahi).

## 5. Environment and constraints
- App sirf local network (172.16.10.x) par. Live data: tests read-only, create/delete/ClickUp sync kabhi nahi.
- Login 15 minute lockout (HTTP 429) galat attempts par. Default login suite mein max 3 galat attempts.
- Server parallel logins par slow ho jata hai: workers 2 se zyada nahi.
- Browser: Chromium, desktop 1440 x 900.

## 6. Handoff checklist (session khatam karne se pehle)
- [ ] Tests chalaye, reports aur CSV check ki (`reports/index.html`)
- [ ] `npm run typecheck` aur `npm run cases:check` (test case badla ho to pehle `npm run cases:csv`)
- [ ] Defects/observations `docs/defects/<module>.md` mein
- [ ] Sign-off report (module complete ho to)
- [ ] Is file ka tracker, `CLAUDE.md` status, `GUIDELINES.md` update
- [ ] Commit aur push
