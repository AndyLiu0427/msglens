import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    // jsdom rather than happy-dom: DOMPurify is used with WHOLE_DOCUMENT +
    // RETURN_DOM so `<head><style>` survives, and happy-dom rejects a document
    // with more than one root element. jsdom also does not fetch subresources,
    // which keeps the suite from reaching the network.
    environment: "jsdom",
    // server/ is a separate TypeScript program (Workers globals vs the DOM
    // lib), so its tests live beside it rather than in test/ — importing
    // server code from test/ pulls D1Database and R2Bucket into the app's
    // config, which cannot see them.
    include: ["test/**/*.test.ts", "server/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/lib/email/**"],
      reporter: ["text-summary"],
    },
  },
});
