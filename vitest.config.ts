import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
export default defineConfig({
  test: {
    include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts"],
    env: loadEnv("test", process.cwd(), ""),
    testTimeout: 15000,
    fileParallelism: false,
  },
});
