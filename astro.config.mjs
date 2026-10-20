import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";
import { byoTheme, codeFrame } from "./src/lib/shiki.mjs";

export default defineConfig({
  site: "https://byo.dev",
  // notifications.html is served at /notifications by Cloudflare's auto-trailing-slash handling
  build: { format: "file" },
  trailingSlash: "never",
  integrations: [mdx(), sitemap()],
  markdown: {
    shikiConfig: {
      theme: byoTheme,
      transformers: [codeFrame()],
    },
  },
});
