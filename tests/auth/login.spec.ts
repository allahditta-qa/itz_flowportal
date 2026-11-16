// Login page ke saare test cases: UI, positive, negative, security, session.
// Locators page object (LoginPage) mein hain; yahan sirf "kya karna hai" aur "kya expect hai".
import type { Response } from '@playwright/test';
import { test, expect } from '../../fixtures/test-fixtures';
import { ENV } from '../../config/env';
import {
  loginErrorText, malformedEmails, sqlInjection, unknownUser, validUser, xssPayload,
} from '../../test-data/users';

// Server galat login attempts par lockout laga deta hai ("Too many failed attempts. 15 minutes.", HTTP 429).
// Lockout ho to test fail nahi hota, skip hota hai. 401 hi expected hai.
function expectRejected(response: Response) {
  test.skip(response.status() === 429, 'Server lockout active (15 min): thori der baad dobara chalayen');
  expect(response.status()).toBe(401);
}

// Extra galat-login wale tests default par band hain taake lockout na ho (RUN_LOCKOUT_TESTS=1 se chalayen)
const lockoutRisk = process.env.RUN_LOCKOUT_TESTS !== '1';

const needsCreds = () => test.skip(!ENV.hasCredentials, 'Set ITZ_EMAIL / ITZ_PASSWORD in .env');

test.beforeEach(async ({ loginPage }) => {
  await loginPage.open();
});

// ───────────────────────── UI ─────────────────────────
test.describe('Login - UI', () => {
  test('TC_LOGIN_01 - page elements are visible', async ({ loginPage }) => {
    await expect(loginPage.heading).toBeVisible();
    await expect(loginPage.subtitle).toBeVisible();
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.signInButton).toBeEnabled();
    await expect(loginPage.forgotText).toBeVisible();
    await expect(loginPage.themeLight).toBeVisible();
    await expect(loginPage.themeDark).toBeVisible();
    await expect(loginPage.themeSystem).toBeVisible();
  });

  test('TC_LOGIN_02 - password is masked by default and email field has correct type', async ({ loginPage }) => {
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
    await expect(loginPage.emailInput).toHaveAttribute('type', 'email');
  });

  test('TC_LOGIN_03 - password show/hide toggle works both ways', async ({ loginPage }) => {
    await loginPage.passwordInput.pressSequentially('Secret123');
    await loginPage.togglePasswordButton.click();
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'text');
    await expect(loginPage.passwordInput).toHaveValue('Secret123');
    await loginPage.hidePasswordButton.click();
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
  });

  test('TC_LOGIN_04 - Tab key moves focus email -> password', async ({ page, loginPage }) => {
    await loginPage.emailInput.focus();
    await page.keyboard.press('Tab');
    await expect(loginPage.passwordInput).toBeFocused();
  });

  test('TC_LOGIN_05 - "Forgot? Ask the TPM" is plain text, not a link (no navigation)', async ({ page, loginPage }) => {
    await expect(page.getByRole('link', { name: /Forgot/ })).toHaveCount(0);
    await loginPage.forgotText.click();
    await expect(page).toHaveURL(/\/login/);
  });
});

