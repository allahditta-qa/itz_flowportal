# Auth (Login and Sign out) - Sign-off Report

**Date:** 17-11-2026  |  **Prepared by:** QA (SDET)  |  **Build / environment:** http://172.16.10.2:8300
**Recommendation: CONDITIONAL SIGN-OFF**

## 1. Summary
All 29 automated cases that were executed passed (28 Login and 1 Sign out). No confirmed defect was found. Five Login security cases (SQL injection, script text, whitespace password, 1000-letter password, unicode) were **not executed** in the default run because wrong logins can lock the login for 15 minutes. Four observations need product or dev input, and one of them (autofill and paste) needs a manual check. Because of these gaps the recommendation is conditional.

## 2. Scope covered
**Tested:** Login (UI, positive, validation, wrong details, security basics, access without login) and Sign out.
**Not tested (and why):** Forgot password (the app only shows text), SSO or MFA (not present), other browsers and mobile (out of scope), autofill and paste (manual check pending), accessibility (not done).

## 3. Execution results

| Sub-module | Total | Executed | Passed | Failed | Not executed | Pass rate |
| --- | --- | --- | --- | --- | --- | --- |
| Login | 33 | 28 | 28 | 0 | 5 (opt-in) | 100% of executed |
| Sign out | 1 | 1 | 1 | 0 | 0 | 100% |
| **Auth total** | **34** | **29** | **29** | **0** | **5** | **100% of executed** |

**Evidence (local, in `reports/`):** `reports/auth/login test 17-11-2026_15-20.html` and its CSV `login test cases 17-11-2026_15-20.csv`; `reports/auth/signout test 17-11-2026_15-23.html`. History: `reports/index.html`.

## 4. Exit criteria check

| Criterion | Result | Met? |
| --- | --- | --- |
| All High priority cases executed and passed | All High cases that are automated in the default run passed. High cases TC_LOGIN_22, 23, 24 are security cases: 23 executed and passed; 22 and 24 are opt-in and not executed | **No** (2 High cases not executed) |
| Pass rate 95% or more | 100% of executed (29 of 29) | Yes |
| No open Critical or High defect | None found | Yes |
| Skipped cases justified | Yes, lockout risk (see test plan) | Yes |

## 5. Defects and observations
Defect log: `docs/defects/auth.md`.

| ID | Title | Severity | Status |
| --- | --- | --- | --- |
| OBS_AUTH_01 | Login can fail with paste or autofill style input | Medium | Needs manual check |
| OBS_AUTH_02 | Logged-in user can still open /login | Low | Needs product input |
| OBS_AUTH_03 | Server refused connections under many parallel logins | Medium | Needs dev input |
| OBS_AUTH_04 | Lockout rule (15 minutes) also counts unknown emails | Low | Needs product input |

## 6. Risks and limitations
- Live system: only read-only checks; wrong logins are limited to avoid a lockout.
- Tests ran on Chromium only.
- If OBS_AUTH_01 is real, users who paste or autofill the email may not be able to sign in. This is the biggest open risk.

## 7. Recommendation and next steps
1. Do the manual checks for autofill and paste (test plan section 10) and update OBS_AUTH_01.
2. Ask the TPM for the lockout rule, then run the 5 opt-in security cases once with `$env:RUN_LOCKOUT_TESTS=1`.
3. Share OBS_AUTH_03 with the developers.
4. After steps 1 and 2 pass, change this sign-off to **Signed off**.

## 8. Approval

| Role | Name | Decision | Date |
| --- | --- | --- | --- |
| QA (SDET) | | Recommends: Conditional sign-off | 17-11-2026 |
| Product Owner / TPM | | | |
