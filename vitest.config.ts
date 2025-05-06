import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    root: __dirname,
    include: [
      "src/test/**/*.tsx",
      "src/**/__tests__/**/*.test.ts",
      "electron/database/__tests__/**/*.test.ts",
    ],
    testTimeout: 1000 * 29,
    environment: "node",
    globals: true,
    // setupFiles: ["./test/setup.ts"],
    // deps: {
    //   // inline: ["electron", "better-sqlite3"],
    // },
    transformMode: {
      web: [/\.[jt]sx?$/],
    },
  },
});
});
