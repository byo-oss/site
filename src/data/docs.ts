// Kept apart from site.ts so the content config and scripts/fetch-docs.ts can import it
// without fetching package versions.
export const docsGroups = ["get started", "guides", "reference", "operations"] as const;
export type DocsGroup = (typeof docsGroups)[number];

/** Each product's docs live in its own repo under `docs/`, read from `main` at build. */
export const docsSources = [
  { product: "notifications", repo: "byo-oss/notifications" },
  { product: "mailer", repo: "byo-oss/mailer" },
  { product: "support", repo: "byo-oss/support" },
  { product: "entitlements", repo: "byo-oss/entitlements" },
] as const;

export function docsEditUrl(product: string, slug: string): string | undefined {
  const source = docsSources.find((s) => s.product === product);
  return source && `https://github.com/${source.repo}/edit/main/docs/${slug}.mdx`;
}
