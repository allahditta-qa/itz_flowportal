# QA Process: har module ke liye same lifecycle (Framework se Sign-off tak)

**Role:** Senior SQA / SDET (10+ years, manual + automation, multi-domain). Har kaam is process ke hisab se module-wise hota hai.
Kisi bhi module mein shortcut nahi: pehle plan, phir test cases, phir automation, phir execution, phir sign-off.

## 1. Lifecycle aur deliverables (har module ke liye)

| # | Phase | Kya hota hai | Deliverable (file) |
| --- | --- | --- | --- |
| 0 | Framework (ek baar) | Playwright + TypeScript + Page Object Model, reporters, CSV, history | `README.md`, `playwright.config.ts`, `pages/`, `fixtures/`, `reporters/` |
| 1 | Analysis | App ko explore karna (manual), flows, rules, risks note karna | `GUIDELINES.md` (learnings), analysis notes test plan ke "Understanding" mein |
| 2 | Test Plan | Scope, approach, environment, data, entry/exit criteria, risks | `docs/test-plans/<module>.md` ([template](templates/test-plan.md)) |
| 3 | Test Design | Test cases simple English mein, standard format, techniques lagake | `docs/test-cases/<module>-<submodule>.md` aur master CSV `...csv` ([standard](TEST_CASE_STANDARD.md)) |
| 4 | Automation | Page objects, spec files; sirf stable aur repeatable cases automate | `pages/`, `tests/<module>/<submodule>.spec.ts` |
| 5 | Execution | Run se pehle CSV, run ke baad report, history | `reports/<module>/<sub> test cases <date>_<time>.csv`, `... test <date>_<time>.html`, `reports/index.html` |
| 6 | Defects / Observations | Jo bug ya shak mile uska log, evidence ke saath | `docs/defects/<module>.md` ([template](templates/defect-log.md)) |
| 7 | Sign-off | Module ka final report: coverage, results, defects, risks, decision | `docs/signoff/<module> signoff <DD-MM-YYYY>.md` ([template](templates/signoff-report.md)) |
| 8 | Handoff | Plan/status/learnings update, commit, push | `PLAN.md`, `GUIDELINES.md`, `CLAUDE.md` |

Module ke andar sub-modules ek ek karke test hote hain. Module ka sign-off tab hota hai jab sab sub-modules ka execution ho chuka ho.

## 2. Test design techniques (test cases likhte waqt)
- **Equivalence partitioning** aur **boundary values** (e.g. khali, 1 char, bohot lamba input).
- **Positive aur negative** dono, **error guessing** (spaces, special characters, emoji).
- **State transition** (logged out → logged in → logged out, theme light → dark → system).
- **Security basics** (injection text, script text, access without login, lockout).
- **Persistence** (reload, doosra page, nayi session) aur **cross-page consistency**.
- **UI checks** (elements visible, text sahi, keyboard use).
- Jahan automation mushkil ho (visual look, accessibility, kai browsers) wahan **manual checklist** test plan mein likho.

## 3. Entry aur exit criteria (default, module ke plan mein badal sakte hain)

**Entry (execution shuru karne se pehle):**
- Test plan aur test case docs ready aur review ho chuke hon.
- App reachable ho (`172.16.10.2:8300`), credentials `.env` mein hon.
- Automation ka code compile ho (`npx playwright test --list`).

**Exit (sign-off ke liye):**
- Sab **High priority** cases execute hue aur pass.
- Overall pass rate **95% ya zyada** (executed cases par).
- Koi **Critical ya High** defect open nahi.
- Jo cases skip hue unki wajah likhi ho aur plan mein risk accept kiya gaya ho.
- Sign-off report likhi ho.

## 4. Severity aur priority

| Severity | Matlab | Example |
| --- | --- | --- |
| Critical | App ya core flow band, data loss, security hole | Login bypass ho jana |
| High | Major feature kaam nahi karta, workaround nahi | Valid user login nahi kar pa raha |
| Medium | Feature aanshik kaam karta hai ya workaround hai | Autofill par login fail |
| Low | Cosmetic ya chhoti baat | Spelling, alignment |

Priority (test cases mein): **High** = core flow, fail ho to app unusable; **Medium**; **Low** = cosmetic.
**Observation** = jo defect nahi lagta par product team se confirm karna hai (expected behaviour poochni hai).

## 5. Sign-off decision ke 3 natije
- **Signed off:** exit criteria poore, koi blocker nahi.
- **Conditional sign-off:** exit criteria lagbhag poore, kuch known gaps ya open observations hain jo likhe gaye hain.
- **Not signed off:** Critical/High defect open ya High cases fail/unexecuted.

Final approval product owner / TPM ka hota hai. QA sirf recommendation deta hai.

## 6. Roz ka rule (checklist)
- [ ] Naya module: pehle test plan likho.
- [ ] Test cases doc standard format mein, simple English, titles mein data.
- [ ] Test case badla ya naya aaya to `npm run cases:csv` (master CSV), phir `npm run cases:check`.
- [ ] Automation ke baad `npx playwright test --list` aur safe run.
- [ ] Live app hai: read-only tests, galat login attempts kam (lockout 15 min).
- [ ] Run ke baad CSV + report + index check, defects/observations likho.
- [ ] Sign-off report, `PLAN.md` ka module tracker, `GUIDELINES.md` update, commit aur push.
