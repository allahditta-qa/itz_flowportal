# Auth - Login Test Cases

**Automation:** `tests/auth/login.spec.ts`  |  **Report:** `reports/auth/login test <DD-MM-YYYY>_<HH-mm>.html` (all reports: `reports/index.html`)
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
| TC_LOGIN_01 | Check all elements are visible on the login page | High | User is logged out | 1. Open the login page. | The heading "Welcome back", the subtitle, the email field, the password field, the Sign in button, the "Forgot? Ask the TPM" text and the Light, Dark and System theme buttons are visible. |
| TC_LOGIN_02 | Check the password is hidden and the email field type is email | Medium | User is logged out | 1. Open the login page. | The password field shows dots (type is password). The email field has type email. |
| TC_LOGIN_03 | Show and hide the password "Secret123" using the eye button | Medium | User is logged out | 1. Type a password. 2. Click "Show password". 3. Click "Hide password". | After step 2 the password is readable. After step 3 it is hidden again. The typed text does not change. |
| TC_LOGIN_04 | Press the Tab key on the email field and check the cursor moves to the password field | Low | User is logged out | 1. Click the email field. 2. Press the Tab key. | The cursor moves to the password field. |
| TC_LOGIN_05 | Click "Forgot? Ask the TPM" and check nothing opens | Low | User is logged out | 1. Click "Forgot? Ask the TPM". | Nothing opens. The user stays on the login page. It is not a link. |

## B. Positive cases (valid login)

| ID | Title | Priority | Preconditions | Steps | Expected result |
| --- | --- | --- | --- | --- | --- |
| TC_LOGIN_06 | Login with valid email and valid password by clicking Sign in | High | A valid account exists | 1. Type the valid email. 2. Type the valid password. 3. Click Sign in. | The workspace page opens. |
| TC_LOGIN_07 | Login with valid email and valid password by pressing Enter | Medium | A valid account exists | 1. Type the valid email and password. 2. Press Enter. | The workspace page opens. |
| TC_LOGIN_08 | Login with valid email in UPPERCASE and valid password | Medium | A valid account exists | 1. Type the valid email in UPPERCASE. 2. Type the valid password. 3. Click Sign in. | The workspace page opens. |
| TC_LOGIN_09 | Login with valid email having spaces before and after, and valid password | Low | A valid account exists | 1. Type the valid email with spaces before and after. 2. Type the password. 3. Click Sign in. | The workspace page opens. |
| TC_LOGIN_10 | Login with valid email and valid password and check the server answers with status 200 | Medium | A valid account exists | 1. Log in with valid details. | The server answers the login request with status 200. |
| TC_LOGIN_11 | Login with valid email and valid password, then reload the page and stay logged in | High | A valid account exists | 1. Log in with valid details. 2. Reload the page. | The user stays on the workspace page and is not sent back to login. |
| TC_LOGIN_12 | Login with wrong email "no.such.user.qa@theitzon.com", then login again with valid email and valid password | High | A valid account exists | 1. Log in with a wrong email. 2. Clear both fields. 3. Log in with valid details. | The workspace page opens. |

## C. Negative cases: form validation (nothing is sent to the server)

| ID | Title | Priority | Preconditions | Steps | Expected result |
| --- | --- | --- | --- | --- | --- |
| TC_LOGIN_13 | Click Sign in with empty email and empty password | High | User is logged out | 1. Leave both fields empty. 2. Click Sign in. | The user stays on the login page. No login request is sent. |
| TC_LOGIN_14 | Click Sign in with email "no.such.user.qa@theitzon.com" and empty password | High | User is logged out | 1. Type only an email. 2. Click Sign in. | The user stays on the login page. No login request is sent. |
| TC_LOGIN_15 | Click Sign in with empty email and password "WrongPass#123" | High | User is logged out | 1. Type only a password. 2. Click Sign in. | The user stays on the login page. No login request is sent. |
| TC_LOGIN_16.1 | Click Sign in with invalid email "plainaddress" and password "Secret123" | Medium | User is logged out | 1. Type `plainaddress` as the email and any password. 2. Click Sign in. | The user stays on the login page. No login request is sent. |
| TC_LOGIN_16.2 | Click Sign in with invalid email "@theitzon.com" and password "Secret123" | Medium | User is logged out | Same steps with `@theitzon.com`. | Same as above. |
| TC_LOGIN_16.3 | Click Sign in with invalid email "user@" and password "Secret123" | Medium | User is logged out | Same steps with `user@`. | Same as above. |
| TC_LOGIN_16.4 | Click Sign in with invalid email "user name@theitzon.com" and password "Secret123" | Medium | User is logged out | Same steps with `user name@theitzon.com`. | Same as above. |
| TC_LOGIN_16.5 | Click Sign in with invalid email "user@@theitzon.com" and password "Secret123" | Medium | User is logged out | Same steps with `user@@theitzon.com`. | Same as above. |
| TC_LOGIN_17 | Click Sign in with spaces-only email and password "Secret123" | Medium | User is logged out | 1. Type spaces as the email. 2. Type any password. 3. Click Sign in. | The user stays on the login page. No login request is sent. |

