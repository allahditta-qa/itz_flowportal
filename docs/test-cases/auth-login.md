# Auth - Login Test Cases

**Automation:** `tests/auth/login.spec.ts`  |  **Report:** `reports/auth/login test report.html`
**Page:** `http://172.16.10.2:8300/login`

## Overview
The login page lets a user sign in with an email and a password. After a successful login the user sees the workspace page.

## Scope and notes
- All cases run **without** a saved session (the user starts logged out).
- The server **locks login for 15 minutes** after too many wrong attempts ("Too many failed attempts. 15 minutes."). So the default run makes only 3 wrong attempts (TC_LOGIN_12, 18, 19).
- Cases marked **Opt-in** are skipped by default. Run them with `$env:RUN_LOCKOUT_TESTS=1` in PowerShell, and only when needed.
- Test email for wrong-login cases: `no.such.user.qa@theitzon.com` (does not exist in the app).

## A. Page and UI

| ID | Title | Priority | Preconditions | Steps | Expected result |
| --- | --- | --- | --- | --- | --- |
| TC_LOGIN_01 | All page elements are visible | High | User is logged out | 1. Open the login page. | The heading "Welcome back", the subtitle, the email field, the password field, the Sign in button, the "Forgot? Ask the TPM" text and the Light, Dark and System theme buttons are visible. |
| TC_LOGIN_02 | Password is hidden and the email field has the right type | Medium | User is logged out | 1. Open the login page. | The password field shows dots (type is password). The email field has type email. |
| TC_LOGIN_03 | Password show and hide button works | Medium | User is logged out | 1. Type a password. 2. Click "Show password". 3. Click "Hide password". | After step 2 the password is readable. After step 3 it is hidden again. The typed text does not change. |
| TC_LOGIN_04 | Tab key moves from email to password | Low | User is logged out | 1. Click the email field. 2. Press the Tab key. | The cursor moves to the password field. |
| TC_LOGIN_05 | "Forgot? Ask the TPM" is plain text | Low | User is logged out | 1. Click "Forgot? Ask the TPM". | Nothing opens. The user stays on the login page. It is not a link. |

## B. Positive cases (valid login)

| ID | Title | Priority | Preconditions | Steps | Expected result |
| --- | --- | --- | --- | --- | --- |
| TC_LOGIN_06 | Login with the Sign in button | High | A valid account exists | 1. Type the valid email. 2. Type the valid password. 3. Click Sign in. | The workspace page opens. |
| TC_LOGIN_07 | Login with the Enter key | Medium | A valid account exists | 1. Type the valid email and password. 2. Press Enter. | The workspace page opens. |
| TC_LOGIN_08 | Email in capital letters is accepted | Medium | A valid account exists | 1. Type the valid email in UPPERCASE. 2. Type the valid password. 3. Click Sign in. | The workspace page opens. |
| TC_LOGIN_09 | Spaces around the email are ignored | Low | A valid account exists | 1. Type the valid email with spaces before and after. 2. Type the password. 3. Click Sign in. | The workspace page opens. |
| TC_LOGIN_10 | Login request succeeds | Medium | A valid account exists | 1. Log in with valid details. | The server answers the login request with status 200. |
| TC_LOGIN_11 | Session stays after page reload | High | A valid account exists | 1. Log in with valid details. 2. Reload the page. | The user stays on the workspace page and is not sent back to login. |
| TC_LOGIN_12 | User can log in after a wrong attempt | High | A valid account exists | 1. Log in with a wrong email. 2. Clear both fields. 3. Log in with valid details. | The workspace page opens. |

## C. Negative cases: form validation (nothing is sent to the server)

