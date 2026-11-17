// Sign out flow. Fresh login se chalta hai kyunke sign out server-side session khatam kar sakta hai.
import { test, expect } from '../../fixtures/test-fixtures';
import { ENV } from '../../config/env';

// Sign out server-side session khatam kar sakta hai, isliye alag fresh login se chalta hai.
test.describe('Sign out', () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  test('TC_AUTH_01 - Login with valid email and valid password, click Sign out and check the login page opens', async ({ page, loginPage, workspacePage }) => {
    test.skip(!ENV.hasCredentials, 'Set ITZ_EMAIL / ITZ_PASSWORD in .env');
    await loginPage.open();
    await loginPage.login(ENV.email, ENV.password);
    await expect(page).toHaveURL(/\/workspaces\//);
    await workspacePage.signOutButton.click();
    await expect(page).toHaveURL(/\/login/);
  });
});
