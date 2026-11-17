// Workspace page ka Page Object (projects ki list, status tabs, views, search, sidebar).
import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { ENV } from '../config/env';

export class WorkspacePage extends BasePage {
  readonly workspaceName: Locator;
  readonly syncButton: Locator;
  readonly searchBox: Locator;
  readonly tableViewButton: Locator;
  readonly cardsViewButton: Locator;
  readonly yourWorkLink: Locator;
  readonly signOutButton: Locator;
  readonly statusTabs: Locator;

  constructor(page: Page) {
    super(page);
    this.workspaceName = page.getByText('THE IT ZON Developers Workspace').first();
    this.syncButton = page.getByRole('button', { name: 'Sync with ClickUp' }); // sirf visible check, kabhi click nahi
    this.searchBox = page.getByPlaceholder('Search projects and tickets');
    this.tableViewButton = page.getByRole('button', { name: 'Table', exact: true });
    this.cardsViewButton = page.getByRole('button', { name: 'Cards', exact: true }).last();
    this.yourWorkLink = page.getByRole('link', { name: 'Your work' });
    this.signOutButton = page.getByRole('button', { name: 'Sign out' });
    // Status tabs ke button text "Name <count>" format mein hote hain
    this.statusTabs = page.getByRole('button', {
      name: /^(All|Upcoming Projects|In Progress|QA Testing|In QA|QA Pause|QA Restart|Iteration Complete|Internal Testing|Production|Paused|Halted|Cancelled)\s*\d+$/,
    });
  }

  async open(): Promise<void> {
    await this.goto(`/workspaces/${ENV.workspaceId}`);
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(`/workspaces/${ENV.workspaceId}`));
    await expect(this.workspaceName).toBeVisible();
  }

  statusTab(name: string): Locator {
    return this.page.getByRole('button', { name: new RegExp(`^${name}\\s*\\d+$`) });
  }

  // Tab ke button text se count nikalta hai (e.g. "Production 116" -> 116)
  async statusCount(name: string): Promise<number> {
    const text = (await this.statusTab(name).first().innerText()).replace(/\s+/g, ' ');
    return Number(text.match(/(\d+)\s*$/)?.[1]);
  }

  // Sidebar mein app ka link (name se)
  sidebarApp(name: string): Locator {
    return this.page.getByRole('link', { name: new RegExp(name) }).first();
  }

  async openApp(name: string): Promise<void> {
    await this.sidebarApp(name).click();
    await expect(this.page).toHaveURL(/\/projects\/[0-9a-f-]+/);
  }
}
