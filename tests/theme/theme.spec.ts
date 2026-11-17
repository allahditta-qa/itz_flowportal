// Theme module: Light / Dark / System buttons. Test cases ka doc: docs/test-cases/theme.md
import { test, expect } from '../../fixtures/test-fixtures';
import { ENV } from '../../config/env';
import { THEME_BACKGROUND, THEME_STORAGE_KEY } from '../../pages/ThemeSwitcher';
import { validUser } from '../../test-data/users';

const loggedOut = { cookies: [], origins: [] };

// ───────────── A, B, C: login page (bina session) ─────────────
test.describe('Theme - login page', () => {
  test.use({ storageState: loggedOut });

  test.beforeEach(async ({ loginPage }) => {
    await loginPage.open();
  });

  test('TC_THEME_01 - Check the Light, Dark and System buttons are visible on the login page', async ({ theme }) => {
    for (const mode of ['light', 'dark', 'system'] as const) {
      await expect(theme.buttons[mode]).toBeVisible();
    }
  });

  test('TC_THEME_02 - Open the login page for the first time and check Light is selected with a light background', async ({ theme }) => {
    await theme.expectSelected('light');
    await theme.expectLook('light');
  });

  test('TC_THEME_03 - Click Dark on the login page and check the page turns dark', async ({ theme }) => {
    await theme.select('dark');
    await theme.expectSelected('dark');
    await theme.expectLook('dark');
  });

  test('TC_THEME_04 - Click Dark, then click Light and check the page turns light again', async ({ theme }) => {
    await theme.select('dark');
    await theme.select('light');
    await theme.expectSelected('light');
    await theme.expectLook('light');
  });

  test('TC_THEME_05 - Click System while the computer theme is light and check the page is light', async ({ page, theme }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await theme.select('system');
    await theme.expectSelected('system');
    await theme.expectLook('light');
  });

  test('TC_THEME_06 - Click System while the computer theme is dark and check the page is dark', async ({ page, theme }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await theme.select('system');
    await theme.expectSelected('system');
    await theme.expectLook('dark');
  });

  test('TC_THEME_07 - Select System, then change the computer theme from light to dark and check the page turns dark without reload', async ({ page, theme }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await theme.select('system');
    await theme.expectLook('light');
    await page.emulateMedia({ colorScheme: 'dark' });
    await theme.expectLook('dark');
    await theme.expectSelected('system');
  });

  test('TC_THEME_08 - Click Dark, reload the page and check the page is still dark with Dark selected', async ({ page, theme }) => {
    await theme.select('dark');
    await page.reload();
    await theme.expectSelected('dark');
    await theme.expectLook('dark');
  });

  test('TC_THEME_09 - Click Dark and check the browser saves the choice as "dark"', async ({ theme }) => {
    await theme.select('dark');
    await expect.poll(() => theme.storedValue()).toBe('dark');
  });

  test('TC_THEME_10 - Click System, reload the page and check System is still selected', async ({ page, theme }) => {
    await theme.select('system');
    await page.reload();
    await theme.expectSelected('system');
  });

  test('TC_THEME_11 - Click Dark on the login page, then login with valid email and valid password and check the workspace page is dark', async ({ page, loginPage, theme }) => {
    test.skip(!ENV.hasCredentials, 'Set ITZ_EMAIL / ITZ_PASSWORD in .env');
    await theme.select('dark');
    await loginPage.login(validUser.email, validUser.password);
    await expect(page).toHaveURL(/\/workspaces\//);
    await theme.expectSelected('dark');
    await theme.expectLook('dark');
  });
});

// ───────────── D: app ke andar (saved session ke saath) ─────────────
test.describe('Theme - inside the app', () => {
  test.beforeEach(async ({ workspacePage }) => {
    await workspacePage.open();
    await workspacePage.expectLoaded();
  });

  test('TC_THEME_12 - Check the Light, Dark and System buttons are visible on the workspace page', async ({ theme }) => {
    for (const mode of ['light', 'dark', 'system'] as const) {
      await expect(theme.buttons[mode]).toBeVisible();
    }
  });

  test('TC_THEME_13 - Click Dark on the workspace page and check the page turns dark', async ({ theme }) => {
    await theme.select('dark');
    await theme.expectSelected('dark');
    await theme.expectLook('dark');
  });

  test('TC_THEME_14 - Click Dark on the workspace page, open /my-work and check it is still dark', async ({ workspacePage, theme }) => {
    await theme.select('dark');
    await workspacePage.yourWorkLink.click();
    await theme.expectSelected('dark');
    await theme.expectLook('dark');
  });

  test('TC_THEME_15 - Click Dark, Light and System one by one on the workspace page and check only one button is selected each time', async ({ theme }) => {
    for (const mode of ['dark', 'light', 'system'] as const) {
      await theme.select(mode);
      await theme.expectSelected(mode);
    }
  });
});

// ───────────── E: ajeeb saved value ─────────────
test.describe('Theme - unusual saved value', () => {
  test.use({ storageState: loggedOut });

  test('TC_THEME_16 - Save the unknown theme value "blue" in the browser, open the login page and check the page still loads with a valid theme', async ({ page, loginPage }) => {
    await page.addInitScript((key) => localStorage.setItem(key, 'blue'), THEME_STORAGE_KEY);
    await loginPage.open();
    const bg = await page.locator('body').evaluate((el) => getComputedStyle(el).backgroundColor);
    expect([THEME_BACKGROUND.light, THEME_BACKGROUND.dark]).toContain(bg);
  });
});
