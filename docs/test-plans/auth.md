# Auth (Login and Sign out) - Test Plan

**Version:** 1.0  |  **Date:** 17-11-2026  |  **Prepared by:** QA (SDET)  |  **Status:** Executed

## 1. Objective
Check that a user can sign in with valid details, cannot sign in with wrong or unsafe details, and can sign out. Also check that pages need a login.

## 2. Understanding of the module
- Login page: `http://172.16.10.2:8300/login`. Fields: email, password (with show/hide). Button: Sign in. Text "Forgot? Ask the TPM" (plain text, not a link).
- Client-side validation blocks empty form and wrong email format (no request is sent).
- Server answers 200 for valid details and 401 for wrong details. Message: "Incorrect email or password" (same for unknown email and wrong password).
- After many wrong attempts the server locks login: "Too many failed attempts. 15 minutes." (HTTP 429). Unknown emails also count (looks IP-based).
- Email is not case sensitive and spaces around it are removed.
- Pages (`/workspaces/...`, `/my-work`, `/projects`) send a logged-out user to the login page.
- Sign out button is in the app header.

## 3. Scope
**In scope:** Login (UI, positive, validation, wrong details, security basics, access without login) and Sign out.
**Out of scope:** Forgot password flow (the app only shows text), SSO or MFA, password rules (no sign-up page), performance or load testing, browsers other than Chromium, mobile devices.

## 4. Sub-modules and test case documents

| Sub-module | Test case doc | Spec file | Cases |
| --- | --- | --- | --- |
| Login | `docs/test-cases/auth-login.md` | `tests/auth/login.spec.ts` | 33 |
| Sign out | `docs/test-cases/auth-signout.md` | `tests/auth/signout.spec.ts` | 1 |

## 5. Test approach

| Type | Approach | Automated / Manual |
| --- | --- | --- |
| Functional positive | Valid login by button and Enter key, email in capitals, spaces around email, reload keeps session, login after a failed attempt | Automated |
| Functional negative | Unknown email, wrong password, same message for both | Automated |
| Validation | Empty fields, missing email or password, 5 wrong email formats, spaces-only email | Automated |
| Security basics | SQL injection text, script text, long and unicode input, access without login | Automated (5 cases opt-in because of lockout) |
| UI | Elements visible, password hidden, show/hide, Tab order, "Forgot" text | Automated |
| Autofill, paste, password manager | Real browser behaviour | **Manual (see section 10)** |
| Accessibility, other browsers | Screen reader, contrast, Firefox, Safari | **Manual, not done** |

## 6. Test environment and data
- **URL:** http://172.16.10.2:8300 (local network only).
- **Browser:** Chromium (Playwright), desktop 1440 x 900.
- **Accounts:** one valid QA account (kept in `.env`, never in documents) and one unknown email `no.such.user.qa@theitzon.com`.
- **Constraints:** live system, login lockout (15 minutes), server slows down with many parallel logins (use 1 or 2 workers).

## 7. Entry and exit criteria
**Entry:** app reachable, `.env` has the account, code compiles.
**Exit:** default exit criteria in `docs/QA_PROCESS.md`.

## 8. Risks and mitigation

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Too many wrong logins lock the account or IP for 15 minutes | Tests and real users blocked | Only 3 wrong attempts in the default run. Extra security cases are opt-in (`RUN_LOCKOUT_TESTS=1`) |
| Server refused connections when 28 tests logged in at the same time | Failed runs, possible impact on other users | Fewer workers (2), serial runs for login |
| Live data | Wrong changes by tests | All tests are read-only |

## 9. Deliverables
Test case docs, automation (`pages/LoginPage.ts`), CSV and reports in `reports/auth/`, defect log `docs/defects/auth.md`, sign-off `docs/signoff/`.

## 10. Manual checklist (not automated)
- [ ] Sign in using the browser's password manager (autofill).
- [ ] Sign in after pasting the email with Ctrl+V.
- [ ] Sign in on Firefox and Safari.
- [ ] Check the page with a screen reader and keyboard only.
- [ ] Check the lockout message and how long it really lasts (ask the TPM for the exact rule).
