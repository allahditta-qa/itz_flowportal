# Theme (Light, Dark, System) - Sign-off Report

**Date:** 17-11-2026  |  **Prepared by:** QA (SDET)  |  **Build / environment:** http://172.16.10.2:8300
**Recommendation: SIGNED OFF (functional), with a manual visual check pending**

## 1. Summary
All 16 automated Theme cases were executed and passed. The three theme buttons work on the login page and inside the app, the choice is remembered after reload, after login and on other pages, and System follows the computer theme. No defect was found. A manual visual check of every page in dark mode and one extra case (first visit with a dark computer theme) are still pending, but they do not block the functional sign-off.

## 2. Scope covered
**Tested:** default theme, switching (Light, Dark, System), System with light and dark computer theme and live change, saving in the browser, behaviour across login and pages, one unknown saved value.
**Not tested (and why):** visual and contrast check of every page in dark mode (manual), other browsers and mobile (out of scope), first visit with a dark computer theme (case not written yet).

## 3. Execution results

| Sub-module | Total | Executed | Passed | Failed | Not executed | Pass rate |
| --- | --- | --- | --- | --- | --- | --- |
| Theme | 16 | 16 | 16 | 0 | 0 | 100% |

**Evidence (local, in `reports/`):** `reports/theme/theme test 17-11-2026_15-23.html` and its CSV. History: `reports/index.html`.

## 4. Exit criteria check

| Criterion | Result | Met? |
| --- | --- | --- |
| All High priority cases executed and passed | 7 of 7 High cases passed | Yes |
| Pass rate 95% or more | 100% (16 of 16) | Yes |
| No open Critical or High defect | None found | Yes |
| Skipped cases justified | No case was skipped | Yes |

## 5. Defects and observations
No defect and no observation. Defect log not needed for this module.

## 6. Risks and limitations
- Automated checks look at the page background and the button state only. A text or image that is hard to read in dark mode will **not** be found automatically.
- Chromium only.

## 7. Recommendation and next steps
1. Do the manual dark mode check on the Workspace, Project and My work pages (test plan section 10).
2. Add one case: first visit with the computer theme set to dark.
3. Keep this module in the regression run.

## 8. Approval

| Role | Name | Decision | Date |
| --- | --- | --- | --- |
| QA (SDET) | | Recommends: Signed off | 17-11-2026 |
| Product Owner / TPM | | | |
