import type { APIRoute } from "astro";
import { getReleases } from "../lib/changelog";

const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const GET: APIRoute = async ({ site }) => {
  const origin = (site ?? new URL("https://byo.dev")).origin;
  const releases = await getReleases();
  const items = releases
    .map(
      (r) => `    <item>
      <title>${escape(`${r.pkg} ${r.version}`)}</title>
      <link>${escape(r.url)}</link>
      <guid isPermaLink="true">${escape(r.url)}</guid>
      <pubDate>${r.date.toUTCString()}</pubDate>
      <description>${escape(r.text || "Full notes on GitHub.")}</description>
    </item>`,
    )
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>BYO changelog</title>
    <link>${origin}/changelog</link>
    <atom:link href="${origin}/changelog.xml" rel="self" type="application/rss+xml" />
    <description>Every release of every BYO package, newest first.</description>
    <language>en</language>
    <lastBuildDate>${releases[0].date.toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { "content-type": "application/rss+xml; charset=utf-8" } });
};
