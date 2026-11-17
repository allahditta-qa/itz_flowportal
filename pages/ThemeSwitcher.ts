// Theme buttons (Light / Dark / System). Ye login page par bhi hain aur app ke har page par bhi.
import { Locator, Page, expect } from '@playwright/test';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ThemeLook = 'light' | 'dark';

// Page ka background in dono themes mein (App ke CSS se liya gaya)
export const THEME_BACKGROUND: Record<ThemeLook, string> = {
  light: 'rgb(246, 247, 250)',
  dark: 'rgb(10, 12, 16)',
};

// Browser jis naam se theme save karta hai (localStorage key)
export const THEME_STORAGE_KEY = 'itzflow-theme';

export class ThemeSwitcher {
  readonly buttons: Record<ThemeMode, Locator>;

  constructor(private readonly page: Page) {
    // exact: true zaroori hai, warna app mein "Lighten Image AI Photo" jaisa button bhi "Light" match kar deta hai
    this.buttons = {
      light: page.getByRole('button', { name: 'Light', exact: true }),
      dark: page.getByRole('button', { name: 'Dark', exact: true }),
      system: page.getByRole('button', { name: 'System', exact: true }),
    };
  }

  async select(mode: ThemeMode): Promise<void> {
    await this.buttons[mode].click();
  }

  // Sirf wohi button selected ho jo hum chahte hain (aria-pressed), baqi do nahi
  async expectSelected(mode: ThemeMode): Promise<void> {
    for (const m of Object.keys(this.buttons) as ThemeMode[]) {
      await expect(this.buttons[m]).toHaveAttribute('aria-pressed', m === mode ? 'true' : 'false');
    }
  }

  // Page asal mein light ya dark dikh raha hai (background + color-scheme)
  async expectLook(look: ThemeLook): Promise<void> {
    await expect(this.page.locator('body')).toHaveCSS('background-color', THEME_BACKGROUND[look]);
    await expect(this.page.locator('html')).toHaveCSS('color-scheme', look);
  }

  async storedValue(): Promise<string | null> {
    return this.page.evaluate((key) => localStorage.getItem(key), THEME_STORAGE_KEY);
  }
}
