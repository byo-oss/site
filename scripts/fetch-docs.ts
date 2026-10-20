// Copies each product's docs/ folder into src/content/docs/<product>/ before Astro runs.
//
//   node scripts/fetch-docs.ts                 → main of each package repo on GitHub
//   BYO_DOCS_REF=my-branch node …              → that branch or tag instead of main
//   BYO_DOCS_NOTIFICATIONS=~/Projects/byo-notifications node …
//                                              → a local clone (to preview unpushed docs)
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { docsSources } from "../src/data/docs.ts";

const root = resolve(import.meta.dirname, "..");
const ref = process.env.BYO_DOCS_REF ?? "main";

function expandHome(path: string): string {
  return path.startsWith("~/") ? join(process.env.HOME ?? "", path.slice(2)) : path;
}

async function download(repo: string, into: string): Promise<string> {
  const url = `https://codeload.github.com/${repo}/tar.gz/${ref}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} answered ${res.status}`);
  const tarball = join(into, "repo.tar.gz");
  writeFileSync(tarball, Buffer.from(await res.arrayBuffer()));
  const out = join(into, "repo");
  mkdirSync(out);
  // GitHub tarballs wrap everything in one top-level folder; drop it.
  const tar = spawnSync("tar", ["-xzf", tarball, "-C", out, "--strip-components=1", "--wildcards", "*/docs/*"]);
  if (tar.status !== 0) throw new Error(`${repo}@${ref} has no docs/ folder (${tar.stderr.toString().trim()})`);
  return join(out, "docs");
}

for (const { product, repo } of docsSources) {
  const local = process.env[`BYO_DOCS_${product.toUpperCase()}`];
  const dest = join(root, "src/content/docs", product);
  const scratch = mkdtempSync(join(tmpdir(), "byo-docs-"));
  try {
    const from = local ? join(expandHome(local), "docs") : await download(repo, scratch);
    if (!existsSync(from)) throw new Error(`${from} does not exist`);
    rmSync(dest, { recursive: true, force: true });
    mkdirSync(dest, { recursive: true });
    for (const file of readdirSync(from).filter((f) => f.endsWith(".mdx"))) {
      cpSync(join(from, file), join(dest, file));
    }
    const count = readdirSync(dest).length;
    if (count === 0) throw new Error(`no .mdx files in ${local ? from : `${repo}@${ref}`}/docs`);
    console.log(`[docs] ${product}: ${count} pages from ${local ? from : `${repo}@${ref}`}`);
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
}
