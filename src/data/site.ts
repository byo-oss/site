export const GITHUB_ORG = "https://github.com/byo-oss";
export const NPM_ORG = "https://www.npmjs.com/org/byo-oss";
export const SPEC_URL = "https://github.com/byo-oss/conventions/blob/main/SPEC.md";

export type Requirement = "required" | "recommended" | "optional";

export interface Dependency {
  name: string;
  requirement: Requirement;
  kind: string;
  text: string;
}

export interface Product {
  slug: string;
  name: string;
  pkg: string;
  status: "released" | "in development";
  version?: string;
  summary: string;
  menuText: string;
  exitTo: string[];
  dependencies: Dependency[];
  docsHref?: string;
  repo?: string;
}

export const products: Product[] = [
  {
    slug: "notifications",
    name: "Notifications",
    pkg: "@byo-oss/notifications",
    status: "released",
    version: "0.7.0",
    summary: "A bell, an inbox and email follow-up for anything that went unread. Formerly better-inbox.",
    menuText: "In-app notifications: a bell, an inbox and email follow-up.",
    exitTo: ["Knock", "Novu", "Courier"],
    docsHref: "/docs/notifications/quickstart",
    repo: "https://github.com/byo-oss/notifications",
    dependencies: [
      {
        name: "better-auth",
        requirement: "required",
        kind: "peer · ^1.6.23",
        text: "Users, sessions and your database adapter. The notification table migrates with it.",
      },
      {
        name: "organization",
        requirement: "optional",
        kind: "better-auth plugin",
        text: "Notify a whole org by role, keep inboxes per org, and clean up when an org or member is removed.",
      },
      {
        name: "react",
        requirement: "optional",
        kind: "peer · >=18",
        text: "The ./react hooks and <InboxButton />. Skip it for server-only use.",
      },
      {
        name: "@wraps.dev/email",
        requirement: "optional",
        kind: "peer · >=0.15.0",
        text: "The email channel, sent through your own AWS SES account.",
      },
    ],
  },
  {
    slug: "support",
    name: "Support",
    pkg: "@byo-oss/support",
    status: "in development",
    summary:
      "Tickets, contacts and agent replies inside your app. Contacts are your better-auth users, or an email address for people without an account.",
    menuText: "Tickets, contacts and agent replies inside your app.",
    exitTo: ["Zendesk", "Intercom", "Front"],
    dependencies: [
      {
        name: "better-auth",
        requirement: "required",
        kind: "peer",
        text: "Contacts, agents and sessions are your better-auth users.",
      },
      {
        name: "organization",
        requirement: "recommended",
        kind: "better-auth plugin",
        text: "Its access control backs the default agent permission check. Without it, pass your own authorize.",
      },
      {
        name: "@byo-oss/notifications",
        requirement: "optional",
        kind: "BYO package",
        text: "Agent and requester alerts land in the same inbox as everything else.",
      },
      {
        name: "email adapter",
        requirement: "optional",
        kind: "provider · Wraps first-party",
        text: "Customers write in and get replies by email.",
      },
      {
        name: "react",
        requirement: "optional",
        kind: "peer",
        text: "The ./react hooks and components.",
      },
    ],
  },
];

export function reliesOnLine(product: Product): string {
  return product.dependencies
    .filter((d) => d.kind === "better-auth plugin" || d.name === "better-auth")
    .map((d) => (d.requirement === "required" ? d.name : `${d.name} (${d.requirement})`))
    .join(" · ");
}

export function getProduct(slug: string): Product {
  const product = products.find((p) => p.slug === slug);
  if (!product) throw new Error(`Unknown product: ${slug}`);
  return product;
}

export const docsGroups = ["get started", "guides", "reference", "operations"] as const;
export type DocsGroup = (typeof docsGroups)[number];
