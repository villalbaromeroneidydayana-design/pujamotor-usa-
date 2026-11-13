import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    fileParallelism: false,
    include: ["tests/**/*.test.ts"],
    env: {
      DATABASE_URL: "file:./test_autos_usa.db",
      AUTH_SECRET: "11223344556677889900aabbccddeeff11223344556677889900aabbccddeeff",
      ENCRYPTION_KEY_PII: "ffeeddccbbaa00998877665544332211ffeeddccbbaa00998877665544332211",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
