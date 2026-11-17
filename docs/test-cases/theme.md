# Theme - Light, Dark and System Test Cases

**Automation:** `tests/theme/theme.spec.ts`  |  **Report:** `reports/theme/theme test report.html`
**Where:** the three small buttons (sun, moon, screen) on the login page and on every page of the app.

## Overview
The user can choose how the app looks: **Light**, **Dark** or **System** (follows the computer's theme). The choice is remembered by the browser.

## How the theme is checked
- The selected button has `aria-pressed = true`. The other two are `false`.
- The page background is **light = rgb(246, 247, 250)** and **dark = rgb(10, 12, 16)**.
- The browser saves the choice in local storage with the name `itzflow-theme` (values: `light`, `dark`, `system`).

## Scope and notes
- All cases are read-only. They only change the look of the page.
- Login page cases (A, B, C) run **without** a saved session. App cases (D) run with the saved login session.
- TC_THEME_11 does one normal login with the valid account.

## A. Page and default

| ID | Title | Priority | Preconditions | Steps | Expected result |
| --- | --- | --- | --- | --- | --- |
| TC_THEME_01 | Check the Light, Dark and System buttons are visible on the login page | High | User is logged out | 1. Open the login page. | The Light, Dark and System buttons are visible. |
| TC_THEME_02 | Open the login page for the first time and check Light is selected with a light background | High | Browser has no saved theme. Computer theme is light | 1. Open the login page. | The Light button is selected. The page background is light (rgb(246, 247, 250)). |

## B. Switching the theme (login page)

| ID | Title | Priority | Preconditions | Steps | Expected result |
| --- | --- | --- | --- | --- | --- |
| TC_THEME_03 | Click Dark on the login page and check the page turns dark | High | User is logged out | 1. Open the login page. 2. Click Dark. | The Dark button is selected. The page background is dark (rgb(10, 12, 16)). |
| TC_THEME_04 | Click Dark, then click Light and check the page turns light again | High | User is logged out | 1. Click Dark. 2. Click Light. | The Light button is selected. The page background is light again. |
| TC_THEME_05 | Click System while the computer theme is light and check the page is light | Medium | Computer theme is light | 1. Click System. | The System button is selected. The page background is light. |
| TC_THEME_06 | Click System while the computer theme is dark and check the page is dark | Medium | Computer theme is dark | 1. Click System. | The System button is selected. The page background is dark. |
| TC_THEME_07 | Select System, then change the computer theme from light to dark and check the page turns dark without reload | Medium | Computer theme is light | 1. Click System. 2. Change the computer theme to dark. | The page turns dark by itself. The System button stays selected. |

## C. The choice is remembered

| ID | Title | Priority | Preconditions | Steps | Expected result |
| --- | --- | --- | --- | --- | --- |
| TC_THEME_08 | Click Dark, reload the page and check the page is still dark with Dark selected | High | User is logged out | 1. Click Dark. 2. Reload the page. | The page is still dark. The Dark button is still selected. |
| TC_THEME_09 | Click Dark and check the browser saves the choice as "dark" | Medium | User is logged out | 1. Click Dark. | The browser keeps `itzflow-theme = dark`. |
| TC_THEME_10 | Click System, reload the page and check System is still selected | Medium | User is logged out | 1. Click System. 2. Reload the page. | The System button is still selected. |
| TC_THEME_11 | Click Dark on the login page, then login with valid email and valid password and check the workspace page is dark | High | A valid account exists | 1. Click Dark. 2. Login with the valid email and password. | The workspace page opens in dark. The Dark button is selected. |

## D. Inside the app

| ID | Title | Priority | Preconditions | Steps | Expected result |
| --- | --- | --- | --- | --- | --- |
| TC_THEME_12 | Check the Light, Dark and System buttons are visible on the workspace page | High | User is logged in | 1. Open the workspace page. | The Light, Dark and System buttons are visible. |
| TC_THEME_13 | Click Dark on the workspace page and check the page turns dark | High | User is logged in | 1. Open the workspace page. 2. Click Dark. | The Dark button is selected. The page background is dark. |
| TC_THEME_14 | Click Dark on the workspace page, open /my-work and check it is still dark | High | User is logged in | 1. Click Dark. 2. Open the "Your work" page. | The "Your work" page is dark. The Dark button is selected. |
| TC_THEME_15 | Click Dark, Light and System one by one on the workspace page and check only one button is selected each time | Medium | User is logged in | 1. Click Dark. 2. Click Light. 3. Click System. | After each click only the clicked button is selected. The other two are not. |

## E. Unusual saved value

| ID | Title | Priority | Preconditions | Steps | Expected result |
| --- | --- | --- | --- | --- | --- |
| TC_THEME_16 | Save the unknown theme value "blue" in the browser, open the login page and check the page still loads with a valid theme | Low | Browser has `itzflow-theme = blue` | 1. Open the login page. | The page loads without a problem. The background is either light or dark. |

## Summary

| Group | Cases | Automated |
| --- | --- | --- |
| A. Page and default | 2 | 2 |
| B. Switching | 5 | 5 |
| C. Remembered | 4 | 4 |
| D. Inside the app | 4 | 4 |
| E. Unusual value | 1 | 1 |
| **Total** | **16** | **16** |
