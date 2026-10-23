import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";
import { satteri } from "@astrojs/markdown-satteri";
import { byoCodePlugin } from "./src/lib/highlight.mjs";

export default defineConfig({
  site: "https://byo.dev",
  // notifications.html is served at /notifications by Cloudflare's auto-trailing-slash handling
  build: { format: "file" },
  trailingSlash: "never",
  integrations: [mdx(), sitemap()],
  markdown: {
    // code fences are highlighted by TanStack Highlight (byoCodePlugin), not Shiki. .mdx inherits the processor.
    syntaxHighlight: false,
    processor: satteri({ hastPlugins: [byoCodePlugin] }),
  },
});
