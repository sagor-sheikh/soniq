import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests",
  timeout: 60000,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3017",
    // reducedMotion: the page's scroll reveals start at opacity 0 under
    // html[data-motion="on"], so a harness that does not ask for reduced
    // motion screenshots a half-faded page and axe scores contrast against
    // it. MotionRoot honours the preference by never hiding anything, which
    // makes every measurement deterministic instead of racing an observer.
    reducedMotion: "reduce",
  },
  webServer: {
    command: "npm run start",
    url: "http://localhost:3017",
    // MUST be false -- otherwise the suite can bind to a stale server and
    // report a false pass against code that was never built.
    reuseExistingServer: false,
    timeout: 120000,
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
});
