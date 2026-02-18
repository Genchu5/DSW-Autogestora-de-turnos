import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    extensions: [".ts", ".js"],
    alias: {
      // Redirige imports con .js a .ts para que Vitest los resuelva
    },
  },
});
