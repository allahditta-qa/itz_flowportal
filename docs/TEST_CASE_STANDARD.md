# Test Case Standard (har module mein yehi format)

Har module aur sub-module ke test cases **isi format aur structure** mein likhe jate hain, taake koi bhi naya banda aasani se samajh sake.
Test cases ki language **simple English** hoti hai. Chhote sentences, koi mushkil word nahi.

## 1. Folder structure (har module ke liye same)

| Cheez | Jagah | Example |
| --- | --- | --- |
| Test cases ki document (English) | `docs/test-cases/<module>-<submodule>.md` | `docs/test-cases/auth-login.md` |
| Automation code | `tests/<module>/<submodule>.spec.ts` | `tests/auth/login.spec.ts` |
| Page object | `pages/<Name>Page.ts` | `pages/LoginPage.ts` |
| Report (auto banti hai) | `reports/<module>/<submodule> test report.html` | `reports/auth/login test report.html` |
| Sab reports ka index | `reports/index.html` | |

Ek sub-module = ek doc + ek spec file + ek report.

## 2. Test case ID

`TC_<SUBMODULE>_<NN>`  (NN = 01, 02, 03 ...). Example: `TC_LOGIN_06`.
Ek hi ID do baar kabhi use nahi hoti. Data-driven cases mein `TC_LOGIN_16.1`, `16.2` ... use karte hain.
Code mein test ka title is tarah hota hai: `TC_LOGIN_06 - valid credentials + Sign in button open the workspace`.

## 3. Document ka format (har sub-module ki file mein)

Har file in sections ke saath, isi order mein:

1. **Title:** `# <Module> - <Sub-module> Test Cases`
2. **Overview:** 2-3 lines. Ye sub-module kya karta hai.
3. **Scope / Notes:** kya test hota hai, kya nahi, koi khatra (e.g. lockout, live data).
4. **Test case tables:** type ke hisab se groups (UI, Positive, Negative, Security, Access).
5. **Summary table:** kitne cases, kitne automated.

### Test case table ke columns (kabhi na badlein)

| ID | Title | Priority | Preconditions | Steps | Expected result |
| --- | --- | --- | --- | --- | --- |

- **ID:** upar wala rule.
- **Title:** ek chhota sentence. "User can ..." ya "System shows ..." jaisa.
- **Priority:** `High` (core feature, fail ho to app unusable), `Medium`, `Low` (cosmetic).
- **Preconditions:** test se pehle kya hona chahiye (e.g. "User is logged out"). Kuch nahi to `None`.
- **Steps:** numbered, chhote, action wale: `1. Open the login page. 2. Type the email. 3. Click Sign in.`
- **Expected result:** saaf aur check hone wala (e.g. "The workspace page opens.").

### Writing rules
1. Simple English, active voice: "Click Sign in", not "Sign in should be clicked".
2. Ek test case = ek cheez check karna.
3. Exact UI text quotes mein likho: "Incorrect email or password".
4. Numbers jo badalte rehte hain (counts, dates) hardcode mat karo; relation likho ("All = sum of statuses").
5. Test cases read-only rakho jahan data live ho (create/delete nahi).
6. Naya case add karo to ID naya do, purane ID kabhi reuse nahi.

## 4. Naya sub-module add karne ka checklist
- [ ] `docs/test-cases/<module>-<submodule>.md` is format mein likhi
- [ ] Page object banaya / update kiya (`pages/`)
- [ ] `tests/<module>/<submodule>.spec.ts` banaya, IDs doc se match
- [ ] Module naya ho to `playwright.config.ts` ke `chromium` project `testMatch` mein add kiya
- [ ] Tests chalaye, report `reports/<module>/<submodule> test report.html` ban gayi
- [ ] `PLAN.md` aur `GUIDELINES.md` update kiye
