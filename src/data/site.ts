import { resolveVersions } from "../lib/versions";

export const GITHUB_ORG = "https://github.com/byo-oss";
export const NPM_ORG = "https://www.npmjs.com/org/byo-oss";
export const SPEC_URL = "https://github.com/byo-oss/conventions/blob/main/SPEC.md";

export type Requirement = "required" | "recommended" | "optional";

export interface Dependency {
  name: string;
  requirement: Requirement;
  /** Shown under the name. A peer's version range is appended from npm. */
  kind: string;
  text: string;
  /** Read this peer dependency's range from the published package.json. */
  peer?: boolean;
}

interface ProductSource {
  slug: string;
  name: string;
  pkg: string;
  summary: string;
  menuText: string;
  exitTo: string[];
  dependencies: Dependency[];
  docsHref?: string;
  repo?: string;
}

export interface Product extends ProductSource {
  status: "released" | "in development";
  /** Latest version on npm. */
  version?: string;
  /** Version on main when it's ahead of npm: docs inside <Next> describe it. */
  next?: string;
}

const sources: ProductSource[] = [
  {
    slug: "notifications",
    name: "Notifications",
    pkg: "@byo-oss/notifications",
    summary: "A bell, an inbox and email follow-up for anything that went unread. Formerly better-inbox.",
    menuText: "In-app notifications: a bell, an inbox and email follow-up.",
    exitTo: ["Knock", "Novu", "Courier"],
    docsHref: "/docs/notifications/quickstart",
    repo: "https://github.com/byo-oss/notifications",
    dependencies: [
      {
        name: "better-auth",
        requirement: "required",
        kind: "peer",
        peer: true,
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
        kind: "peer",
        peer: true,
        text: "The ./react hooks and <InboxButton />. Skip it for server-only use.",
      },
      {
        name: "@wraps.dev/email",
        requirement: "optional",
        kind: "peer",
        peer: true,
        text: "The email channel, sent through your own AWS SES account.",
      },
      {
        name: "vitest",
        requirement: "optional",
        kind: "peer",
        peer: true,
        text: "Only for ./testing, which runs a custom channel's contract suite.",
      },
    ],
  },
  {
    slug: "support",
    name: "Support",
    pkg: "@byo-oss/support",
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
  {
    slug: "mailer",
    name: "Mailer",
    pkg: "@byo-oss/mailer",
    summary: "One email-sender interface for BYO packages. Send through Wraps, your own SES client, or any provider email-sdk can carry replies through.",
    menuText: "The email sender BYO packages share: Wraps, SES or email-sdk.",
    exitTo: ["your provider's SDK"],
    docsHref: "/docs/mailer/introduction",
    repo: "https://github.com/byo-oss/mailer",
    dependencies: [
      {
        name: "@wraps.dev/email",
        requirement: "optional",
        kind: "peer",
        peer: true,
        text: "wrapsMailer: send through your own AWS SES account. The default for BYO packages.",
      },
      {
        name: "@aws-sdk/client-sesv2",
        requirement: "optional",
        kind: "peer",
        peer: true,
        text: "sesMailer: send through an SESv2Client your app already has.",
      },
      {
        name: "@opencoredev/email-sdk",
        requirement: "optional",
        kind: "peer",
        peer: true,
        text: "emailSdkMailer: Resend, Postmark, SendGrid, SMTP and more, through a client you build.",
      },
      {
        name: "vitest",
        requirement: "optional",
        kind: "peer",
        peer: true,
        text: "The ./testing contract suite, for adapters you write.",
      },
    ],
  },
];

export const products: Product[] = await Promise.all(
  sources.map(async (source) => {
    const v = await resolveVersions(source.pkg, source.repo);
    return {
      ...source,
      status: v.latest ? "released" : "in development",
      version: v.latest,
      next: v.next,
      dependencies: source.dependencies.map((d) => {
        const range = d.peer ? v.peers[d.name] : undefined;
        return range ? { ...d, kind: `${d.kind} · ${range}` } : d;
      }),
    } satisfies Product;
  }),
);

export function reliesOnLine(product: Product): string {
  return product.dependencies
    .filter((d) => d.kind === "better-auth plugin" || d.name === "better-auth")
    .map((d) => (d.requirement === "required" ? d.name : `${d.name} (${d.requirement})`))
    .join(" · ") || "nothing required";
}

export function getProduct(slug: string): Product {
  const product = products.find((p) => p.slug === slug);
  if (!product) throw new Error(`Unknown product: ${slug}`);
  return product;
}

/** The product a /docs/<product>/… URL belongs to. */
export function productFromPath(pathname: string): Product | undefined {
  const slug = pathname.split("/")[2];
  return products.find((p) => p.slug === slug);
}
