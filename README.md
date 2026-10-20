# byo.dev

The BYO website: product pages, docs and the conventions summary. Astro + MDX, built to static files and served by Cloudflare Workers static assets.

## Develop

```sh
mise install
pnpm install
pnpm dev          # http://localhost:4321 (search needs a build, see below)
```

```sh
pnpm preview      # build, index search with Pagefind, serve through wrangler like production
pnpm deploy       # build and deploy to Cloudflare by hand (routes byo.dev/*)
```

## Deploys

`.github/workflows/deploy.yml` builds every pull request and deploys every push to `main`, plus a nightly rebuild and a `package-released` repository dispatch. It needs the `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` repo secrets.

Package versions and peer ranges are never typed in: `src/lib/versions.ts` reads npm (latest) and each package's `main` (next) at build time, and the build fails rather than guess. Keeping the rest of the site true to the packages is the `byo-site` agent skill's job.

## Where things live

| Path | What |
|---|---|
| `src/data/site.ts` | Products: name, package, blurbs, what each relies on. Version and status come from npm at build. The header menu, home cards, product pages and docs sidebar read from it |
| `src/content/docs/<product>/<slug>.mdx` | Docs pages, served at `/docs/<product>/<slug>`. Frontmatter: `title`, `description`, `group` (`get started`, `guides`, `reference`, `operations`), `order` |
| `src/components/docs/` | MDX components available without imports: `<Callout kind="note">`, `<Next>` (unreleased-version content), `<Steps>` |
| `src/styles/global.css` | Tokens for both themes, base styles, shared components |
| `src/scripts/ui.ts` | Theme toggle, menus, ⌘K search, copy buttons, install tabs, docs version picker |
| `public/_redirects` | `/docs` and `/docs/<product>` redirects (Cloudflare) |

Code fences take a `title` for the frame tab: ```` ```ts title="lib/auth.ts" ````.

Docs describe the latest npm release. Anything only on the package's `main` goes inside `<Next>`, collapsed until the reader picks the next version. Once npm catches up, `<Next>` content renders as plain text; unwrap it at the next docs pass.

Community project. Not affiliated with the better-auth team.
