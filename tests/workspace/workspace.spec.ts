// Workspace flow (read-only): header, status tabs, views, search, sidebar, navigation.
import { test, expect } from '../../fixtures/test-fixtures';
import { ROUTE } from '../../utils/constants';
import { allStatuses, stableApp } from '../../test-data/apps';

test.describe('Workspace', () => {
  test.beforeEach(async ({ workspacePage }) => {
    await workspacePage.open();
    await workspacePage.expectLoaded();
  });

  test('TC_WS_01 - workspace header and sync button are visible', async ({ workspacePage }) => {
    await expect(workspacePage.workspaceName).toBeVisible();
    await expect(workspacePage.syncButton).toBeVisible(); // sirf visible check, click nahi
  });

  test('TC_WS_02 - "All" count equals the sum of status counts', async ({ workspacePage }) => {
    await expect(workspacePage.statusTab('All')).toBeVisible();
    // Counts data load hone ke baad aate hain (pehle 0), isliye wait karo
    await expect.poll(() => workspacePage.statusCount('All')).toBeGreaterThan(0);
    const all = await workspacePage.statusCount('All');
    let sum = 0;
    for (const s of allStatuses) sum += await workspacePage.statusCount(s);
    expect(all).toBeGreaterThan(0);
    expect(sum).toBe(all);
  });

  test('TC_WS_03 - status filter can be selected', async ({ page, workspacePage }) => {
    await expect.poll(() => workspacePage.statusCount('Production')).toBeGreaterThan(0);
    await workspacePage.statusTab('Production').click();
    // Filter lagne ke baad us status ke project cards (links /projects/<id>) dikhne chahiye
    await expect(page.locator('main a[href^="/projects/"]').first()).toBeVisible();
  });

  test('TC_WS_04 - table view shows project columns', async ({ page, workspacePage }) => {
    await workspacePage.tableViewButton.click();
    for (const col of ['Project', 'Status', 'Sprint', 'Dev', 'QA', 'Publisher']) {
      await expect(page.getByRole('columnheader', { name: col, exact: true })).toBeVisible();
    }
  });

  test('TC_WS_05 - search finds a project by name', async ({ page, workspacePage }) => {
    await workspacePage.searchBox.fill(stableApp);
    await expect(page.getByText(stableApp).first()).toBeVisible();
  });

  test('TC_WS_06 - sidebar app opens its project page', async ({ workspacePage, projectPage }) => {
    await workspacePage.openApp(stableApp);
    await projectPage.expectOpen();
    await expect(projectPage.title(stableApp)).toBeVisible();
  });

  test('TC_WS_07 - "Your work" opens my-work', async ({ page, workspacePage }) => {
    await workspacePage.yourWorkLink.click();
    await expect(page).toHaveURL(ROUTE.myWork);
  });
});
