// Page Object Model (POM): Login page ke saare elements (locators) aur actions yahan.
// Agar UI badle to sirf ye file update hogi, tests nahi.
import { Locator, Page, Response, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  readonly heading: Locator;
  readonly subtitle: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly togglePasswordButton: Locator;
  readonly hidePasswordButton: Locator;
  readonly signInButton: Locator;
  readonly forgotText: Locator;
  readonly errorMessage: Locator;
  readonly themeLight: Locator;
  readonly themeDark: Locator;
  readonly themeSystem: Locator;

  // Login API ko jitni baar call kiya gaya (client-side validation block kare to 0 rehta hai)
  readonly loginRequests: string[] = [];

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Welcome back' });
    this.subtitle = page.getByText('Sign in to your board.');
    this.emailInput = page.getByPlaceholder('you@theitzon.com');
    this.passwordInput = page.getByPlaceholder('••••••••');
    this.togglePasswordButton = page.getByRole('button', { name: 'Show password' });
    this.hidePasswordButton = page.getByRole('button', { name: 'Hide password' });
    this.signInButton = page.getByRole('button', { name: /Sign in/ });
    this.forgotText = page.getByText('Forgot? Ask the TPM');
    this.errorMessage = page.getByText('Incorrect email or password');
    this.themeLight = page.getByRole('button', { name: 'Light' });
    this.themeDark = page.getByRole('button', { name: 'Dark' });
    this.themeSystem = page.getByRole('button', { name: 'System' });

    page.on('request', (req) => {
      if (req.method() === 'POST' && req.url().includes('/api/auth/login')) this.loginRequests.push(req.url());
    });
  }

  // Login page kholo aur confirm karo ke load ho gaya
  async open(): Promise<void> {
    await this.goto('/login');
    await expect(this.heading).toBeVisible();
  }

  // Sirf fields bharo (submit nahi).
  // NOTE: fill() is app mein email validation ko galat trigger karta hai (login nahi hota),
  // isliye asli typing (pressSequentially) use hoti hai. Dekho GUIDELINES.md.
  async fillForm(email: string, password: string, delay = 10): Promise<void> {
    if (email) await this.emailInput.pressSequentially(email, { delay });
    if (password) await this.passwordInput.pressSequentially(password, { delay });
  }

  // Email/password bharo aur Sign in dabao
  async login(email: string, password: string, delay = 10): Promise<void> {
    await this.fillForm(email, password, delay);
    await this.signInButton.click();
  }

  // Login karo aur server ka response (status) wapas lo: 200 = success, 401 = galat credentials
  async loginAndGetResponse(email: string, password: string): Promise<Response> {
    await this.fillForm(email, password);
    const [response] = await Promise.all([
      this.page.waitForResponse((r) => r.url().includes('/api/auth/login') && r.request().method() === 'POST'),
      this.signInButton.click(),
    ]);
    return response;
  }

  // Form submit ke baad confirm karo ke koi login request server ko gayi hi nahi (client-side validation)
  async expectNoLoginRequest(): Promise<void> {
    // "Kuch nahi hua" verify karne ke liye thora sa wait zaroori hai
    // eslint-disable-next-line playwright/no-wait-for-timeout -- absence verify karne ka koi event nahi hota
    await this.page.waitForTimeout(700);
    expect(this.loginRequests).toHaveLength(0);
    await expect(this.page).toHaveURL(/\/login/);
  }
}