## D. Negative cases: wrong details (server rejects)

| ID | Title | Priority | Preconditions | Steps | Expected result |
| --- | --- | --- | --- | --- | --- |
| TC_LOGIN_18 | Login with unknown email "no.such.user.qa@theitzon.com" and password "WrongPass#123" | High | User is logged out | 1. Type an email that does not exist. 2. Type any password. 3. Click Sign in. | The server answers with status 401. The message "Incorrect email or password" is shown. The user stays on the login page and can type again. |
| TC_LOGIN_19 | Login with valid email and wrong password "WrongPass#123" | High | A valid account exists | 1. Type the valid email. 2. Type a wrong password. 3. Click Sign in. | Status 401 and the same message "Incorrect email or password" (so nobody can find out which emails exist). The user stays on the login page. |

## E. Security and unusual input

| ID | Title | Priority | Preconditions | Steps | Expected result |
| --- | --- | --- | --- | --- | --- |
| TC_LOGIN_20 | Login with unknown email and a password of only spaces | Medium | User is logged out | 1. Type a non-existing email. 2. Type spaces as the password. 3. Click Sign in. | Status 401. The user stays on the login page. |
| TC_LOGIN_22 | Login with unknown email and SQL injection text "' OR '1'='1' --" as the password | High | User is logged out | 1. Type a non-existing email. 2. Type `' OR '1'='1' --` as the password. 3. Click Sign in. | Status 401. The user stays on the login page. |
| TC_LOGIN_23 | Click Sign in with SQL injection text "' OR '1'='1' --" as the email and password "Secret123" | High | User is logged out | 1. Type `' OR '1'='1' --` as the email. 2. Type any password. 3. Click Sign in. | The user stays on the login page. No login request is sent. |
| TC_LOGIN_24 | Login with unknown email and script text "<script>alert(1)</script>" as the password | High | User is logged out | 1. Type a non-existing email. 2. Type `<script>alert(1)</script>` as the password. 3. Click Sign in. | No pop-up appears. Status 401. The user stays on the login page. |
| TC_LOGIN_25 | Login with unknown email and a password of 1000 letters | Low | User is logged out | 1. Type a non-existing email. 2. Paste a password of 1000 letters. 3. Click Sign in. | The page does not crash. The user stays on the login page. |
| TC_LOGIN_26 | Click Sign in with an email of 300 letters before @theitzon.com and password "Secret123" | Low | User is logged out | 1. Type an email with 300 letters before the @. 2. Type any password. 3. Click Sign in. | The user stays on the login page. The page does not crash. |
| TC_LOGIN_27 | Login with unknown email and a password with emoji and Urdu/Chinese letters | Low | User is logged out | 1. Type a non-existing email. 2. Type a password with emoji and Urdu or Chinese letters. 3. Click Sign in. | Status 401. The user stays on the login page. |

## F. Access without login

| ID | Title | Priority | Preconditions | Steps | Expected result |
| --- | --- | --- | --- | --- | --- |
| TC_LOGIN_28 | Open the workspace page without login and check the login page opens | High | User is logged out | 1. Open the workspace page address directly. | The user is sent to the login page. |
| TC_LOGIN_29 | Open /my-work without login and check the login page opens | High | User is logged out | 1. Open `/my-work` directly. | The user is sent to the login page. |
| TC_LOGIN_30 | Open /projects without login and check the login page opens | High | User is logged out | 1. Open `/projects` directly. | The user is sent to the login page. |

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
