// Site-wide behaviour: theme, menus, install tabs, copy buttons, docs version and ⌘K search.

const root = document.documentElement;

function store(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Private mode or blocked storage: the choice just won't persist.
  }
}

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/* ---------- theme ---------- */

function effectiveTheme(): "light" | "dark" {
  const set = root.dataset.theme;
  if (set === "light" || set === "dark") return set;
  return matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

for (const button of document.querySelectorAll<HTMLButtonElement>("[data-theme-toggle]")) {
  button.addEventListener("click", () => {
    const next = effectiveTheme() === "light" ? "dark" : "light";
    root.dataset.theme = next;
    store("byo-theme", next);
  });
}

/* ---------- popovers (products menu, docs product switcher) ---------- */

const popoverButtons = [...document.querySelectorAll<HTMLButtonElement>("[data-popover]")];

function setPopover(button: HTMLButtonElement, open: boolean) {
  const panel = document.getElementById(button.getAttribute("aria-controls") ?? "");
  if (!panel) return;
  button.setAttribute("aria-expanded", String(open));
  panel.hidden = !open;
}

function closePopovers(except?: HTMLButtonElement) {
  for (const button of popoverButtons) {
    if (button !== except && button.getAttribute("aria-expanded") === "true") setPopover(button, false);
  }
}

for (const button of popoverButtons) {
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    const open = button.getAttribute("aria-expanded") !== "true";
    closePopovers(button);
    setPopover(button, open);
  });
}

document.addEventListener("click", (event) => {
  const target = event.target as Element;
  if (!target.closest(".popover")) closePopovers();
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  const open = popoverButtons.find((b) => b.getAttribute("aria-expanded") === "true");
  if (open) {
    setPopover(open, false);
    open.focus();
  }
});

/* ---------- docs sidebar on small screens ---------- */

for (const button of document.querySelectorAll<HTMLButtonElement>("[data-docs-menu]")) {
  button.addEventListener("click", () => {
    const tree = document.getElementById(button.getAttribute("aria-controls") ?? "");
    if (!tree) return;
    const open = button.getAttribute("aria-expanded") !== "true";
    button.setAttribute("aria-expanded", String(open));
    tree.classList.toggle("is-open", open);
    const label = button.querySelector("[data-docs-menu-label]");
    if (label) label.textContent = open ? "✕ close menu" : "☰ menu";
  });
}

/* ---------- docs version ---------- */

function setVersion(version: string) {
  root.dataset.version = version === "next" ? "next" : "latest";
  store("byo-docs-version", root.dataset.version);
  for (const b of document.querySelectorAll<HTMLButtonElement>("[data-version-pick]")) {
    b.setAttribute("aria-pressed", String(b.dataset.versionPick === root.dataset.version));
  }
}

for (const button of document.querySelectorAll<HTMLButtonElement>("[data-version-pick], [data-set-version]")) {
  button.addEventListener("click", () => setVersion(button.dataset.versionPick ?? button.dataset.setVersion ?? "latest"));
}
setVersion(root.dataset.version ?? "latest");

/* ---------- install tabs ---------- */

function setManager(pm: string) {
  for (const install of document.querySelectorAll<HTMLElement>("[data-install]")) {
    const tab = install.querySelector<HTMLButtonElement>(`[data-pm="${pm}"]`);
    if (!tab) continue;
    for (const t of install.querySelectorAll<HTMLButtonElement>("[data-pm]")) {
      t.setAttribute("aria-selected", String(t === tab));
    }
    const cmd = `${tab.dataset.cmd} ${install.dataset.pkg}`;
    const code = install.querySelector("[data-install-cmd]");
    if (code) code.textContent = cmd;
    install.querySelector<HTMLElement>("[data-copy-text]")?.setAttribute("data-copy-text", cmd);
  }
}

for (const tab of document.querySelectorAll<HTMLButtonElement>("[data-install] [data-pm]")) {
  tab.addEventListener("click", () => {
    const pm = tab.dataset.pm ?? "npm";
    setManager(pm);
    store("byo-pm", pm);
  });
}
setManager(read("byo-pm") ?? "npm");

/* ---------- copy buttons ---------- */

document.addEventListener("click", async (event) => {
  const button = (event.target as Element).closest<HTMLButtonElement>("[data-copy], [data-copy-text]");
  if (!button) return;
  const text = button.dataset.copyText ?? button.closest("figure")?.querySelector("pre")?.textContent ?? "";
  try {
    await navigator.clipboard.writeText(text.trimEnd());
    button.textContent = "copied";
  } catch {
    button.textContent = "press ⌘C";
  }
  setTimeout(() => (button.textContent = "copy"), 1600);
});

