import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// WXT ships a Vitest plugin that boots a fake browser, auto-imports and the whole
// extension environment. We deliberately do not use it: everything under src/core/
// is pure by design, so a test that needs a fake browser is a test telling us the
// logic ended up in the wrong layer. Keeping the test setup dumb keeps that signal.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    include: ["src/**/*.test.ts"],
  },
});
