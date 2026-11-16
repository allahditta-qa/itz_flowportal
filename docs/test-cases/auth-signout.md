# Auth - Sign Out Test Cases

**Automation:** `tests/auth/signout.spec.ts`  |  **Report:** `reports/auth/signout test report.html`

## Overview
A logged-in user can sign out. After signing out the user goes back to the login page.

## Scope and notes
- The test makes its own fresh login, because signing out can end the saved session on the server.

## Test cases

| ID | Title | Priority | Preconditions | Steps | Expected result |
| --- | --- | --- | --- | --- | --- |
| TC_AUTH_01 | Sign out returns the user to the login page | High | A valid account exists | 1. Log in with valid details. 2. Click "Sign out". | The login page opens. |

## Summary

| Cases | Automated | Skipped |
| --- | --- | --- |
| 1 | 1 | 0 |
