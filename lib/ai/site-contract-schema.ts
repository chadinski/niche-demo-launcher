import { z } from "zod";

const stringArray = z.array(z.string()).default([]);

export const sectionContractSchema = z.object({
  id: z.string().default("section"),
  name: z.string().default("Section"),
  goal: z.string().default("Help visitors understand the offer and next step."),
  customerQuestionAnswered: z.string().default("What should I understand before taking the next step?"),
  requiredContent: stringArray,
  visualTreatment: z.string().default("Use the shared design system with a distinct composition."),
  ctaRole: z.string().default("Support the primary conversion path without adding fake urgency."),
  mustAvoid: stringArray,
});

export const creativeContractSchema = z.object({
  businessIdentity: z.object({
    name: z.string().default("Demo Business"),
    industry: z.string().default("Local business"),
    audience: z.string().default("Prospective customers evaluating this business."),
    offerSummary: z.string().default("A clear, verified business offer."),
    verifiedFacts: stringArray,
    missingFacts: stringArray,
    forbiddenClaims: stringArray,
  }),
  creativeThesis: z.object({
    oneSentenceDirection: z.string().default("Create a custom, premium, business-specific website demo."),
    brandMood: z.string().default("Confident, useful, and polished."),
    visualMetaphor: z.string().default("A composed editorial presentation of the business offer."),
    emotionalTarget: z.string().default("Trust, clarity, and readiness to contact."),
    customerDecisionMoment: z.string().default("The visitor is deciding whether this business feels credible enough to contact."),
    premiumSignals: stringArray,
    localSignals: stringArray,
  }),
  layoutStrategy: z.object({
    layoutArchetype: z.string().default("Custom editorial local business landing page."),
    heroComposition: z.string().default("Clear offer, one primary CTA, and one useful visual composition."),
    sectionRhythm: z.string().default("Alternate dense proof/offer sections with spacious visual or decision-support moments."),
    conversionPath: z.string().default("Introduce the offer, build confidence, answer objections, and invite contact."),
    mobileStrategy: z.string().default("Mobile-first single-column reading order with large tap targets and no horizontal overflow."),
    scrollExperience: z.string().default("Subtle reveal and anchor navigation without hiding essential content."),
  }),
  visualRules: z.object({
    colorLogic: z.string().default("Use a compact, contrast-safe palette tied to the business identity."),
    typographyLogic: z.string().default("Use one strong heading voice and one highly readable body stack."),
    spacingLogic: z.string().default("Use consistent section spacing with tighter rhythm on mobile."),
    surfaceLogic: z.string().default("Use cards and surfaces only to organize meaningful content."),
    imageryLogic: z.string().default("Use niche-relevant representative imagery without implying unverifiable proof."),
    iconographyLogic: z.string().default("Use icons sparingly as scanning aids, not decoration."),
    motionLogic: z.string().default("Use subtle, reduced-motion-safe transitions that never hide primary content."),
  }),
  copyRules: z.object({
    tone: z.string().default("Specific, credible, plainspoken, and premium."),
    voice: z.string().default("Helpful consultant, not hype machine."),
    ctaStyle: z.string().default("Direct action language tied to verified contact options."),
    trustLanguage: z.string().default("Use verified facts and conservative reassurance only."),
    wordsToUse: stringArray,
    wordsToAvoid: stringArray,
  }),
  sectionRules: z.array(sectionContractSchema).default([]),
  qualityBar: z.object({
    mustFeelLike: z.string().default("A serious designer and senior frontend engineer created a custom business demo."),
    mustNotFeelLike: z.string().default("A generic AI template, Bootstrap starter, or SaaS landing page pasted onto a local business."),
    minimumVisualStandard: z.string().default("Strong hierarchy, coherent tokens, varied section composition, responsive polish, and real embedded CSS."),
    factualSafetyStandard: z.string().default("No fake claims, testimonials, ratings, prices, awards, certifications, guarantees, or fabricated details."),
    conversionStandard: z.string().default("One obvious primary contact path repeated at meaningful decision points."),
    mobileStandard: z.string().default("Readable at 360px, no overflow, accessible controls, and stable content without animation."),
  }),
});

