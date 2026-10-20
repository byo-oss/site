import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { docsGroups } from "./data/docs";

// One folder per product: src/content/docs/<product>/<slug>.mdx → /docs/<product>/<slug>
const docs = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/docs" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    group: z.enum(docsGroups),
    order: z.number(),
  }),
});

export const collections = { docs };
