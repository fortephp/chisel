import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/bench/**/*.perf.ts"],
  },
});