const componentContractSchema = z.object({
  className: z.string().default("seraphim-component"),
  css: z.string().default(""),
  usageRules: stringArray,
});

export const designSystemContractSchema = z.object({
  cssStrategy: z.object({
    useEmbeddedCssOnly: z.boolean().default(true),
    avoidDeadUtilityClasses: z.boolean().default(true),
    classNamingPrefix: z.string().default("seraphim-"),
    responsiveBreakpoints: stringArray,
  }),
  tokens: z.object({
    colors: z.record(z.string(), z.string()).default({}),
    fonts: z.record(z.string(), z.string()).default({}),
    spacing: z.record(z.string(), z.string()).default({}),
    radius: z.record(z.string(), z.string()).default({}),
    shadows: z.record(z.string(), z.string()).default({}),
    gradients: z.record(z.string(), z.string()).default({}),
    borders: z.record(z.string(), z.string()).default({}),
  }),
  components: z.object({
    section: componentContractSchema,
    container: componentContractSchema,
    eyebrow: componentContractSchema,
    heading: componentContractSchema,
    bodyText: componentContractSchema,
    buttonPrimary: componentContractSchema,
    buttonSecondary: componentContractSchema,
    card: componentContractSchema,
    imageFrame: componentContractSchema,
    proofItem: componentContractSchema,
    contactBlock: componentContractSchema,
    faqItem: componentContractSchema,
  }),
});

export const pageContractSchema = z.object({
  creativeContract: creativeContractSchema,
  designSystem: designSystemContractSchema,
  sections: z.array(sectionContractSchema).default([]),
  globalCss: z.string().default(""),
  metadataRules: stringArray,
  qaChecklist: stringArray,
});

export const visualQASectionIssueSchema = z.object({
  sectionId: z.string().default("global"),
  severity: z.enum(["low", "medium", "high"]).default("medium"),
  issue: z.string().default("Review this section."),
  revisionInstruction: z.string().default("Revise the section to satisfy the page contract."),
});

export const visualQAResultSchema = z.object({
  passed: z.boolean().default(false),
  score: z.number().min(0).max(10).default(0),
  issues: stringArray,
  sectionIssues: z.array(visualQASectionIssueSchema).default([]),
  globalRevisionInstruction: z.string().default("Improve the generated HTML to satisfy the creative contract and design system."),
  renderQA: z.object({
    available: z.boolean().default(false),
    findings: z.array(z.object({
      severity: z.enum(["low", "medium", "high"]).default("medium"),
      issue: z.string().default("Render QA finding."),
      viewport: z.enum(["desktop", "mobile", "global"]).default("global"),
    })).default([]),
    warnings: stringArray,
  }).optional(),
});

export type SectionContract = z.infer<typeof sectionContractSchema>;
export type CreativeContract = z.infer<typeof creativeContractSchema>;
export type ComponentContract = z.infer<typeof componentContractSchema>;
export type DesignSystemContract = z.infer<typeof designSystemContractSchema>;
export type PageContract = z.infer<typeof pageContractSchema>;
export type VisualQAResult = z.infer<typeof visualQAResultSchema>;

export const DEFAULT_CREATIVE_CONTRACT: CreativeContract = creativeContractSchema.parse({
  businessIdentity: {
    name: "Demo Business",
    industry: "Local business",
    audience: "Prospective customers evaluating this business.",
    offerSummary: "A clear, verified business offer.",
    verifiedFacts: [],
    missingFacts: ["verified reviews/testimonials", "verified business photography"],
    forbiddenClaims: [
      "No fake testimonials",
      "No fake ratings",
      "No fake awards",
      "No fake certifications",
      "No fake prices",
      "No fake guarantees",
    ],
  },
  creativeThesis: {
    oneSentenceDirection: "Create a custom, premium, business-specific website demo.",
    premiumSignals: ["clear hierarchy", "coherent spacing", "credible imagery direction"],
    localSignals: ["clear contact path"],
  },
  layoutStrategy: {},
  visualRules: {},
  copyRules: {},
  sectionRules: [
    {
      id: "hero",
      name: "Hero",
      goal: "Introduce the offer and present the primary CTA.",
      requiredContent: ["business name", "offer", "primary CTA"],
      mustAvoid: ["vague slogan", "fake proof"],
    },
    {
      id: "services",
      name: "Services",
      goal: "Explain the verified offer around customer intent.",
      requiredContent: ["verified services or safe ask-about language"],
      mustAvoid: ["invented services"],
    },
    {
      id: "contact",
      name: "Contact",
      goal: "Make the next step easy and honest.",
      requiredContent: ["verified contact options or clearly labeled missing details"],
      mustAvoid: ["fake form behavior"],
    },
  ],
  qualityBar: {},
});

