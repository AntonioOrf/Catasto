import { defineConfig } from "vitest/config";

// I test di integrazione richiedono MySQL: girano solo con `npm run test:integration`.
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
  },
});
