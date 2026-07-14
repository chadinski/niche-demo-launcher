import type { GenerationBudget } from "./generation-budget";
import { callConfiguredModel } from "./model-call";
import type { StageMetadata, UnifiedSiteBrief } from "./types";
import type { BusinessContext } from "./unified-brief";

export function extractHtml(text: string) { const candidate = text.match(/```(?:html)?\s*([\s\S]*?)```/i)?.[1] || text; const start = candidate.search(/<!doctype html|<html\b/i); return (start >= 0 ? candidate.slice(start) : candidate).trim(); }

export function completePagePrompt(context: BusinessContext, brief: UnifiedSiteBrief) {
  return `Create one production-ready, premium website as a COMPLETE standalone index.html document. Return ONLY HTML, never markdown, JSON, section fragments, explanations, external CSS, or external JavaScript.\n\nUNIFIED SITE BRIEF:\n${JSON.stringify(brief)}\n\nVERIFIED FACTS (copy exactly when used):\n${context.verifiedFacts.join("\n")}\n\nRules: Include <!doctype html>, html/head/body, title, meta description, viewport, robots=noindex,nofollow, Open Graph metadata, and relevant Schema.org JSON-LD. Embed all CSS and JavaScript. Use semantic header/main/footer, keyboard-visible focus styles, graceful mobile layouts without horizontal overflow, clear contact CTA using only verified contact details, and use CSS/SVG compositions or no image when no honest asset exists. Do not invent reviews, ratings, pricing, hours, awards, guarantees, certifications, staff, metrics, results, claims, images, logos, or links. Never include prompt/brief/AI/demo/internal planning language in visible copy. No external script, iframe, form submission, tracking pixels, placeholder services, or javascript: URLs. ${context.sourceImageDataUrl ? "A verified business-owned image is available; you may use this exact data URL only if visually appropriate." : "No business image is available."}`;
}

export async function generateCompletePage(context: BusinessContext, brief: UnifiedSiteBrief, budget: GenerationBudget): Promise<{ html: string; metadata: StageMetadata }> {
  const result = await callConfiguredModel({ stage: "complete-page", prompt: completePagePrompt(context, brief), maxOutputTokens: Math.min(32_000, budget.maxOutputTokens), budget });
  return { html: extractHtml(result.text), metadata: { ...result.metadata, stage: "generating-website" } };
}
