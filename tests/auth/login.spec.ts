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
  test(`TC_LOGIN_01 - Check all elements are visible on the login page`, async ({ loginPage }) => {
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

  test(`TC_LOGIN_02 - Check the password is hidden and the email field type is email`, async ({ loginPage }) => {
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
    await expect(loginPage.emailInput).toHaveAttribute('type', 'email');
  });

  test(`TC_LOGIN_03 - Show and hide the password "Secret123" using the eye button`, async ({ loginPage }) => {
    await loginPage.passwordInput.pressSequentially('Secret123');
    await loginPage.togglePasswordButton.click();
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'text');
    await expect(loginPage.passwordInput).toHaveValue('Secret123');
    await loginPage.hidePasswordButton.click();
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
  });

  test(`TC_LOGIN_04 - Press the Tab key on the email field and check the cursor moves to the password field`, async ({ page, loginPage }) => {
    await loginPage.emailInput.focus();
    await page.keyboard.press('Tab');
    await expect(loginPage.passwordInput).toBeFocused();
  });

  test(`TC_LOGIN_05 - Click "Forgot? Ask the TPM" and check nothing opens`, async ({ page, loginPage }) => {
    await expect(page.getByRole('link', { name: /Forgot/ })).toHaveCount(0);
    await loginPage.forgotText.click();
    await expect(page).toHaveURL(/\/login/);
  });
});

