import type { GenerationQualityFinding, ValidationResult } from "./types";
import type { BusinessContext } from "./unified-brief";

const fabricatedClaims = /\b(?:\d+(?:\.\d+)?\s*(?:star|stars|reviews?|customers?|years?)|award[- ]winning|best in|#1|five-star|licensed|certified|guaranteed?|satisfaction guaranteed|trusted by thousands|our team of)\b/i;
const placeholders = /\b(?:lorem ipsum|your business name|insert (?:text|image)|coming soon|replace me|example\.com|unsplash\.com|via\.placeholder)\b/i;
const promptLeak = /\b(?:unified site brief|creative contract|design system contract|page contract|section outline|factual restrictions|model prompt|as an ai)\b/i;

function finding(findings: GenerationQualityFinding[], code: string, severity: GenerationQualityFinding["severity"], message: string) { findings.push({ code, severity, message }); }
function hasAny(html: string, pattern: RegExp) { return pattern.test(html); }
function escapeRegExp(value: string) { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

export function normalizeStandaloneHtml(html: string) {
  let output = html.trim();
  if (!/^<!doctype html>/i.test(output)) output = `<!DOCTYPE html>\n${output}`;
  if (!/<html\b/i.test(output) || !/<head\b/i.test(output) || !/<body\b/i.test(output) || !/<\/html>\s*$/i.test(output)) return output;
  if (!/<meta\s+name=["']viewport["']/i.test(output)) output = output.replace(/<head\b[^>]*>/i, (head) => `${head}<meta name="viewport" content="width=device-width, initial-scale=1">`);
  if (!/<meta\s+name=["']robots["']/i.test(output)) output = output.replace(/<head\b[^>]*>/i, (head) => `${head}<meta name="robots" content="noindex, nofollow">`);
  if (!/data-seraphim-generator=["']true["']/i.test(output)) output = output.replace(/<body\b([^>]*)>/i, (_body, attrs: string) => `<body${attrs} data-seraphim-generator="true">`);
  return output;
}

export function validateGeneratedHtml(html: string, context: BusinessContext): ValidationResult {
  const output = normalizeStandaloneHtml(html);
  const findings: GenerationQualityFinding[] = [];
  if (!/^<!doctype html>/i.test(output) || !/<html\b/i.test(output) || !/<head\b/i.test(output) || !/<body\b/i.test(output) || !/<\/html>\s*$/i.test(output)) finding(findings, "DOCUMENT_STRUCTURE", "fatal", "Output is not a complete HTML document.");
  if (!/<style\b/i.test(output)) finding(findings, "EMBEDDED_CSS", "fatal", "Standalone output is missing embedded CSS.");
  if (!/<main\b/i.test(output) || !/<(?:header|nav)\b/i.test(output) || !/<footer\b/i.test(output)) finding(findings, "SEMANTIC_STRUCTURE", "warning", "Output should use header/nav, main, and footer landmarks.");
  if (!/:focus(?:-visible)?\s*\{/i.test(output)) finding(findings, "FOCUS_STATES", "fatal", "Keyboard-visible focus styles are missing.");
  if (!/<meta\s+name=["']viewport["']/i.test(output)) finding(findings, "VIEWPORT", "fatal", "Mobile viewport metadata is missing.");
  if (!/<meta\s+name=["']robots["'][^>]*noindex[^>]*nofollow/i.test(output)) finding(findings, "ROBOTS", "fatal", "Concept-site noindex,nofollow metadata is missing.");
  if (!/<title>[^<]{3,}<\/title>/i.test(output) || !/<meta\s+name=["']description["']/i.test(output)) finding(findings, "SEO_METADATA", "warning", "Title or meta description is missing.");
  if (!/<meta\s+property=["']og:title["']/i.test(output)) finding(findings, "OPEN_GRAPH", "warning", "Open Graph metadata is missing.");
  if (/<script\b[^>]+src=/i.test(output) || /<iframe\b|<object\b|<embed\b|<base\b/i.test(output) || /\b(?:javascript:|data:text\/html)/i.test(output)) finding(findings, "PREVIEW_UNSAFE", "fatal", "Output contains unsupported active or unsafe content.");
  if (hasAny(output, /<img\b(?![^>]*\balt\s*=)[^>]*>/i)) finding(findings, "MISSING_ALT", "fatal", "An image is missing alternative text.");
  const imageSources = [...output.matchAll(/<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi)].map((match) => match[1]);
  if (imageSources.some((src) => /^https?:\/\//i.test(src))) finding(findings, "UNAPPROVED_IMAGE", "fatal", "Output contains an unverified remote image source.");
  if (hasAny(output, /<(?:a|button)\b[^>]*>\s*(?:<[^>]+>\s*)*<\/(?:a|button)>/i)) finding(findings, "EMPTY_CTA", "fatal", "A CTA control has no accessible visible text.");
  if (hasAny(output, /(?:width\s*:\s*(?:[1-9]\d{3,})px|min-width\s*:\s*(?:[1-9]\d{3,})px|100vw\s*;)/i) && !/overflow-x\s*:\s*hidden/i.test(output)) finding(findings, "OVERFLOW_RISK", "warning", "Fixed-width styling may cause horizontal overflow.");
  if (placeholders.test(output)) finding(findings, "PLACEHOLDER", "fatal", "Output includes placeholder content or unreliable placeholder imagery.");
  if (promptLeak.test(output)) finding(findings, "PROMPT_LEAK", "fatal", "Output exposes internal generation language.");
  if (fabricatedClaims.test(output)) finding(findings, "FABRICATED_CLAIM", "fatal", "Output contains a potentially fabricated proof or performance claim.");
  if (context.name && !new RegExp(escapeRegExp(context.name), "i").test(output)) finding(findings, "BUSINESS_NAME", "fatal", "Output does not preserve the verified business name.");
  for (const contact of [context.phone, context.email]) if (contact && !new RegExp(escapeRegExp(contact), "i").test(output)) finding(findings, "CONTACT_MISMATCH", "warning", "A verified contact detail was not included in the page.");
  return { html: output, findings, fatal: findings.some((item) => item.severity === "fatal"), quality: { measured: ["document structure", "metadata", "factual safety patterns", "asset safety", "accessibility basics", "responsive heuristics"], notMeasured: ["visual taste", "real-world conversion performance"], findings: findings.length } };
}
