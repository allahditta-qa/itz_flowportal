# Auth - Defects and Observations

**Last updated:** 17-11-2026

IDs: `DEF_<MODULE>_NN` (confirmed bug), `OBS_<MODULE>_NN` (observation: product team se confirm karna hai). Purane ID kabhi reuse nahi hote.

| ID | Type | Title | Severity | Status | Steps to reproduce | Expected | Actual | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| OBS_AUTH_01 | Observation | Login can fail when the email is set by paste or autofill style input | Medium | Needs manual check | 1. Open the login page. 2. Set the email field by script input (Playwright `fill`). 3. Click Sign in. | Login works like typing | The message "That does not look like an email address" appears and no login request is sent. Typing key by key works | Found during exploration, 16-11-2026. Not a test case yet. Must be checked by hand with paste and the browser password manager |
| OBS_AUTH_02 | Observation | A logged-in user can still open /login | Low | Needs product input | 1. Login. 2. Open `/login` in the same tab. | Probably goes to the workspace | The login page opens | Exploration, 16-11-2026 |
| OBS_AUTH_03 | Observation | Server refused connections when many logins came together | Medium | Needs dev input | 1. Run 28 login tests in parallel. | Server stays up | `ERR_CONNECTION_REFUSED` for a few minutes | Run on 16-11-2026 (28 failed). Server came back by itself |
| OBS_AUTH_04 | Observation | Lockout also counts unknown emails and shows "Too many failed attempts. 15 minutes." | Low | Needs product input | 1. Try 9 wrong logins in a short time. | Rule is known to the team | Login is blocked for about 15 minutes | Run on 16-11-2026. Ask the TPM for the exact rule (how many attempts, per IP or per email) |

**Status values:** Open, Confirmed, Fixed (retest pending), Closed, Rejected, Needs manual check, Needs product input, Needs dev input.

No confirmed defect (DEF) was found in Auth. All executed cases passed.