// ───────────────────── Positive (valid login) ─────────────────────
test.describe('Login - positive', () => {
  test.beforeEach(() => needsCreds());

  test(`TC_LOGIN_06 - Login with valid email and valid password by clicking Sign in`, async ({ page, loginPage, workspacePage }) => {
    await loginPage.login(validUser.email, validUser.password);
    await expect(page).toHaveURL(/\/workspaces\//);
    await workspacePage.expectLoaded();
  });

  test(`TC_LOGIN_07 - Login with valid email and valid password by pressing Enter`, async ({ page, loginPage }) => {
    await loginPage.fillForm(validUser.email, validUser.password);
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/workspaces\//);
  });

  test(`TC_LOGIN_08 - Login with valid email in UPPERCASE and valid password`, async ({ page, loginPage }) => {
    await loginPage.login(validUser.email.toUpperCase(), validUser.password);
    await expect(page).toHaveURL(/\/workspaces\//);
  });

  test(`TC_LOGIN_09 - Login with valid email having spaces before and after, and valid password`, async ({ page, loginPage }) => {
    await loginPage.login(`  ${validUser.email}  `, validUser.password);
    await expect(page).toHaveURL(/\/workspaces\//);
  });

  test(`TC_LOGIN_10 - Login with valid email and valid password and check the server answers with status 200`, async ({ loginPage }) => {
    const response = await loginPage.loginAndGetResponse(validUser.email, validUser.password);
    expect(response.status()).toBe(200);
  });

  test(`TC_LOGIN_11 - Login with valid email and valid password, then reload the page and stay logged in`, async ({ page, loginPage }) => {
    await loginPage.login(validUser.email, validUser.password);
    await expect(page).toHaveURL(/\/workspaces\//);
    await page.reload();
    await expect(page).toHaveURL(/\/workspaces\//);
  });

  test(`TC_LOGIN_12 - Login with wrong email "no.such.user.qa@theitzon.com", then login again with valid email and valid password`, async ({ page, loginPage }) => {
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
  test(`TC_LOGIN_13 - Click Sign in with empty email and empty password`, async ({ loginPage }) => {
    await loginPage.signInButton.click();
    await loginPage.expectNoLoginRequest();
  });

  test(`TC_LOGIN_14 - Click Sign in with email "no.such.user.qa@theitzon.com" and empty password`, async ({ loginPage }) => {
    await loginPage.fillForm(unknownUser.email, '');
    await loginPage.signInButton.click();
    await loginPage.expectNoLoginRequest();
  });

  test(`TC_LOGIN_15 - Click Sign in with empty email and password "WrongPass#123"`, async ({ loginPage }) => {
    await loginPage.fillForm('', unknownUser.password);
    await loginPage.signInButton.click();
    await loginPage.expectNoLoginRequest();
  });

  for (const [i, bad] of malformedEmails.entries()) {
    test(`TC_LOGIN_16.${i + 1} - Click Sign in with invalid email "${bad}" and password "Secret123"`, async ({ loginPage }) => {
      await loginPage.login(bad, 'Secret123');
      await loginPage.expectNoLoginRequest();
    });
  }

  test(`TC_LOGIN_17 - Click Sign in with spaces-only email and password "Secret123"`, async ({ loginPage }) => {
    await loginPage.login('     ', 'Secret123');
    await loginPage.expectNoLoginRequest();
  });
});

// ───────────── Negative: server rejects (401) ─────────────
// Default par sirf 3 galat attempts hote hain poore suite mein (TC_12, 18, 19), lockout se bachne ke liye.
test.describe('Login - negative (wrong credentials)', () => {
  test(`TC_LOGIN_18 - Login with unknown email "no.such.user.qa@theitzon.com" and password "WrongPass#123"`, async ({ page, loginPage }) => {
    expectRejected(await loginPage.loginAndGetResponse(unknownUser.email, unknownUser.password));
    await expect(loginPage.errorMessage).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
    await expect(loginPage.emailInput).toBeEditable();
    await expect(loginPage.signInButton).toBeEnabled();
  });

  test(`TC_LOGIN_19 - Login with valid email and wrong password "WrongPass#123"`, async ({ page, loginPage }) => {
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

  test(`TC_LOGIN_20 - Login with unknown email and a password of only spaces`, async ({ page, loginPage }) => {
    expectRejected(await loginPage.loginAndGetResponse(unknownUser.email, '        '));
    await expect(page).toHaveURL(/\/login/);
  });

  test(`TC_LOGIN_22 - Login with unknown email and SQL injection text "' OR '1'='1' --" as the password`, async ({ page, loginPage }) => {
    expectRejected(await loginPage.loginAndGetResponse(unknownUser.email, sqlInjection));
    await expect(page).toHaveURL(/\/login/);
  });

  test(`TC_LOGIN_24 - Login with unknown email and script text "<script>alert(1)</script>" as the password`, async ({ page, loginPage }) => {
    let dialogSeen = false;
    page.on('dialog', async (d) => { dialogSeen = true; await d.dismiss(); });
    expectRejected(await loginPage.loginAndGetResponse(unknownUser.email, xssPayload));
    expect(dialogSeen).toBe(false);
    await expect(page).toHaveURL(/\/login/);
  });

  test(`TC_LOGIN_25 - Login with unknown email and a password of 1000 letters`, async ({ page, loginPage }) => {
    await loginPage.emailInput.pressSequentially(unknownUser.email, { delay: 10 });
    await loginPage.passwordInput.fill('A'.repeat(1000)); // lambi value type karne mein bohot der lagti hai
    await loginPage.signInButton.click();
    await expect(page).toHaveURL(/\/login/);
    await expect(loginPage.heading).toBeVisible();
  });

  test(`TC_LOGIN_27 - Login with unknown email and a password with emoji and Urdu/Chinese letters`, async ({ page, loginPage }) => {
    expectRejected(await loginPage.loginAndGetResponse(unknownUser.email, 'پاسورڈ😀密码'));
    await expect(page).toHaveURL(/\/login/);
  });
});

// ───────────── Negative: abnormal input jo client-side hi block hota hai (server tak nahi jata) ─────────────
test.describe('Login - abnormal input (client-side blocked)', () => {
  test(`TC_LOGIN_23 - Click Sign in with SQL injection text "' OR '1'='1' --" as the email and password "Secret123"`, async ({ loginPage }) => {
    await loginPage.login(sqlInjection, 'Secret123');
    await loginPage.expectNoLoginRequest();
  });

  test(`TC_LOGIN_26 - Click Sign in with an email of 300 letters before @theitzon.com and password "Secret123"`, async ({ page, loginPage }) => {
    await loginPage.emailInput.pressSequentially(`${'a'.repeat(300)}@theitzon.com`, { delay: 0 });
    await loginPage.passwordInput.pressSequentially('Secret123', { delay: 10 });
    await loginPage.signInButton.click();
    await expect(page).toHaveURL(/\/login/);
    await expect(loginPage.heading).toBeVisible();
  });
});

// ───────────── Access control ─────────────
test.describe('Login - access control', () => {
  test(`TC_LOGIN_28 - Open the workspace page without login and check the login page opens`, async ({ page, workspacePage }) => {
    await workspacePage.open();
    await expect(page).toHaveURL(/\/login/);
  });

  test(`TC_LOGIN_29 - Open /my-work without login and check the login page opens`, async ({ page, myWorkPage }) => {
    await page.goto('/my-work');
    await expect(page).toHaveURL(/\/login/);
    void myWorkPage;
  });

  test(`TC_LOGIN_30 - Open /projects without login and check the login page opens`, async ({ page }) => {
    await page.goto('/projects');
    await expect(page).toHaveURL(/\/login/);
  });
});
