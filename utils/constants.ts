// Shared constants: tests mein bar bar likhi jane wali cheezein ek jagah.

// "Logged out" browser (koi cookie ya storage nahi). Login page ke tests ke liye: test.use({ storageState: LOGGED_OUT })
export const LOGGED_OUT = { cookies: [], origins: [] };

// URL patterns jinhe toHaveURL() mein use karte hain
export const ROUTE = {
  login: /\/login/,
  workspaces: /\/workspaces\//,
  myWork: /\/my-work/,
};
