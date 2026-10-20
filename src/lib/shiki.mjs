import { createCssVariablesTheme } from "shiki";

// Monochrome theme; the colors live in global.css as --code-* tokens so they follow light/dark.
export const byoTheme = createCssVariablesTheme({
  name: "byo",
  variablePrefix: "--code-",
  variableDefaults: {},
  fontStyle: true,
});

const SHELL = new Set(["sh", "bash", "shell", "zsh"]);

function el(tagName, properties, children) {
  return { type: "element", tagName, properties, children };
}

function text(value) {
  return { type: "text", value };
}

// Wraps every highlighted block in a frame with a title tab and a copy button.
// The title comes from the fence meta: ```ts title="lib/auth.ts"
export function codeFrame() {
  return {
    name: "byo-code-frame",
    root(root) {
      const pre = root.children.find((node) => node.type === "element" && node.tagName === "pre");
      if (!pre) return;
      const meta = this.options.meta?.__raw ?? "";
      const title = /title="([^"]+)"/.exec(meta)?.[1];
      const lang = this.options.lang ?? "";
      const shell = SHELL.has(lang);
      const label = title ?? (shell ? "terminal" : lang);
      const head = el("div", { className: ["code-head"] }, [
        el("span", { className: ["code-title"] }, [text(label)]),
        el("button", { type: "button", className: ["code-copy"], dataCopy: "", ariaLabel: "Copy code" }, [text("copy")]),
      ]);
      const frame = el("figure", { className: ["code-frame", ...(shell ? ["is-shell"] : [])] }, [head, pre]);
      return { type: "root", children: [frame] };
    },
  };
}