| ID | Title | Priority | Preconditions | Steps | Expected result |
| --- | --- | --- | --- | --- | --- |
| TC_LOGIN_13 | Empty form is blocked | High | User is logged out | 1. Leave both fields empty. 2. Click Sign in. | The user stays on the login page. No login request is sent. |
| TC_LOGIN_14 | Missing password is blocked | High | User is logged out | 1. Type only an email. 2. Click Sign in. | The user stays on the login page. No login request is sent. |
| TC_LOGIN_15 | Missing email is blocked | High | User is logged out | 1. Type only a password. 2. Click Sign in. | The user stays on the login page. No login request is sent. |
| TC_LOGIN_16.1 | Email "plainaddress" is blocked | Medium | User is logged out | 1. Type `plainaddress` as the email and any password. 2. Click Sign in. | The user stays on the login page. No login request is sent. |
| TC_LOGIN_16.2 | Email "@theitzon.com" is blocked | Medium | User is logged out | Same steps with `@theitzon.com`. | Same as above. |
| TC_LOGIN_16.3 | Email "user@" is blocked | Medium | User is logged out | Same steps with `user@`. | Same as above. |
| TC_LOGIN_16.4 | Email with a space inside is blocked | Medium | User is logged out | Same steps with `user name@theitzon.com`. | Same as above. |
| TC_LOGIN_16.5 | Email with two @ signs is blocked | Medium | User is logged out | Same steps with `user@@theitzon.com`. | Same as above. |
| TC_LOGIN_17 | Email with only spaces is blocked | Medium | User is logged out | 1. Type spaces as the email. 2. Type any password. 3. Click Sign in. | The user stays on the login page. No login request is sent. |

## D. Negative cases: wrong details (server rejects)

| ID | Title | Priority | Preconditions | Steps | Expected result |
| --- | --- | --- | --- | --- | --- |
| TC_LOGIN_18 | Unknown email is rejected | High | User is logged out | 1. Type an email that does not exist. 2. Type any password. 3. Click Sign in. | The server answers with status 401. The message "Incorrect email or password" is shown. The user stays on the login page and can type again. |
| TC_LOGIN_19 | Wrong password shows the same message | High | A valid account exists | 1. Type the valid email. 2. Type a wrong password. 3. Click Sign in. | Status 401 and the same message "Incorrect email or password" (so nobody can find out which emails exist). The user stays on the login page. |

## E. Security and unusual input

| ID | Title | Priority | Preconditions | Steps | Expected result |
| --- | --- | --- | --- | --- | --- |
| TC_LOGIN_20 | Password with only spaces is rejected (Opt-in) | Medium | User is logged out | 1. Type a non-existing email. 2. Type spaces as the password. 3. Click Sign in. | Status 401. The user stays on the login page. |
| TC_LOGIN_22 | SQL injection in the password does not log in (Opt-in) | High | User is logged out | 1. Type a non-existing email. 2. Type `' OR '1'='1' --` as the password. 3. Click Sign in. | Status 401. The user stays on the login page. |
| TC_LOGIN_23 | SQL injection in the email is blocked | High | User is logged out | 1. Type `' OR '1'='1' --` as the email. 2. Type any password. 3. Click Sign in. | The user stays on the login page. No login request is sent. |
| TC_LOGIN_24 | Script text does not run (Opt-in) | High | User is logged out | 1. Type a non-existing email. 2. Type `<script>alert(1)</script>` as the password. 3. Click Sign in. | No pop-up appears. Status 401. The user stays on the login page. |
| TC_LOGIN_25 | Very long password does not break the page (Opt-in) | Low | User is logged out | 1. Type a non-existing email. 2. Paste a password of 1000 letters. 3. Click Sign in. | The page does not crash. The user stays on the login page. |
| TC_LOGIN_26 | Very long email is not accepted | Low | User is logged out | 1. Type an email with 300 letters before the @. 2. Type any password. 3. Click Sign in. | The user stays on the login page. The page does not crash. |
| TC_LOGIN_27 | Emoji and non-English letters do not log in (Opt-in) | Low | User is logged out | 1. Type a non-existing email. 2. Type a password with emoji and Urdu or Chinese letters. 3. Click Sign in. | Status 401. The user stays on the login page. |

## F. Access without login

| ID | Title | Priority | Preconditions | Steps | Expected result |
| --- | --- | --- | --- | --- | --- |
| TC_LOGIN_28 | Workspace page needs login | High | User is logged out | 1. Open the workspace page address directly. | The user is sent to the login page. |
| TC_LOGIN_29 | "Your work" page needs login | High | User is logged out | 1. Open `/my-work` directly. | The user is sent to the login page. |
| TC_LOGIN_30 | Projects page needs login | High | User is logged out | 1. Open `/projects` directly. | The user is sent to the login page. |

## Summary

| Group | Cases | Automated | Skipped by default (Opt-in) |
| --- | --- | --- | --- |
| A. Page and UI | 5 | 5 | 0 |
| B. Positive | 7 | 7 | 0 |
| C. Validation | 9 | 9 | 0 |
| D. Wrong details | 2 | 2 | 0 |
| E. Security | 7 | 7 | 5 |
| F. Access | 3 | 3 | 0 |
| **Total** | **33** | **33** | **5** |