export const DEFAULT_DESIGN_SYSTEM_CONTRACT: DesignSystemContract = designSystemContractSchema.parse({
  cssStrategy: {
    useEmbeddedCssOnly: true,
    avoidDeadUtilityClasses: true,
    classNamingPrefix: "seraphim-",
    responsiveBreakpoints: ["720px", "960px", "1200px"],
  },
  tokens: {
    colors: {
      primary: "#2B5E8C",
      secondary: "#F4A261",
      accent: "#E76F51",
      bg: "#F8FAFC",
      surface: "#FFFFFF",
      text: "#0F172A",
      muted: "#475569",
      border: "#E2E8F0",
    },
    fonts: {
      heading: 'Inter, ui-sans-serif, system-ui, "Segoe UI", sans-serif',
      body: 'Inter, ui-sans-serif, system-ui, "Segoe UI", sans-serif',
    },
    spacing: {
      section: "clamp(4rem, 8vw, 8rem)",
      container: "min(1120px, calc(100% - 2rem))",
      gap: "clamp(1rem, 2vw, 2rem)",
    },
    radius: {
      sm: "0.5rem",
      md: "0.75rem",
      lg: "1rem",
      xl: "1.5rem",
    },
    shadows: {
      card: "0 20px 50px rgb(15 23 42 / 0.12)",
    },
    gradients: {
      hero: "linear-gradient(135deg, color-mix(in srgb, var(--seraphim-primary) 14%, white), white)",
    },
    borders: {
      subtle: "1px solid var(--seraphim-border)",
    },
  },
  components: {
    section: {
      className: "seraphim-section",
      css: ".seraphim-section{padding:var(--seraphim-section-space) 0;scroll-margin-top:92px;}",
      usageRules: ["Use on every major section root."],
    },
    container: {
      className: "seraphim-container",
      css: ".seraphim-container{width:var(--seraphim-container);margin-inline:auto;}",
      usageRules: ["Wrap section content to prevent over-wide lines."],
    },
    eyebrow: {
      className: "seraphim-eyebrow",
      css: ".seraphim-eyebrow{margin:0 0 .75rem;color:var(--seraphim-primary);font-size:.74rem;font-weight:900;letter-spacing:.14em;text-transform:uppercase;}",
      usageRules: ["Use only when it clarifies section scanning."],
    },
    heading: {
      className: "seraphim-heading",
      css: ".seraphim-heading{margin:0;font-family:var(--seraphim-heading-font);font-size:clamp(2rem,5vw,4.75rem);line-height:1;letter-spacing:-.05em;color:var(--seraphim-text);}",
      usageRules: ["Use for main section headings."],
    },
    bodyText: {
      className: "seraphim-body-text",
      css: ".seraphim-body-text{max-width:68ch;color:var(--seraphim-muted);font-size:clamp(1rem,1.4vw,1.125rem);line-height:1.75;}",
      usageRules: ["Use for readable explanatory copy."],
    },
    buttonPrimary: {
      className: "seraphim-button-primary",
      css: ".seraphim-button-primary{display:inline-flex;align-items:center;justify-content:center;min-height:44px;border-radius:999px;background:var(--seraphim-primary);color:white;padding:.85rem 1.15rem;font-weight:900;text-decoration:none;box-shadow:var(--seraphim-shadow-card);transition:transform .18s ease,box-shadow .18s ease;}.seraphim-button-primary:hover{transform:translateY(-2px);}",
      usageRules: ["Use for the single primary conversion action."],
    },
    buttonSecondary: {
      className: "seraphim-button-secondary",
      css: ".seraphim-button-secondary{display:inline-flex;align-items:center;justify-content:center;min-height:44px;border:var(--seraphim-border-subtle);border-radius:999px;background:var(--seraphim-surface);color:var(--seraphim-text);padding:.85rem 1.15rem;font-weight:900;text-decoration:none;}",
      usageRules: ["Use for secondary navigation or low-commitment actions."],
    },
    card: {
      className: "seraphim-card",
      css: ".seraphim-card{border:var(--seraphim-border-subtle);border-radius:var(--seraphim-radius-xl);background:var(--seraphim-surface);box-shadow:var(--seraphim-shadow-card);padding:clamp(1.1rem,2vw,1.6rem);}",
      usageRules: ["Use for cohesive service, proof, or decision-support units."],
    },
    imageFrame: {
      className: "seraphim-image-frame",
      css: ".seraphim-image-frame{overflow:hidden;border-radius:var(--seraphim-radius-xl);background:var(--seraphim-gradient-hero);border:var(--seraphim-border-subtle);}",
      usageRules: ["Use for representative or verified imagery with honest alt text."],
    },
    proofItem: {
      className: "seraphim-proof-item",
      css: ".seraphim-proof-item{display:flex;gap:.75rem;align-items:flex-start;color:var(--seraphim-muted);font-weight:700;}",
      usageRules: ["Only use verified facts or conservative reassurance."],
    },
    contactBlock: {
      className: "seraphim-contact-block",
      css: ".seraphim-contact-block{display:grid;gap:1rem;border-radius:var(--seraphim-radius-xl);background:var(--seraphim-text);color:white;padding:clamp(1.25rem,3vw,2rem);}",
      usageRules: ["Use for final contact paths with verified phone/email/social links."],
    },
    faqItem: {
      className: "seraphim-faq-item",
      css: ".seraphim-faq-item{border-bottom:1px solid color-mix(in srgb,var(--seraphim-text) 12%,transparent);padding:1rem 0;}.seraphim-faq-item summary{cursor:pointer;font-weight:900;}",
      usageRules: ["Use native details/summary and keep answers factual."],
    },
  },
});

