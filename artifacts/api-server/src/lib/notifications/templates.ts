// Subject + plaintext body templates for operator notifications.
// Plaintext on purpose — the operator inbox is internal and the
// signal is what matters; an HTML build adds attack surface and
// rendering surprises. Truncations cap user input so a malicious
// 5 MB vision can't bloat an email.

const PLACEHOLDER_BASE = "https://bonanzacr8tives.com";

function studioUrl(): string {
  const base = (process.env["PUBLIC_BASE_URL"] || PLACEHOLDER_BASE).replace(
    /\/+$/,
    "",
  );
  return `${base}/studio`;
}

function clip(value: string | null | undefined, max: number): string {
  if (!value) return "";
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max).trimEnd()}…`;
}

export interface BriefTemplateInput {
  briefId: string;
  title: string;
  clientName: string;
  clientEmail: string;
  vision: string;
  budgetNote: string;
}

export function briefTemplate(input: BriefTemplateInput): {
  subject: string;
  body: string;
} {
  const subject = `[Bonanza] New brief — ${clip(input.title, 80)}`;
  const lines = [
    "A new brief has landed in Bonanza Studio.",
    "",
    `Title:  ${input.title}`,
    `Client: ${clip(input.clientName, 200) || "(not provided)"}`,
    `Email:  ${clip(input.clientEmail, 320) || "(not provided)"}`,
    `Budget: ${clip(input.budgetNote, 200) || "Not specified"}`,
    "",
    "Vision",
    "------",
    clip(input.vision, 400),
    "",
    `Open in studio: ${studioUrl()}`,
    `Brief ID: ${input.briefId}`,
  ];
  return { subject, body: lines.join("\n") };
}

export interface LeadTemplateInput {
  leadId: string;
  email: string;
  vision: string;
  aiOutput: string | null;
}

export function leadTemplate(input: LeadTemplateInput): {
  subject: string;
  body: string;
} {
  const subject = `[Bonanza] New lead — ${clip(input.email, 80)}`;
  const lines = [
    "A new lead has been captured from the Bonanza landing.",
    "",
    `Email: ${input.email}`,
    "",
    "Vision",
    "------",
    clip(input.vision, 400),
    "",
    "AI reflection",
    "-------------",
    clip(input.aiOutput, 400) || "(none)",
    "",
    `Open in studio: ${studioUrl()}`,
    `Lead ID: ${input.leadId}`,
  ];
  return { subject, body: lines.join("\n") };
}
