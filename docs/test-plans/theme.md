# Theme (Light, Dark, System) - Test Plan

**Version:** 1.0  |  **Date:** 17-11-2026  |  **Prepared by:** QA (SDET)  |  **Status:** Executed

## 1. Objective
Check that the user can switch the app look between Light, Dark and System, and that the choice is remembered.

## 2. Understanding of the module
- Three buttons (sun, moon, screen) on the login page and on every app page.
- The selected button has `aria-pressed = true`. The page gets `data-theme = light | dark | system`.
- Background: light `rgb(246, 247, 250)`, dark `rgb(10, 12, 16)`.
- The choice is saved in the browser (`localStorage`, key `itzflow-theme`). It stays after reload, after login and on other pages.
- First visit (nothing saved) shows Light. System follows the computer theme live.

## 3. Scope
**In scope:** switching, default, System behaviour, saving, behaviour across login and pages, unknown saved value.
**Out of scope:** colour contrast and visual check of every page in dark mode, other browsers, mobile, first visit when the computer theme is already dark.

## 4. Sub-modules and test case documents

| Sub-module | Test case doc | Spec file | Cases |
| --- | --- | --- | --- |
| Theme | `docs/test-cases/theme.md` | `tests/theme/theme.spec.ts` | 16 |

## 5. Test approach

| Type | Approach | Automated / Manual |
| --- | --- | --- |
| Functional | Select each theme, check button state, background and `data-theme` | Automated |
| State transition | Dark to Light to System, only one button selected | Automated |
| Persistence | Reload, login, another page, saved value in the browser | Automated |
| Environment | Computer theme light and dark, live change with System | Automated (emulated) |
| Visual and accessibility | Every page in dark, contrast, readable text, images | **Manual (see section 10)** |

## 6. Test environment and data
- **URL:** http://172.16.10.2:8300. **Browser:** Chromium, 1440 x 900.
- **Accounts:** one valid QA account for the in-app cases.
- **Constraints:** none of the cases change data.

## 7. Entry and exit criteria
Default criteria in `docs/QA_PROCESS.md`.

## 8. Risks and mitigation

| Risk | Impact | Mitigation |
| --- | --- | --- |
| A page or image looks wrong in dark mode (not found by background check) | Poor user experience | Manual visual check, section 10 |
| First visit with a dark computer theme not tested | Unknown default | Add one case and verify |

## 9. Deliverables
Test case doc, `components/ThemeSwitcher.ts`, CSV and reports in `reports/theme/`, sign-off in `docs/signoff/`.

## 10. Manual checklist (not automated)
- [ ] Open Workspace, Project and My work pages in Dark and check text is readable.
- [ ] Check buttons, tables, cards and images in Dark.
- [ ] Open the app for the first time with the computer theme set to dark.
- [ ] Check the focus outline on the three theme buttons with the keyboard.
