// Every GitHub release of every BYO package, read at build time from the GitHub Releases API.
// The repos come from `products` in src/data/site.ts, so a new package shows up on its own.
// Like versions.ts, a production build fails rather than render an empty changelog.
import { createSatteriMarkdownProcessor } from "@astrojs/markdown-satteri";
import { products } from "../data/site";

export interface ReleaseEntry {
  slug: string;
  pkg: string;
  version: string;
  date: Date;
  url: string;
  /** Sanitized HTML for the release's first block of content, empty when there is none. */
  html: string;
  /** The same block as plain text, for the RSS description. */
  text: string;
}

interface GithubRelease {
  tag_name: string;
  html_url: string;
  body: string | null;
  draft: boolean;
  prerelease: boolean;
  published_at: string | null;
}

function ownerRepo(repo: string): string {
  return new URL(repo).pathname.replace(/^\/|\/$/g, "");
}

async function fetchReleases(repo: string): Promise<GithubRelease[]> {
  const url = `https://api.github.com/repos/${ownerRepo(repo)}/releases?per_page=100`;
  const headers: Record<string, string> = { accept: "application/vnd.github+json", "user-agent": "byo.dev build" };
  if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`${url} answered ${res.status}`);
  return (await res.json()) as GithubRelease[];
}

/**
 * The first block of a release body: drop "## What's Changed" and everything after it, and any
 * "**Full Changelog**" line; skip headings (so "## Upgrading to 0.14.0" yields the paragraph under it);
 * then take the first paragraph, list or code fence.
 */
export function firstBlock(body: string): string {
  const lines = body.replace(/\r\n?/g, "\n").split("\n");
  const end = lines.findIndex((l) => /^#{1,6}\s+what['’]s changed\b/i.test(l.trim()));
  const kept = (end === -1 ? lines : lines.slice(0, end)).filter((l) => !/^\W*full changelog\b/i.test(l.trim()));

  let i = 0;
  while (i < kept.length && (kept[i].trim() === "" || /^#{1,6}\s/.test(kept[i]))) i++;
  const block: string[] = [];
  const fence = kept[i]?.match(/^\s*(```+|~~~+)/);
  for (; i < kept.length; i++) {
    block.push(kept[i]);
    if (fence && block.length > 1 && kept[i].trim().startsWith(fence[1])) break;
    if (!fence && kept[i + 1] !== undefined && kept[i + 1].trim() === "") break;
  }
  return block.join("\n").trim();
}

const ALLOWED_TAGS = new Set(["p", "a", "code", "pre", "strong", "em", "del", "ul", "ol", "li", "br", "span"]);

/** Allowlist pass over rendered HTML: unknown tags are dropped, attributes other than a safe href are removed. */
function sanitize(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(\/?)([a-zA-Z][a-zA-Z0-9-]*)([^>]*)>/g, (_m, close: string, name: string, attrs: string) => {
      const tag = name.toLowerCase();
      if (!ALLOWED_TAGS.has(tag)) return "";
      if (close) return `</${tag}>`;
      if (tag === "a") {
        const href = attrs.match(/\bhref="([^"]*)"/i)?.[1] ?? "";
        const safe = /^(https?:\/\/|mailto:)/i.test(href.replace(/&#x?[0-9a-f]+;/gi, "").trim());
        return safe ? `<a href="${href}" rel="noopener">` : "<a>";
      }
      return `<${tag}>`;
    });
}

let processor: Awaited<ReturnType<typeof createSatteriMarkdownProcessor>> | undefined;

async function render(markdown: string): Promise<string> {
  if (!markdown) return "";
  processor ??= await createSatteriMarkdownProcessor({ syntaxHighlight: false });
  // No raw HTML from release bodies reaches the page: escape "<" outside code (code is escaped by the renderer).
  const neutral = markdown
    .split(/(```[\s\S]*?```|~~~[\s\S]*?~~~|`[^`\n]*`)/)
    .map((part, i) =>
      i % 2 === 1
        ? part
        : part
            .replace(/<((?:https?:\/\/|mailto:)[^\s<>]+)>/g, "$1") // <https://…> autolinks become plain URLs
            .replace(/</g, "&lt;"),
    )
    .join("");
  const { code } = await processor.render(neutral);
  return sanitize(code).trim();
}

function toText(html: string): string {
  return html
    .replace(/<\/(p|li|pre)>/g, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

// Packages that shipped under another npm name before joining BYO. The last version under the old
// name is on npm: `npm view better-inbox version` is 0.6.0, and @byo-oss/notifications starts at 0.7.0.
const FORMER_NAMES: Record<string, { pkg: string; lastVersion: [number, number, number] }> = {
  notifications: { pkg: "better-inbox", lastVersion: [0, 6, 0] },
};

function shippedAs(slug: string, version: string): string | undefined {
  const former = FORMER_NAMES[slug];
  if (!former) return undefined;
  const v = version.split(".").map((n) => Number.parseInt(n, 10));
  for (let i = 0; i < 3; i++) {
    if ((v[i] ?? 0) !== former.lastVersion[i]) return (v[i] ?? 0) < former.lastVersion[i] ? former.pkg : undefined;
  }
  return former.pkg;
}

// The page and the RSS feed both call getReleases: fetch once per build.
let cached: Promise<ReleaseEntry[]> | undefined;

export function getReleases(): Promise<ReleaseEntry[]> {
  cached ??= loadReleases();
  return cached;
}

async function loadReleases(): Promise<ReleaseEntry[]> {
  const withRepo = products.filter((p) => p.repo);
  try {
    const perProduct = await Promise.all(
      withRepo.map(async (p) => {
        const releases = (await fetchReleases(p.repo!)).filter(
          (r) => !r.draft && !r.prerelease && r.published_at && !r.tag_name.includes("0.0.0"),
        );
        return Promise.all(
          releases.map(async (r): Promise<ReleaseEntry> => {
            const html = await render(firstBlock(r.body ?? ""));
            const version = r.tag_name.replace(/^v/, "");
            return {
              slug: p.slug,
              pkg: shippedAs(p.slug, version) ?? p.pkg,
              version,
              date: new Date(r.published_at!),
              url: r.html_url,
              html,
              text: toText(html),
            };
          }),
        );
      }),
    );
    const all = perProduct.flat().sort((a, b) => b.date.getTime() - a.date.getTime());
    if (all.length === 0) throw new Error("GitHub answered but returned no releases");
    return all;
  } catch (error) {
    throw new Error(`Could not read releases from GitHub: ${error}`);
  }
}
