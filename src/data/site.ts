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
        name: "@better-auth/core",
        requirement: "required",
        kind: "peer",
        peer: true,
        text: "The after-commit hooks behind events. Install it at the same version as better-auth.",
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
        name: "@byo-oss/mailer",
        requirement: "optional",
        kind: "BYO package",
        text: "The email channel sends through any Mailer: your own SES, Resend, Postmark and more. Install it in your app to use email.",
      },
      {
        name: "@wraps.dev/email",
        requirement: "optional",
        kind: "peer",
        peer: true,
        text: "Only for wrapsMailer, which sends through your own AWS SES account.",
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
    exitTo: ["Zendesk", "Plain", "Front"],
    docsHref: "/docs/support/quickstart",
    repo: "https://github.com/byo-oss/support",
    dependencies: [
      {
        name: "better-auth",
        requirement: "required",
        kind: "peer",
        peer: true,
        text: "Contacts, agents and sessions are your better-auth users.",
      },
      {
        name: "@better-auth/core",
        requirement: "required",
        kind: "peer",
        peer: true,
        text: "The after-commit hooks behind events. Install it at the same version as better-auth.",
      },
      {
        name: "zod",
        requirement: "required",
        kind: "peer",
        peer: true,
        text: "Validation uses your app's copy. An app still on zod 3 has to move to zod 4 first.",
      },
      {
        name: "organization",
        requirement: "required",
        kind: "better-auth plugin",
        text: "The schema references it, and your staff are an organization's members.",
      },
      {
        name: "@byo-oss/notifications",
        requirement: "optional",
        kind: "BYO package",
        text: "Agent and requester alerts land in the same inbox as everything else.",
      },
      {
        name: "@wraps.dev/email",
        requirement: "optional",
        kind: "peer",
        peer: true,
        text: "wrapsMailer sends replies through your own AWS SES account.",
      },
      {
        name: "@aws-sdk/client-s3",
        requirement: "optional",
        kind: "peer",
        peer: true,
        text: "s3Storage for attachments, and wrapsInbound for inbound mail.",
      },
      {
        name: "react",
        requirement: "optional",
        kind: "peer",
        peer: true,
        text: "The ./react hooks and components.",
      },
      {
        name: "vitest",
        requirement: "optional",
        kind: "peer",
        peer: true,
        text: "Only for ./testing, the suite for adapters you write.",
      },
    ],
  },
  {
    slug: "entitlements",
    name: "Entitlements",
    pkg: "@byo-oss/entitlements",
    summary:
      "Plans, features, limits and usage for your organizations, from one typed catalog. Stripe knows which plan they bought; this decides what it allows.",
    menuText: "Plans, features, limits and usage from one typed catalog.",
    exitTo: ["Stripe Entitlements", "Autumn", "Schematic", "Stigg"],
    docsHref: "/docs/entitlements/quickstart",
    repo: "https://github.com/byo-oss/entitlements",
    dependencies: [
      {
        name: "better-auth",
        requirement: "required",
        kind: "peer",
        peer: true,
        text: "Organizations, sessions and your database adapter. Usage counters use its guarded incrementOne.",
      },
      {
        name: "@better-auth/core",
        requirement: "required",
        kind: "peer",
        peer: true,
        text: "The after-commit hooks behind events. Install it at the same version as better-auth.",
      },
      {
        name: "better-call",
        requirement: "required",
        kind: "peer",
        peer: true,
        text: "The endpoint layer under better-auth, which already depends on it.",
      },
      {
        name: "zod",
        requirement: "required",
        kind: "peer",
        peer: true,
        text: "Validation uses your app's copy. An app still on zod 3 has to move to zod 4 first.",
      },
      {
        name: "organization",
        requirement: "required",
        kind: "better-auth plugin",
        text: "Entitlements belong to organizations, and your staff are an organization's members.",
      },
      {
        name: "@better-auth/stripe",
        requirement: "optional",
        kind: "peer",
        peer: true,
        text: "The ./stripe billing source reads its subscriptions and reuses its webhook.",
      },
      {
        name: "@byo-oss/notifications",
        requirement: "optional",
        kind: "BYO package",
        text: "Tell an organization's owners when it reaches a limit.",
      },
      {
        name: "react",
        requirement: "optional",
        kind: "peer",
        peer: true,
        text: "The ./react hook, <EntitlementGate /> and <UsageMeter />.",
      },
      {
        name: "vitest",
        requirement: "optional",
        kind: "peer",
        peer: true,
        text: "Only for ./testing, the contract suite for billing sources you write.",
      },
    ],
  },
  {
    slug: "mailer",
    name: "Mailer",
    pkg: "@byo-oss/mailer",
    summary: "One email-sender interface for BYO packages. Send through Wraps, your own SES client, or any provider email-sdk can carry replies through.",
    menuText: "The email sender BYO packages share: Wraps, SES or email-sdk.",
    exitTo: ["another provider's adapter", "your provider's SDK"],
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
