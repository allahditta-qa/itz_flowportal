// Fixtures: tests ko ready-made page objects dete hain (har test me new LoginPage(page) nahi likhna).
import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { WorkspacePage } from '../pages/WorkspacePage';
import { ProjectPage } from '../pages/ProjectPage';
import { MyWorkPage } from '../pages/MyWorkPage';
import { ThemeSwitcher } from '../components/ThemeSwitcher';
import { AuthApi } from '../api/AuthApi';

type Fixtures = {
  loginPage: LoginPage;
  workspacePage: WorkspacePage;
  projectPage: ProjectPage;
  myWorkPage: MyWorkPage;
  theme: ThemeSwitcher;
  authApi: AuthApi;
};

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  workspacePage: async ({ page }, use) => use(new WorkspacePage(page)),
  projectPage: async ({ page }, use) => use(new ProjectPage(page)),
  myWorkPage: async ({ page }, use) => use(new MyWorkPage(page)),
  theme: async ({ page }, use) => use(new ThemeSwitcher(page)),
  authApi: async ({ request }, use) => use(new AuthApi(request)),
});

export { expect } from '@playwright/test';
