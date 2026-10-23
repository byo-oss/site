import { createHighlighter } from "@tanstack/highlight/core";
import { css } from "@tanstack/highlight/languages/css";
import { diff } from "@tanstack/highlight/languages/diff";
import { html } from "@tanstack/highlight/languages/html";
import { js } from "@tanstack/highlight/languages/js";
import { json } from "@tanstack/highlight/languages/json";
import { jsx } from "@tanstack/highlight/languages/jsx";
import { markdown } from "@tanstack/highlight/languages/markdown";
import { shell } from "@tanstack/highlight/languages/shell";
import { sql } from "@tanstack/highlight/languages/sql";
import { toml } from "@tanstack/highlight/languages/toml";
import { ts } from "@tanstack/highlight/languages/ts";
import { tsx } from "@tanstack/highlight/languages/tsx";
import { yaml } from "@tanstack/highlight/languages/yaml";
import { rehypePreCodeToHast } from "@tanstack/highlight/rehype";

// TanStack Highlight: one shared highlighter for the site's <CodeBlock> and the docs' code fences.
// Languages are imported on purpose. Anything else renders as escaped plain text.
export const highlighter = createHighlighter({
  languages: [ts, tsx, js, jsx, json, css, html, yaml, sql, shell, diff, markdown, toml],
});

const lineCount = (code) => code.replace(/\n$/, "").split("\n").length;

// Shell blocks get a "$ " prompt on every line (global.css: .code-frame.is-shell .th-line::before).
const promptDecorations = (code) => [{ lines: [1, lineCount(code)], className: "is-prompt" }];

const labelFor = (lang, title, isShell) => title ?? (isShell ? "terminal" : lang);

const escapeHtml = (value) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** The framed block as an HTML string, for <CodeBlock>: title tab, copy button, highlighted code. */
export function codeFrameHtml({ code, lang = "ts", title }) {
  const source = code.trim();
  const isShell = highlighter.normalizeLanguage(lang) === "shell";
  const { html: body } = highlighter.highlight(source, {
    lang,
    ...(isShell ? { decorations: promptDecorations(source) } : {}),
  });
  return (
    `<figure class="code-frame${isShell ? " is-shell" : ""}">` +
    `<div class="code-head"><span class="code-title">${escapeHtml(labelFor(lang, title, isShell))}</span>` +
    `<button type="button" class="code-copy" data-copy aria-label="Copy code">copy</button></div>` +
    `${body}</figure>`
  );
}

const el = (tagName, properties, children) => ({ type: "element", tagName, properties, children });
const text = (value) => ({ type: "text", value });

/**
 * Hast plugin for the docs (Astro's Sätteri Markdown processor, see astro.config.mjs): highlights every code
 * fence with TanStack Highlight and wraps it in the same frame as <CodeBlock>.
 * The title comes from the fence meta: ```ts title="lib/auth.ts"
 */
export const byoCodePlugin = {
  name: "byo-code",
  element: {
    filter: ["pre"],
    visit(pre, ctx) {
      const code = pre.children?.find((node) => node.type === "element" && node.tagName === "code");
      if (!code) return undefined;
      // a block this plugin already produced
      if ([pre.properties?.className ?? []].flat().map(String).includes("th-code")) return undefined;
      const classes = [code.properties?.className ?? []].flat().map(String);
      const lang = code.data?.lang ?? classes.find((name) => name.startsWith("language-"))?.slice("language-".length) ?? "";
      const title = /title="([^"]+)"/.exec(code.data?.meta ?? "")?.[1];
      const source = ctx.textContent(code).replace(/\n$/, "");
      const isShell = highlighter.normalizeLanguage(lang) === "shell";
      const highlighted = rehypePreCodeToHast(pre, {
        highlighter,
        ...(isShell ? { getDecorations: () => promptDecorations(source) } : {}),
      });
      if (!highlighted) return undefined;
      const head = el("div", { className: ["code-head"] }, [
        el("span", { className: ["code-title"] }, [text(labelFor(lang, title, isShell))]),
        el("button", { type: "button", className: ["code-copy"], dataCopy: "", ariaLabel: "Copy code" }, [text("copy")]),
      ]);
      return el("figure", { className: ["code-frame", ...(isShell ? ["is-shell"] : [])] }, [head, highlighted]);
    },
  },
};
