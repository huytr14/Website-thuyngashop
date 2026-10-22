import { defineConfig } from "@playwright/test";

process.loadEnvFile?.(".env.local");

export default defineConfig({
  testDir: "./tests/e2e",
  workers: 1,
  use: { baseURL: "http://127.0.0.1:3000", trace: "retain-on-failure" },
  webServer: { command: "npm run start", url: "http://127.0.0.1:3000", reuseExistingServer: false, timeout: 120_000 },
});