export const DEFAULT_PAGE_CONTRACT: PageContract = pageContractSchema.parse({
  creativeContract: DEFAULT_CREATIVE_CONTRACT,
  designSystem: DEFAULT_DESIGN_SYSTEM_CONTRACT,
  sections: DEFAULT_CREATIVE_CONTRACT.sectionRules,
  globalCss: "",
  metadataRules: ["Use noindex for demos", "Use verified JSON-LD only"],
  qaChecklist: ["No fake claims", "No dead utility classes", "Clear CTA", "Responsive layout"],
});

function parseJsonLike(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const fenced = value.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1] ?? value;
  const match = fenced.match(/\{[\s\S]*\}/);
  if (!match) return value;
  try {
    return JSON.parse(match[0]);
  } catch {
    return value;
  }
}

export function parseCreativeContract(value: unknown, fallback: CreativeContract = DEFAULT_CREATIVE_CONTRACT): CreativeContract {
  const parsed = creativeContractSchema.safeParse(parseJsonLike(value));
  return parsed.success ? parsed.data : fallback;
}

export function parseDesignSystemContract(
  value: unknown,
  fallback: DesignSystemContract = DEFAULT_DESIGN_SYSTEM_CONTRACT,
): DesignSystemContract {
  const parsed = designSystemContractSchema.safeParse(parseJsonLike(value));
  return parsed.success ? parsed.data : fallback;
}

export function parsePageContract(value: unknown, fallback: PageContract = DEFAULT_PAGE_CONTRACT): PageContract {
  const parsed = pageContractSchema.safeParse(parseJsonLike(value));
  return parsed.success ? parsed.data : fallback;
}

export function parseVisualQAResult(value: unknown, fallback?: VisualQAResult): VisualQAResult {
  const parsed = visualQAResultSchema.safeParse(parseJsonLike(value));
  return parsed.success
    ? parsed.data
    : fallback ?? {
        passed: false,
        score: 0,
        issues: ["Visual QA did not return valid JSON."],
        sectionIssues: [],
        globalRevisionInstruction: "Review the generated page manually.",
      };
}
