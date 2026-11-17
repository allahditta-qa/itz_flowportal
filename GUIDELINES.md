# ITZ Flow - Guidelines & Learnings

Ye file ek **living notebook** hai. Jab bhi testing ke dauran koi nayi cheez seekhen (app ka behavior, locator trick, bug, Playwright gotcha), yahan likho. Claude ko bhi instruction hai (CLAUDE.md) ke har naye learning ke baad is file ko update kare.

Format: har entry mein **Date | Area | Learning | Kya karna hai**. Naye entries upar add karo.

---

## Entries

| Date | Area | Learning | Action / Rule |
|------|------|----------|---------------|
| 2026-11-17 | QA process | User ne kaha: har kaam module-wise, Senior SQA/SDET ki tarah, framework se sign-off report tak. Master CSV (regression ke liye) alag file, sirf test case badalne par update | Process `docs/QA_PROCESS.md`, tracker `PLAN.md`, master CSV `npm run cases:csv` |
| 2026-11-17 | Autofill risk | Email field mein script `fill()` se "does not look like an email" error aata hai aur login nahi hota; asli typing se chalta hai. Paste ya password manager par bhi aisa ho sakta hai | `OBS_AUTH_01`: haath se paste/autofill check karna hai (`docs/defects/auth.md`) |
| 2026-11-17 | Test case CSV | Run shuru hote hi (reporter `onBegin`) jo test cases chalne wale hain unki CSV module-wise `reports/<module>/<sub> test cases <date>_<time>.csv` mein banti hai; sirf chune hue cases (`-g` filter ke baad). Details docs ke tables se. `--list` par nahi banti | Naye test ka doc pehle likho, warna CSV mein "Not documented yet" aata hai |
| 2026-11-17 | Reports index | `reports/index.html`: upar date+time (newest pehle), neeche module-wise; history `history.json` + report files se rebuild hoti hai. Sorting date/time se (ts format mix ho sakta hai) | Index kabhi hand-edit nahi, reporter khud banata hai |
| 2026-11-17 | Reports | User ne purana folder structure hi rakha (`reports/<module>/`); har run ki nayi file, naam mein date-time: `<sub> test DD-MM-YYYY_HH-mm.html`. `reports/runs/...` structure user ne mana kiya. Manual run ke liye npm scripts (`test:login`...) aur VS Code tasks | VS Code extension ke play button se report ki guarantee nahi (uska apna reporter), is liye scripts/tasks use karo |
| 2026-11-17 | Theme | Theme buttons Light/Dark/System: selected button ka `aria-pressed=true`; `html[data-theme]` light/dark/system; background light `rgb(246, 247, 250)`, dark `rgb(10, 12, 16)`; choice `localStorage` key `itzflow-theme` mein save; reload, login se app aur dusre pages par bhi rehti hai; pehli baar default Light; System computer theme ko live follow karta hai | `pages/ThemeSwitcher.ts` mein locators/checks. Tests: `tests/theme/theme.spec.ts` |
| 2026-11-17 | Locators | App mein "Lighten Image AI Photo" jaisa button bhi `name: 'Light'` se match hota hai | Theme buttons hamesha `getByRole('button', { name, exact: true })` se |
| 2026-11-16 | Login lockout | Galat logins ki limit hai: "Too many failed attempts. 15 minutes." (HTTP 429). Unknown email se bhi lag gaya (shayad IP-based), poori suite ke 9 galat attempts par | Default suite mein max 3 galat attempts (TC_12/18/19). Extra security tests opt-in: `$env:RUN_LOCKOUT_TESTS=1`. 429 par test skip hota hai |
| 2026-11-16 | Server load | 28 parallel login tests ke baad server ne ERR_CONNECTION_REFUSED diya (kuch der down) | `workers: 2` ya serial (`--workers=1`) rakho; zyada parallel logins mat chalao |
| 2026-11-16 | Reports | `--reporter=list` use karne par HTML/offline report nahi banti (config reporters override hote hain) | Report ke liye `--reporter` flag mat do; `npm test` hi chalao. Offline report run ke baad browser mein khud khulti hai (`OFFLINE_REPORT_OPEN=0` se band) |
| 2026-11-16 | Typing | 1000 chars `pressSequentially` se timeout hota hai | Lambi password value `fill()` se; email hamesha `pressSequentially` |
| 2026-11-16 | Login | `locator.fill()` se email validation "does not look like an email" aati hai aur login nahi hota; asli typing kaam karti hai | `LoginPage.login()` `pressSequentially` use karta hai |
| 2026-11-16 | App | ITZFlow = project-management app (140 projects, status tabs, Cards/Table views, `/my-work`, project tabs Sprints/History/Settings). Live data hai | Tests read-only; create/delete aur "Sync with ClickUp" kabhi nahi |
| 2026-11-16 | Data | Counts (tabs, tickets) page load par pehle 0 hote hain phir aate hain | `expect.poll` se wait karo; hardcoded counts mat rakho, relations check karo (All = sum of statuses) |
| 2026-11-16 | Locators | Table headers `columnheader` role hain (text title-case, CSS se uppercase); status tabs buttons "Name count"; Cards button 2 jagah hai | `getByRole('columnheader')`, regex tab names, `.last()` for lower Cards toggle |
| 2026-11-16 | Session | Login ek baar `tests/setup/auth.setup.ts` mein, session `.auth/user.json` (gitignored). `tests/auth/*` bina session ke | Naya feature folder `chromium` project ke `testMatch` mein add karo |
| 2026-11-16 | Environment | App sirf local network 172.16.10.x par chalta hai; PC usi network se connected hona chahiye | Test se pehle `Test-NetConnection 172.16.10.2 -Port 8300` check karo |
| 2026-11-16 | Auth | Bina login workspace URL kholne par `/login` par redirect hota hai | TC_LOGIN_01 isko verify karta hai; logged-in tests ko pehle login chahiye |
| 2026-11-16 | Login UI | Login page par Light/Dark/System theme buttons hain; password field mein Show password toggle hai (type password <-> text) | Locators `LoginPage.ts` mein hain |
| 2026-11-16 | Login UI | Empty submit aur malformed email dono `/login` par hi rehte hain (client-side validation) | Assertion URL par rakhi hai, error text par nahi, jab tak exact message confirm na ho |
| 2026-11-16 | Performance | App ka first load slow hai (kuch tests 20s+ liye) aur config timeout 30s hai | Agar flaky timeouts aayen to `timeout` ya `expect.timeout` barhao |
| 2026-11-16 | Shell | Windows par bash heredoc/quoting kabhi fail hoti hai | Files `Write` tool se banao, shell se nahi |
| 2026-11-16 | Secrets | `.env` mein credentials hain, gitignored | Credentials kabhi chat, README ya code mein mat likho |

## Locator rules (learned)
1. Pehle `getByRole`, `getByPlaceholder`, `getByLabel`; CSS/XPath last resort.
2. Locators sirf `pages/` mein, specs mein nahi.

## Open questions (jawab milne par entries mein move karo)
- Login failure par exact error message kya hai?
- Workspace mein kaun se modules/features hain jinhen test karna hai?

## Pitfalls checklist (naya test likhne se pehle)
- [ ] Kya test independent hai (kisi doosre test par depend nahi)?
- [ ] Credentials chahiye to `test.skip(!ENV.hasCredentials, ...)` laga hai?
- [ ] Hard `waitForTimeout` ki jagah auto-wait / `expect` use hua?
- [ ] Naya learning is file mein likha?
