// Playwright ki main settings file.
import { defineConfig, devices } from '@playwright/test';
import { ENV } from './config/env';

export default defineConfig({
  testDir: './tests', // tests isi folder me dhoondhe jayen
  timeout: 60_000, // ek test max 60 sec (app slow ho sakti hai)
  workers: 2, // zyada parallel logins se server slow ho jata hai
  expect: { timeout: 7_000 }, // assertion max 7 sec wait kare
  fullyParallel: true, // tests saath saath chalen
  retries: 0, // retry nahi: live app par retry flaky/lockout chhupa deta hai, aur run slow hota hai
  reporter: [
    ['list'], // terminal
    ['html', { open: 'never' }], // online report (playwright-report/, server se khulti hai)
    ['./reporters/offline-report.ts', { outputDir: 'reports' }], // har module/sub-module ki alag offline report (reports/<module>/<sub> test report.html) + reports/index.html
  ],
  use: {
    baseURL: ENV.baseURL, // page.goto('/login') = BASE_URL + /login
    trace: 'off', // trace/video band (run tez). Debug ke liye: npx playwright test -g "TC_X" --trace on
    screenshot: 'on', // har test ka screenshot report mein
    video: 'off',
    // SLOWMO=300 set karo to har step 300ms ruk kar chalta hai (headed mein dekhne ke liye)
    launchOptions: { slowMo: Number(process.env.SLOWMO ?? 0) },
  },
  projects: [
    // 1) Login ek baar karke session save karta hai
    { name: 'setup', testMatch: /setup\/auth\.setup\.ts/ },
    // 2) tests/auth/*: bina session ke (login, sign out)
    {
      name: 'auth',
      testMatch: /auth\/.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
        storageState: { cookies: [], origins: [] },
      },
    },
    // 3) Baqi feature folders (workspace, project, my-work ...): saved session ke saath, read-only
    {
      name: 'chromium',
      testMatch: /.*\.spec\.ts/,
      testIgnore: /(auth|setup)\//, // baqi sab modules (naya module add karne par config nahi badalni)
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, storageState: '.auth/user.json' },
    },
  ],
});