/* ---------- search ---------- */

type PagefindResult = { data: () => Promise<{ url: string; excerpt: string; meta: Record<string, string> }> };
type Pagefind = { debouncedSearch: (q: string) => Promise<{ results: PagefindResult[] } | null> };

const dialog = document.getElementById("search") as HTMLDialogElement | null;
const input = document.getElementById("search-input") as HTMLInputElement | null;
const list = document.getElementById("search-results");
const suggestions = list?.innerHTML ?? "";
let pagefind: Promise<Pagefind | null> | undefined;
let active = -1;

// One shared import, so keystrokes typed while the index loads don't race each other.
function loadPagefind(): Promise<Pagefind | null> {
  pagefind ??= (async () => {
    try {
      const url = "/pagefind/pagefind.js";
      const pf = (await import(/* @vite-ignore */ url)) as Pagefind & { init?: () => Promise<void> };
      await pf.init?.();
      return pf;
    } catch {
      return null;
    }
  })();
  return pagefind;
}

function options(): HTMLElement[] {
  return list ? [...list.querySelectorAll<HTMLElement>(".search-result")] : [];
}

function highlight(index: number) {
  const items = options();
  active = items.length ? (index + items.length) % items.length : -1;
  items.forEach((item, i) => item.setAttribute("aria-selected", String(i === active)));
  items[active]?.scrollIntoView({ block: "nearest" });
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

async function runSearch(query: string) {
  if (!list) return;
  if (!query.trim()) {
    list.innerHTML = suggestions;
    active = -1;
    return;
  }
  const pf = await loadPagefind();
  if (!pf) {
    list.innerHTML = `<p class="search-empty">Search runs on the built site. Run <code>pnpm build</code> and <code>pnpm preview</code>.</p>`;
    return;
  }
  const search = await pf.debouncedSearch(query);
  if (!search) return; // superseded by a newer keystroke
  const hits = await Promise.all(search.results.slice(0, 8).map((r) => r.data()));
  if (input && input.value !== query) return;
  if (!hits.length) {
    list.innerHTML = `<p class="search-empty">No results for “${escapeHtml(query)}”.</p>`;
    active = -1;
    return;
  }
  // Pagefind's excerpt is already escaped, with <mark> around matches.
  list.innerHTML = hits
    .map(
      (h) => `<a href="${escapeHtml(h.url)}" class="search-result" role="option" aria-selected="false">
        <span class="search-result-title">${escapeHtml(h.meta.title ?? h.url)}</span>
        <span class="search-result-group">${escapeHtml(h.meta.group ?? "")}</span>
        <span class="search-result-excerpt">${h.excerpt}</span>
      </a>`,
    )
    .join("");
  highlight(0);
}

function openSearch() {
  if (!dialog || dialog.open) return;
  closePopovers();
  dialog.showModal();
  input?.focus();
  input?.select();
  void loadPagefind();
}

for (const button of document.querySelectorAll("[data-search-open]")) {
  button.addEventListener("click", openSearch);
}

document.querySelector("[data-search-close]")?.addEventListener("click", () => dialog?.close());

dialog?.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close(); // click on the backdrop
});

input?.addEventListener("input", () => void runSearch(input.value));

input?.addEventListener("keydown", (event) => {
  if (event.key === "ArrowDown") {
    event.preventDefault();
    highlight(active + 1);
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    highlight(active - 1);
  } else if (event.key === "Enter") {
    const target = options()[active];
    if (target) {
      event.preventDefault();
      target.click();
    }
  }
});

document.addEventListener("keydown", (event) => {
  const typing = (event.target as Element).closest("input, textarea, [contenteditable]");
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    openSearch();
  } else if (event.key === "/" && !typing) {
    event.preventDefault();
    openSearch();
  }
});

/* ---------- docs: highlight the section in view ---------- */

const tocLinks = [...document.querySelectorAll<HTMLAnchorElement>("[data-toc] a")];
if (tocLinks.length) {
  const headings = tocLinks
    .map((a) => document.getElementById(decodeURIComponent(a.hash.slice(1))))
    .filter((h): h is HTMLElement => h !== null);
  const mark = () => {
    let current = headings[0];
    for (const h of headings) {
      if (h.getBoundingClientRect().top < 120) current = h;
    }
    for (const a of tocLinks) a.classList.toggle("is-active", a.hash === `#${current?.id}`);
  };
  addEventListener("scroll", mark, { passive: true });
  mark();
}
