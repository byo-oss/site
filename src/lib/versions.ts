// Package versions are read at build time, never typed into the site:
// `latest` is what npm serves, `next` is main's package.json when it's ahead of npm.
// The nightly deploy rebuilds, so a publish shows up within a day without a commit here.

interface PackageJson {
  version: string;
  peerDependencies?: Record<string, string>;
}

export interface Versions {
  latest?: string;
  next?: string;
  peers: Record<string, string>;
}

async function fetchJson(url: string): Promise<PackageJson | null> {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`${url} answered ${res.status}`);
  return (await res.json()) as PackageJson;
}

function parts(version: string): number[] {
  return version.split("-")[0].split(".").map(Number);
}

export function isNewer(a: string, b: string): boolean {
  const [x, y] = [parts(a), parts(b)];
  for (let i = 0; i < 3; i++) {
    if (x[i] !== y[i]) return x[i] > y[i];
  }
  return false;
}

/** "0.8.0" → "0.8" for compact labels. */
export function minor(version: string): string {
  return parts(version).slice(0, 2).join(".");
}

export async function resolveVersions(pkg: string, repo?: string): Promise<Versions> {
  try {
    const [published, main] = await Promise.all([
      fetchJson(`https://registry.npmjs.org/${pkg}/latest`),
      repo ? fetchJson(`${repo.replace("https://github.com/", "https://raw.githubusercontent.com/")}/main/package.json`) : null,
    ]);
    const latest = published?.version;
    const next = main && latest && isNewer(main.version, latest) ? main.version : undefined;
    return { latest, next, peers: published?.peerDependencies ?? {} };
  } catch (error) {
    // A production build must not ship guessed versions; local dev can carry on offline.
    if (import.meta.env.PROD) throw new Error(`Could not resolve versions for ${pkg}: ${error}`);
    console.warn(`[versions] ${pkg}: ${error}. Showing no version.`);
    return { peers: {} };
  }
}
