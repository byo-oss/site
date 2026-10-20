// Kept apart from site.ts so the content config can import it without fetching package versions.
export const docsGroups = ["get started", "guides", "reference", "operations"] as const;
export type DocsGroup = (typeof docsGroups)[number];
