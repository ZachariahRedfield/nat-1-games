import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  resolve: {
    alias: {
      zod: resolve(__dirname, "src/core/io/miniZod.ts"),
    },
  },
});
