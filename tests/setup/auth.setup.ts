// Setup: ek baar login karke session (.auth/user.json) save karta hai. Baqi tests isay reuse karte hain.
// Login API se hota hai (UI se tez aur stable). UI login ka asli coverage tests/auth/login.spec.ts mein hai.
import { test as setup, expect } from '@playwright/test';
import { AuthApi } from '../../api/AuthApi';
import { ENV } from '../../config/env';

export const authFile = '.auth/user.json';

setup('login (API) and save session', async ({ request }) => {
  setup.skip(!ENV.hasCredentials, 'Set ITZ_EMAIL / ITZ_PASSWORD in .env');
  const response = await new AuthApi(request).login(ENV.email, ENV.password);
  expect(response.status(), 'login API status').toBe(200);
  await request.storageState({ path: authFile });
});