// ───────────────────── Positive (valid login) ─────────────────────
test.describe('Login - positive', () => {
  test.beforeEach(() => needsCreds());

  test('TC_LOGIN_06 - valid credentials + Sign in button open the workspace', async ({ page, loginPage, workspacePage }) => {
    await loginPage.login(validUser.email, validUser.password);
    await expect(page).toHaveURL(/\/workspaces\//);
    await workspacePage.expectLoaded();
  });

  test('TC_LOGIN_07 - valid credentials + Enter key submit the form', async ({ page, loginPage }) => {
    await loginPage.fillForm(validUser.email, validUser.password);
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/workspaces\//);
  });

  test('TC_LOGIN_08 - email in UPPERCASE is accepted (case-insensitive)', async ({ page, loginPage }) => {
    await loginPage.login(validUser.email.toUpperCase(), validUser.password);
    await expect(page).toHaveURL(/\/workspaces\//);
  });

  test('TC_LOGIN_09 - spaces around the email are ignored', async ({ page, loginPage }) => {
    await loginPage.login(`  ${validUser.email}  `, validUser.password);
    await expect(page).toHaveURL(/\/workspaces\//);
  });

  test('TC_LOGIN_10 - login API returns 200 for valid credentials', async ({ loginPage }) => {
    const response = await loginPage.loginAndGetResponse(validUser.email, validUser.password);
    expect(response.status()).toBe(200);
  });

  test('TC_LOGIN_11 - session survives a page reload after login', async ({ page, loginPage }) => {
    await loginPage.login(validUser.email, validUser.password);
    await expect(page).toHaveURL(/\/workspaces\//);
    await page.reload();
    await expect(page).toHaveURL(/\/workspaces\//);
  });

  test('TC_LOGIN_12 - user can log in after a failed attempt (recovery)', async ({ page, loginPage }) => {
    expectRejected(await loginPage.loginAndGetResponse(unknownUser.email, unknownUser.password));
    await expect(loginPage.errorMessage).toBeVisible();
    await loginPage.emailInput.clear();
    await loginPage.passwordInput.clear();
    await loginPage.login(validUser.email, validUser.password);
    await expect(page).toHaveURL(/\/workspaces\//);
  });
});

// ───────────── Negative: client-side validation (server tak request nahi jati) ─────────────
test.describe('Login - negative (validation)', () => {
  test('TC_LOGIN_13 - empty form is blocked', async ({ loginPage }) => {
    await loginPage.signInButton.click();
    await loginPage.expectNoLoginRequest();
  });

  test('TC_LOGIN_14 - only email, password empty is blocked', async ({ loginPage }) => {
    await loginPage.fillForm(unknownUser.email, '');
    await loginPage.signInButton.click();
    await loginPage.expectNoLoginRequest();
  });

  test('TC_LOGIN_15 - only password, email empty is blocked', async ({ loginPage }) => {
    await loginPage.fillForm('', unknownUser.password);
    await loginPage.signInButton.click();
    await loginPage.expectNoLoginRequest();
  });

  for (const [i, bad] of malformedEmails.entries()) {
    test(`TC_LOGIN_16.${i + 1} - malformed email "${bad}" is blocked`, async ({ loginPage }) => {
      await loginPage.login(bad, 'Secret123');
      await loginPage.expectNoLoginRequest();
    });
  }

  test('TC_LOGIN_17 - spaces-only email is blocked', async ({ loginPage }) => {
    await loginPage.login('     ', 'Secret123');
    await loginPage.expectNoLoginRequest();
  });
});

// ───────────── Negative: server rejects (401) ─────────────
// Default par sirf 3 galat attempts hote hain poore suite mein (TC_12, 18, 19), lockout se bachne ke liye.
test.describe('Login - negative (wrong credentials)', () => {
  test('TC_LOGIN_18 - unknown email is rejected with 401, an error message, and the form stays usable', async ({ page, loginPage }) => {
    expectRejected(await loginPage.loginAndGetResponse(unknownUser.email, unknownUser.password));
    await expect(loginPage.errorMessage).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
    await expect(loginPage.emailInput).toBeEditable();
    await expect(loginPage.signInButton).toBeEnabled();
  });

  test('TC_LOGIN_19 - valid email with wrong password is rejected with the SAME message (no user enumeration)', async ({ page, loginPage }) => {
    needsCreds();
    expectRejected(await loginPage.loginAndGetResponse(validUser.email, 'WrongPass#123'));
    await expect(loginPage.errorMessage).toHaveText(loginErrorText);
    await expect(page).toHaveURL(/\/login/);
  });
});

// ───────────── Opt-in: extra galat attempts (lockout ka risk) ─────────────
// Chalane ke liye PowerShell: $env:RUN_LOCKOUT_TESTS=1; npx playwright test tests/auth/login.spec.ts
// Har test 1 galat attempt karta hai; limit paar hone par server 15 min ke liye lock kar deta hai.
test.describe('Login - security and abnormal input (opt-in)', () => {
  test.skip(lockoutRisk, 'Opt-in: lockout se bachne ke liye default par band (RUN_LOCKOUT_TESTS=1)');

  test('TC_LOGIN_20 - whitespace-only password is rejected', async ({ page, loginPage }) => {
    expectRejected(await loginPage.loginAndGetResponse(unknownUser.email, '        '));
    await expect(page).toHaveURL(/\/login/);
  });

  test('TC_LOGIN_22 - SQL injection in the password field does not log in', async ({ page, loginPage }) => {
    expectRejected(await loginPage.loginAndGetResponse(unknownUser.email, sqlInjection));
    await expect(page).toHaveURL(/\/login/);
  });

  test('TC_LOGIN_24 - XSS payload does not run a script or log in', async ({ page, loginPage }) => {
    let dialogSeen = false;
    page.on('dialog', async (d) => { dialogSeen = true; await d.dismiss(); });
    expectRejected(await loginPage.loginAndGetResponse(unknownUser.email, xssPayload));
    expect(dialogSeen).toBe(false);
    await expect(page).toHaveURL(/\/login/);
  });

  test('TC_LOGIN_25 - very long password (1000 chars) does not crash the page', async ({ page, loginPage }) => {
    await loginPage.emailInput.pressSequentially(unknownUser.email, { delay: 10 });
    await loginPage.passwordInput.fill('A'.repeat(1000)); // lambi value type karne mein bohot der lagti hai
    await loginPage.signInButton.click();
    await expect(page).toHaveURL(/\/login/);
    await expect(loginPage.heading).toBeVisible();
  });

  test('TC_LOGIN_27 - unicode / emoji input does not log in', async ({ page, loginPage }) => {
    expectRejected(await loginPage.loginAndGetResponse(unknownUser.email, 'پاسورڈ😀密码'));
    await expect(page).toHaveURL(/\/login/);
  });
});

// ───────────── Negative: abnormal input jo client-side hi block hota hai (server tak nahi jata) ─────────────
test.describe('Login - abnormal input (client-side blocked)', () => {
  test('TC_LOGIN_23 - SQL injection in the email field is blocked', async ({ loginPage }) => {
    await loginPage.login(sqlInjection, 'Secret123');
    await loginPage.expectNoLoginRequest();
  });

  test('TC_LOGIN_26 - very long email (300 chars) is not accepted', async ({ page, loginPage }) => {
    await loginPage.emailInput.pressSequentially(`${'a'.repeat(300)}@theitzon.com`, { delay: 0 });
    await loginPage.passwordInput.pressSequentially('Secret123', { delay: 10 });
    await loginPage.signInButton.click();
    await expect(page).toHaveURL(/\/login/);
    await expect(loginPage.heading).toBeVisible();
  });
});

// ───────────── Access control ─────────────
test.describe('Login - access control', () => {
  test('TC_LOGIN_28 - workspace URL without login redirects to /login', async ({ page, workspacePage }) => {
    await workspacePage.open();
    await expect(page).toHaveURL(/\/login/);
  });

  test('TC_LOGIN_29 - my-work URL without login redirects to /login', async ({ page, myWorkPage }) => {
    await page.goto('/my-work');
    await expect(page).toHaveURL(/\/login/);
    void myWorkPage;
  });

  test('TC_LOGIN_30 - project URL without login redirects to /login', async ({ page }) => {
    await page.goto('/projects');
    await expect(page).toHaveURL(/\/login/);
  });
});
