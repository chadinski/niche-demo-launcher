"use client";

import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Clipboard,
  Code2,
  Copy,
  Download,
  ExternalLink,
  FileCode2,
  FileImage,
  Globe2,
  ImageUp,
  ListChecks,
  Mail,
  MessageCircle,
  MousePointerClick,
  Route,
  RotateCcw,
  Rocket,
  Save,
  ScanText,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Target,
  WandSparkles,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/confirm-modal";
import { deployGeneratedWebsite } from "@/app/deployment-actions";
import { PageHeading } from "@/components/page-heading";
import { Button, Card, SectionLabel } from "@/components/ui";
import { useProspects } from "@/components/prospect-provider";
import {
  emptyBusinessInfo,
  generateSalesMessages,
  generatedNames,
} from "@/lib/generators";
import { DEFAULT_SETTINGS } from "@/lib/mock-data";
import {
  toOpenAIBusinessInfo,
  type OpenAIBusinessUnderstanding as BusinessUnderstanding,
} from "@/lib/openai-business-intelligence";
import {
  clearGenerationStorage,
  createGenerationId,
  type GenerationError,
  type GenerationPlan,
  type SectionOutput,
} from "@/lib/generation/session";
import { createPreviewHtml } from "@/lib/generation/preview";
import { generateBusinessIntelligence } from "@/lib/automation/business-intelligence";
import { nextFollowUpDate, statusAfterMilestone } from "@/lib/automation/follow-ups";
import { scoreLead } from "@/lib/automation/lead-scoring";
import { auditWebsite } from "@/lib/automation/quality-audit";
import type {
  BusinessInfo,
  MessageTone,
  Prospect,
  QualityAudit,
  SalesMessages,
} from "@/lib/types";
import { cn, phoneDigits } from "@/lib/utils";

const TONES: MessageTone[] = [
  "Friendly",
  "Direct",
  "Premium",
  "Soft sell",
  "Confident",
  "Local business friendly",
];

const messageTabs: Array<{ key: keyof SalesMessages; label: string }> = [
  { key: "whatsapp", label: "WhatsApp" },
  { key: "email", label: "Email" },
  { key: "dm", label: "DM" },
  { key: "facebook", label: "Facebook" },
  { key: "followUp", label: "Follow-up 1" },
  { key: "followUp2", label: "Follow-up 2" },
  { key: "finalFollowUp", label: "Final check-in" },
];

type BusyAction = "image" | "parse" | "website" | "message" | "both" | "save" | "deploy" | null;
type GenerationMode = "standard" | "more-luxury" | "more-local" | "more-bold";

const generationModes: Array<{ key: GenerationMode; label: string; directive: string }> = [
  { key: "standard", label: "Balanced", directive: "" },
  { key: "more-luxury", label: "More luxury", directive: "Generation direction: make the next website feel more luxury, editorial, premium, spacious, and refined while keeping facts accurate." },
  { key: "more-local", label: "More local", directive: "Generation direction: make the next website feel warmer, more local/community-rooted, practical, approachable, and easy to contact." },
  { key: "more-bold", label: "More bold", directive: "Generation direction: make the next website feel bolder, higher-energy, more modern, more visually dramatic, and more action-led." },
];

type ReadinessCheck = {
  label: string;
  detail: string;
  passed: boolean;
  action: string;
};

function valueState(value: string) {
  return value.trim() ? "Verified" : "Missing";
}

function contactSummary(info: BusinessInfo) {
  const channels = [
    info.phone && "phone",
    info.email && "email",
    info.socialUrl && "social",
    info.websiteUrl && "website",
  ].filter(Boolean);

  return channels.length ? channels.join(", ") : "";
}

function buildReadinessChecks(
  info: BusinessInfo,
  html: string,
  messages: SalesMessages | null,
  qualityAudit: QualityAudit | null,
): ReadinessCheck[] {
  const hasIdentity = Boolean(info.businessName.trim() && info.category.trim());
  const hasContact = Boolean(info.phone.trim() || info.email.trim() || info.socialUrl.trim());
  const hasOffer = Boolean(info.services.trim() || info.category.trim());
  const hasOpportunity = Boolean(info.painPoints.trim() || info.notes.trim());
  const generated = Boolean(html);
  const auditReady = Boolean(qualityAudit?.passed);
  const hasDemoUrl = Boolean(info.demoUrl.trim());
  const hasOutreach = Boolean(messages?.whatsapp || messages?.email || messages?.dm);

  return [
    {
      label: "Identity captured",
      detail: hasIdentity ? `${info.businessName} is categorized as ${info.category}.` : "Add business name and category before generating.",
      passed: hasIdentity,
      action: "Review business profile",
    },
    {
      label: "Contact route available",
      detail: hasContact ? `Available channels: ${contactSummary(info)}.` : "Add phone, email, or social profile for a real next step.",
      passed: hasContact,
      action: "Add contact route",
    },
    {
      label: "Offer is specific",
      detail: hasOffer ? "Services or category can guide page sections and outreach." : "Add services, products, or a clear niche.",
      passed: hasOffer,
      action: "Clarify offer",
    },
    {
      label: "Opportunity noted",
      detail: hasOpportunity ? "Pain point or internal context is available for the sales angle." : "Add the observed website or presentation opportunity.",
      passed: hasOpportunity,
      action: "Add opportunity",
    },
    {
      label: "Website generated",
      detail: generated ? "A complete single-file website is ready for review." : "Generate the website concept.",
      passed: generated,
      action: "Generate website",
    },
    {
      label: "Quality audit passed",
      detail: qualityAudit ? `${qualityAudit.score}/100 ${qualityAudit.passed ? "ready with review." : "has warnings to review."}` : "Generate the website to run the audit.",
      passed: auditReady,
      action: "Review audit",
    },
    {
      label: "Live URL attached",
      detail: hasDemoUrl ? "Demo link is ready for the message." : "Deploy or paste the Vercel preview URL.",
      passed: hasDemoUrl,
      action: "Add demo link",
    },
    {
      label: "Outreach ready",
      detail: hasOutreach ? "Channel-specific messages are ready for manual approval." : "Generate WhatsApp, email, and DM messages.",
      passed: hasOutreach,
      action: "Generate messages",
    },
  ];
}

function readinessScore(checks: ReadinessCheck[]) {
  return Math.round((checks.filter((check) => check.passed).length / checks.length) * 100);
}

function nextBestAction(checks: ReadinessCheck[]) {
  return checks.find((check) => !check.passed)?.action ?? "Approve and send manually";
}

function confidenceTone(score: number) {
  if (score >= 78) return "strong";
  if (score >= 55) return "review";
  return "weak";
}

function confidenceLabel(score: number) {
  if (score >= 78) return "Strong";
  if (score >= 55) return "Review";
  return "Needs review";
}

function generationDirective(mode: GenerationMode, understanding: BusinessUnderstanding | null) {
  const modeDirective = generationModes.find((item) => item.key === mode)?.directive ?? "";
  const themeDirective = understanding
    ? [
        `Business intelligence theme: ${understanding.industry.category.label}.`,
        `Industry: ${understanding.industry.primaryIndustry}.`,
        `Theme variation: ${understanding.theme.variation}.`,
        `Recommended CTA: ${understanding.theme.cta}.`,
        `Section priorities: ${understanding.theme.sectionPriorities.join(", ")}.`,
        `Trust elements: ${understanding.theme.trustElements.join(", ")}.`,
      ].join(" ")
    : "";

  return [themeDirective, modeDirective].filter(Boolean).join("\n");
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function DemoWorkspace() {
  const { saveProspect, setStatus, updateProspect } = useProspects();
  const [generationId, setGenerationId] = useState(() => createGenerationId());
  const [info, setInfo] = useState<BusinessInfo>(() => emptyBusinessInfo());
  const [html, setHtml] = useState("");
  const [messages, setMessages] = useState<SalesMessages | null>(null);
  const [tone, setTone] = useState<MessageTone>("Friendly");
  const [busy, setBusy] = useState<BusyAction>(null);
  const [outputTab, setOutputTab] = useState<"preview" | "code">("preview");
  const [messageTab, setMessageTab] = useState<keyof SalesMessages>("whatsapp");
  const [prospectId, setProspectId] = useState<string | null>(null);
  const [confirmSent, setConfirmSent] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState("");
  const [ocrProgress, setOcrProgress] = useState(0);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [businessUnderstanding, setBusinessUnderstanding] = useState<BusinessUnderstanding | null>(null);
  const [businessReport, setBusinessReport] = useState("");
  const [extractionReviewed, setExtractionReviewed] = useState(false);
  const [generationMode, setGenerationMode] = useState<GenerationMode>("standard");
  const [generationPlan, setGenerationPlan] = useState<GenerationPlan | null>(null);
  const [sectionOutputs, setSectionOutputs] = useState<SectionOutput[]>([]);
  const [skippedSections, setSkippedSections] = useState<string[]>([]);
  const [generationErrors, setGenerationErrors] = useState<GenerationError[]>([]);
  const [modelMetadata, setModelMetadata] = useState<Array<{
    stage: string;
    provider: string;
    model: string;
    fallback: boolean;
  }>>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const generationIdRef = useRef(generationId);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    generationIdRef.current = generationId;
  }, [generationId]);

  const names = useMemo(() => generatedNames(info), [info]);
  const leadScore = useMemo(() => scoreLead(info), [info]);
  const intelligence = useMemo(
    () => generateBusinessIntelligence(info, leadScore),
    [info, leadScore],
  );
  const qualityAudit = useMemo(
    () => (html ? auditWebsite(html, info) : null),
    [html, info],
  );
  const previewHtml = useMemo(() => createPreviewHtml(html), [html]);
  const readinessChecks = useMemo(
    () => buildReadinessChecks(info, html, messages, qualityAudit),
    [info, html, messages, qualityAudit],
  );
  const launchReadiness = useMemo(
    () => readinessScore(readinessChecks),
    [readinessChecks],
  );
  const pendingChecks = useMemo(
    () => readinessChecks.filter((check) => !check.passed),
    [readinessChecks],
  );
  const recommendedAction = useMemo(
    () => nextBestAction(readinessChecks),
    [readinessChecks],
  );
  const extractionReviewItems = useMemo(() => {
    if (!businessUnderstanding) return [];
    const hasContact = Boolean(info.phone || info.email || info.socialUrl || info.websiteUrl);
    const hasServices = Boolean(info.services.trim());
    const hasLocation = Boolean(info.location.trim());

    return [
      {
        label: "Business name",
        value: info.businessName || businessUnderstanding.selectedBusinessName || "Your Business Name",
        confidence: businessUnderstanding.businessNameConfidence,
        detail: businessUnderstanding.businessNameReason,
      },
      {
        label: "Industry",
        value: businessUnderstanding.industry.primaryIndustry,
        confidence: businessUnderstanding.industry.confidence,
        detail: businessUnderstanding.industry.explanation,
      },
      {
        label: "Website category",
        value: businessUnderstanding.industry.category.label,
        confidence: businessUnderstanding.industry.categoryConfidence,
        detail: `Triggered by: ${businessUnderstanding.industry.triggeredKeywords.join(", ") || "broad business context"}.`,
      },
      {
        label: "Services / products",
        value: info.services || "Needs service confirmation",
        confidence: hasServices ? 74 : 35,
        detail: hasServices ? "Services are available for section planning." : "Add or confirm services before outreach.",
      },
      {
        label: "Contact route",
        value: contactSummary(info) || "Missing contact route",
        confidence: hasContact ? 82 : 28,
        detail: hasContact ? "At least one contact channel is available." : "Add phone, email, website, or social before outreach.",
      },
      {
        label: "Location",
        value: info.location || "Location not confirmed",
        confidence: hasLocation ? 72 : 34,
        detail: hasLocation ? "Location/service area is available." : "Location can remain omitted, but should be reviewed.",
      },
    ];
  }, [businessUnderstanding, info]);
  const extractionWarnings = useMemo(
    () =>
      businessUnderstanding
        ? [...businessUnderstanding.missingInformation, ...businessUnderstanding.assumptions]
            .filter(Boolean)
            .slice(0, 6)
        : [],
    [businessUnderstanding],
  );

  const isActiveGeneration = useCallback(
    (candidateGenerationId: string) => candidateGenerationId === generationIdRef.current,
    [],
  );

  const noteGenerationError = useCallback((candidateGenerationId: string, stage: string, error: unknown) => {
    if (!isActiveGeneration(candidateGenerationId)) return;
    const message = error instanceof Error ? error.message : "Generation step failed.";
    setGenerationErrors((current) => [
      ...current.filter((item) => item.generationId === candidateGenerationId),
      { generationId: candidateGenerationId, stage, message },
    ]);
  }, [isActiveGeneration]);

  const startGenerationRequest = useCallback((candidateGenerationId: string) => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    if (process.env.NODE_ENV !== "production") {
      console.debug(`[generation:${candidateGenerationId}] started server extraction request`);
    }
    return controller;
  }, []);

  const resetGenerationState = useCallback((toastMessage = "Started a clean generation") => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;

    if (imagePreview) URL.revokeObjectURL(imagePreview);

    const nextGenerationId = createGenerationId();
    generationIdRef.current = nextGenerationId;
    setGenerationId(nextGenerationId);
    clearGenerationStorage();
    setInfo(emptyBusinessInfo());
    setHtml("");
    setMessages(null);
    setTone("Friendly");
    setBusy(null);
    setOutputTab("preview");
    setMessageTab("whatsapp");
    setProspectId(null);
    setConfirmSent(false);
    setImageFile(null);
    setImagePreview("");
    setImageDataUrl("");
    setOcrProgress(0);
    setIsDraggingImage(false);
    setBusinessUnderstanding(null);
    setBusinessReport("");
    setExtractionReviewed(false);
    setGenerationMode("standard");
    setGenerationPlan(null);
    setSectionOutputs([]);
    setSkippedSections([]);
    setGenerationErrors([]);
    setModelMetadata([]);
    if (imageInputRef.current) imageInputRef.current.value = "";

    if (process.env.NODE_ENV !== "production") {
      console.debug(`[generation:${nextGenerationId}] clean generation state initialized`);
    }

    if (toastMessage) toast.success(toastMessage);
  }, [imagePreview]);

  const updateInfo = useCallback(
    (key: keyof BusinessInfo, value: string) => {
      const nextInfo = { ...info, [key]: value };
      setInfo(nextInfo);
      if (
        businessUnderstanding &&
        ["businessName", "category", "location", "phone", "email", "websiteUrl", "socialUrl", "services", "brandColors"].includes(key)
      ) {
        setExtractionReviewed(false);
      }
      if (key === "demoUrl" && messages) {
        setMessages(generateSalesMessages(nextInfo, tone, DEFAULT_SETTINGS));
      }
    },
    [businessUnderstanding, info, messages, tone],
  );

  const runAction = async (
    action: BusyAction,
    work: (activeGenerationId: string) => void | Promise<void>,
    success: string,
  ) => {
    const activeGenerationId = generationIdRef.current;
    setBusy(action);
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 420));
      await work(activeGenerationId);
      if (isActiveGeneration(activeGenerationId)) toast.success(success);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      if (!isActiveGeneration(activeGenerationId)) return;
      noteGenerationError(activeGenerationId, action || "unknown", error);
      toast.error(error instanceof Error ? error.message : "That action could not be completed");
    } finally {
      if (isActiveGeneration(activeGenerationId)) setBusy(null);
    }
  };

  const applyOpenAIUnderstanding = useCallback(
    (
      sourceInfo: BusinessInfo,
      understanding: BusinessUnderstanding,
      activeGenerationId: string,
      metadata?: { stage: string; provider: string; model: string; fallback: boolean },
    ) => {
      if (!isActiveGeneration(activeGenerationId)) return null;
      const populated = Object.fromEntries(
        Object.entries(understanding.enrichedInfo).filter(([, value]) =>
          typeof value === "string" ? value.trim() : Boolean(value),
        ),
      ) as Partial<BusinessInfo>;
      const nextInfo = {
        ...sourceInfo,
        ...populated,
        rawInfo: sourceInfo.rawInfo || understanding.rawOcrText,
      };
      setBusinessUnderstanding(understanding);
      setBusinessReport(understanding.reportMarkdown);
      if (metadata) setModelMetadata((current) => [...current.filter((item) => item.stage !== metadata.stage), metadata]);
      setExtractionReviewed(false);
      setInfo(nextInfo);
      return nextInfo;
    },
    [isActiveGeneration],
  );

  const requestOpenAIBusinessUnderstanding = useCallback(
    async (
      sourceInfo: BusinessInfo,
      activeGenerationId: string,
      options: { imageName?: string; imageDataUrl?: string } = {},
    ) => {
      const controller = startGenerationRequest(activeGenerationId);
      const response = await fetch("/api/business-intelligence", {
        method: "POST",
        cache: "no-store",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          generationId: activeGenerationId,
          rawOcrText: sourceInfo.rawInfo,
          imageDataUrl: options.imageDataUrl || imageDataUrl,
          imageName: options.imageName || imageFile?.name || "",
          brandColors: sourceInfo.brandColors,
          currentInfo: toOpenAIBusinessInfo(sourceInfo),
        }),
      });
      const payload = (await response.json()) as {
        generationId?: string;
        understanding?: BusinessUnderstanding;
        modelMetadata?: { stage: string; provider: string; model: string; fallback: boolean };
        error?: string;
      };

      if (payload.generationId !== activeGenerationId || !isActiveGeneration(activeGenerationId)) {
        if (process.env.NODE_ENV !== "production") {
          console.debug(`[generation:${activeGenerationId}] ignored stale extraction response`);
        }
        return null;
      }

      if (!response.ok || !payload.understanding) {
        throw new Error(payload.error || "OpenAI business intelligence failed");
      }

      return payload;
    },
    [imageDataUrl, imageFile?.name, isActiveGeneration, startGenerationRequest],
  );

  const analyzeBusinessWithOpenAI = useCallback(
    async (
      sourceInfo: BusinessInfo,
      activeGenerationId: string,
      options: { imageName?: string; imageDataUrl?: string } = {},
    ): Promise<BusinessInfo | null> => {
      const payload = await requestOpenAIBusinessUnderstanding(sourceInfo, activeGenerationId, options);
      if (!payload?.understanding) return null;
      return applyOpenAIUnderstanding(sourceInfo, payload.understanding, activeGenerationId, payload.modelMetadata);
    },
    [applyOpenAIUnderstanding, requestOpenAIBusinessUnderstanding],
  );

  const handleParse = () =>
    runAction(
      "parse",
      async (activeGenerationId) => {
        await analyzeBusinessWithOpenAI(info, activeGenerationId);
      },
      "AI business intelligence extracted - review before generating",
    );

  const removeImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setImageFile(null);
    setImagePreview("");
    setImageDataUrl("");
    setOcrProgress(0);
    setExtractionReviewed(false);
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const importBusinessImage = async (file: File) => {
    const activeGenerationId = generationIdRef.current;
    if (!file.type.startsWith("image/")) {
      toast.error("Choose a PNG, JPG, WebP, or other image file");
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      toast.error("The image must be 12 MB or smaller");
      return;
    }

    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setBusy("image");
    setOcrProgress(0.04);

    try {
      const dataUrl = await readFileAsDataUrl(file);
      if (!isActiveGeneration(activeGenerationId)) return;
      setImageDataUrl(dataUrl);
      const nextInfo = {
        ...info,
        rawInfo: info.rawInfo,
      };
      setOcrProgress(0.35);
      await analyzeBusinessWithOpenAI(nextInfo, activeGenerationId, {
        imageName: file.name,
        imageDataUrl: dataUrl,
      });
      if (!isActiveGeneration(activeGenerationId)) return;
      setOcrProgress(1);
      toast.success("AI vision analyzed the screenshot - review the extracted facts");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      if (!isActiveGeneration(activeGenerationId)) return;
      noteGenerationError(activeGenerationId, "vision", error);
      setOcrProgress(0);
      toast.error(
        error instanceof Error
          ? error.message
          : "AI screenshot extraction failed. Check the provider key and try again.",
      );
    } finally {
      if (isActiveGeneration(activeGenerationId)) setBusy(null);
    }
  };

  const buildGenerationInfo = useCallback(() => {
    const directive = generationDirective(generationMode, businessUnderstanding);

    return {
      ...info,
      rawInfo: [info.rawInfo, directive].filter(Boolean).join("\n\n"),
      notes: [info.notes, directive].filter(Boolean).join("\n\n"),
    };
  }, [businessUnderstanding, generationMode, info]);

  const requestAIWebsiteHTML = useCallback(
    async (sourceInfo: BusinessInfo, activeGenerationId: string) => {
      const response = await fetch("/api/generate-website", {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          generationId: activeGenerationId,
          info: sourceInfo,
          generationMode,
          businessUnderstanding,
        }),
      });
      const payload = (await response.json()) as {
        generationId?: string;
        html?: string;
        modelMetadata?: { stage: string; provider: string; model: string; fallback: boolean };
        error?: string;
      };

      if (payload.generationId !== activeGenerationId || !isActiveGeneration(activeGenerationId)) {
        if (process.env.NODE_ENV !== "production") {
          console.debug(`[generation:${activeGenerationId}] ignored stale website generation response`);
        }
        return null;
      }

      if (!response.ok || !payload.html) {
        throw new Error(payload.error || "AI website generation failed.");
      }

      return {
        html: payload.html,
        modelMetadata: payload.modelMetadata,
      };
    },
    [businessUnderstanding, generationMode, isActiveGeneration],
  );

  const requireGenerationReady = useCallback(() => {
    if (businessUnderstanding && !extractionReviewed) {
      throw new Error("Review and approve the extracted facts before generating the website.");
    }
    if (!info.businessName.trim() || !info.category.trim()) {
      throw new Error("Add or extract the business name and category before generating.");
    }
  }, [businessUnderstanding, extractionReviewed, info.businessName, info.category]);

  const handleGenerateWebsite = () =>
    runAction(
      "website",
      async (activeGenerationId) => {
        requireGenerationReady();
        const nextInfo = buildGenerationInfo();
        const generated = await requestAIWebsiteHTML(nextInfo, activeGenerationId);
        if (!generated) return;
        const nextHtml = generated.html;
        const nextAudit = auditWebsite(nextHtml, nextInfo);
        if (!isActiveGeneration(activeGenerationId)) return;
        const nextPlan: GenerationPlan = {
          generationId: activeGenerationId,
          stage: "planning",
          summary: `${nextInfo.businessName} ${nextInfo.category} website plan`,
          sectionIds: ["full-website"],
        };
        const nextSectionOutputs: SectionOutput[] = [{
          generationId: activeGenerationId,
          sectionId: "full-website",
          type: "full-page",
          html: nextHtml,
          status: "success",
        }];
        setGenerationPlan(nextPlan);
        setSectionOutputs(nextSectionOutputs);
        setSkippedSections([]);
        setGenerationErrors([]);
        setHtml(nextHtml);
        setOutputTab("preview");
        const websiteModelMetadata = generated.modelMetadata;
        const nextModelMetadata = websiteModelMetadata
          ? [...modelMetadata.filter((item) => item.stage !== websiteModelMetadata.stage), websiteModelMetadata]
          : modelMetadata;
        if (websiteModelMetadata) {
          setModelMetadata(nextModelMetadata);
        }
        const prospect = buildProspect({
          info: nextInfo,
          html: nextHtml,
          qualityAudit: nextAudit,
          generationPlan: nextPlan,
          sectionOutputs: nextSectionOutputs,
          modelMetadata: nextModelMetadata,
        });
        saveProspect(prospect);
        setProspectId(prospect.id);
        if (!nextAudit.passed) {
          toast.warning(`Quality audit needs review: ${nextAudit.score}/100`);
        }
      },
      "Website generated from reviewed business intelligence",
    );

  const handleGenerateMessages = () =>
    runAction(
      "message",
      (activeGenerationId) => {
        if (!isActiveGeneration(activeGenerationId)) return;
        setMessages(generateSalesMessages(info, tone, DEFAULT_SETTINGS));
      },
      "Outreach messages generated",
    );

  const handleGenerateBoth = () =>
    runAction(
      "both",
      async (activeGenerationId) => {
        requireGenerationReady();
        const nextInfo = buildGenerationInfo();
        const generated = await requestAIWebsiteHTML(nextInfo, activeGenerationId);
        if (!generated) return;
        const nextHtml = generated.html;
        const nextMessages = generateSalesMessages(nextInfo, tone, DEFAULT_SETTINGS);
        const nextAudit = auditWebsite(nextHtml, nextInfo);
        if (!isActiveGeneration(activeGenerationId)) return;
        const nextPlan: GenerationPlan = {
          generationId: activeGenerationId,
          stage: "planning",
          summary: `${nextInfo.businessName} ${nextInfo.category} website and outreach plan`,
          sectionIds: ["full-website"],
        };
        const nextSectionOutputs: SectionOutput[] = [{
          generationId: activeGenerationId,
          sectionId: "full-website",
          type: "full-page",
          html: nextHtml,
          status: "success",
        }];
        setGenerationPlan(nextPlan);
        setSectionOutputs(nextSectionOutputs);
        setSkippedSections([]);
        setGenerationErrors([]);
        setHtml(nextHtml);
        setMessages(nextMessages);
        setOutputTab("preview");
        const websiteModelMetadata = generated.modelMetadata;
        const nextModelMetadata = websiteModelMetadata
          ? [...modelMetadata.filter((item) => item.stage !== websiteModelMetadata.stage), websiteModelMetadata]
          : modelMetadata;
        if (websiteModelMetadata) {
          setModelMetadata(nextModelMetadata);
        }
        const prospect = buildProspect({
          info: nextInfo,
          html: nextHtml,
          messages: nextMessages,
          qualityAudit: nextAudit,
          generationPlan: nextPlan,
          sectionOutputs: nextSectionOutputs,
          modelMetadata: nextModelMetadata,
        });
        saveProspect(prospect);
        setProspectId(prospect.id);
        if (!nextAudit.passed) {
          toast.warning(`Quality audit needs review: ${nextAudit.score}/100`);
        }
      },
      "Website and outreach kit generated from reviewed intelligence",
    );

  const buildProspect = (overrides: {
    info?: BusinessInfo;
    html?: string;
    messages?: SalesMessages | null;
    qualityAudit?: QualityAudit | null;
    generationPlan?: GenerationPlan | null;
    sectionOutputs?: SectionOutput[];
    modelMetadata?: Array<{
      stage: string;
      provider: string;
      model: string;
      fallback: boolean;
    }>;
  } = {}): Prospect => {
    const now = new Date().toISOString();
    const prospectInfo = overrides.info ?? info;
    const prospectHtml = overrides.html ?? html;
    const prospectMessages = overrides.messages ?? messages;
    const prospectAudit = overrides.qualityAudit ?? qualityAudit;
    const prospectGenerationPlan = overrides.generationPlan ?? generationPlan;
    const prospectSectionOutputs = overrides.sectionOutputs ?? sectionOutputs;
    const prospectModelMetadata = overrides.modelMetadata ?? modelMetadata;
    const canPersistScreenshot = Boolean(imageDataUrl && imageDataUrl.length <= 750_000);
    return {
      id: prospectId ?? crypto.randomUUID(),
      business_name: prospectInfo.businessName || "Untitled prospect",
      category: prospectInfo.category,
      location: prospectInfo.location,
      phone: prospectInfo.phone,
      email: prospectInfo.email,
      website_url: prospectInfo.websiteUrl,
      social_url: prospectInfo.socialUrl,
      source: imageFile ? `Image import: ${imageFile.name}` : prospectInfo.rawInfo ? "Pasted business info" : "Manual entry",
      pasted_raw_info: prospectInfo.rawInfo,
      extracted_summary: [
        prospectInfo.businessName,
        prospectInfo.category,
        prospectInfo.location,
        prospectInfo.services && `Services: ${prospectInfo.services}`,
      ]
        .filter(Boolean)
        .join(". "),
      package_price: prospectInfo.packagePrice,
      deal_value: prospectInfo.packagePrice,
      lead_score: leadScore.score,
      lead_temperature: leadScore.temperature,
      lead_score_explanation: leadScore.explanation.join(" "),
      recommended_sales_angle: leadScore.recommendedAngle,
      business_intelligence: {
        ...intelligence,
        generationId,
        extractionReportMarkdown: businessReport,
        screenshotName: imageFile?.name ?? "",
        screenshotDataUrl: canPersistScreenshot ? imageDataUrl : "",
        screenshotSaved: canPersistScreenshot,
        generationMode,
        extractionReviewed,
        generationPlan: prospectGenerationPlan,
        sectionOutputs: prospectSectionOutputs,
        skippedSections,
        generationErrors,
        modelMetadata: prospectModelMetadata,
      },
      website_quality_audit: prospectAudit,
      generated_website_html: prospectHtml,
      demo_url: prospectInfo.demoUrl,
      whatsapp_message: prospectMessages?.whatsapp ?? "",
      email_subject: prospectMessages?.emailSubject ?? "",
      email_message: prospectMessages?.email ?? "",
      dm_message: prospectMessages?.dm ?? "",
      facebook_message: prospectMessages?.facebook ?? "",
      follow_up_1_message: prospectMessages?.followUp ?? "",
      follow_up_2_message: prospectMessages?.followUp2 ?? "",
      final_check_in_message: prospectMessages?.finalFollowUp ?? "",
      outreach_status: statusAfterMilestone({
        generated_website_html: prospectHtml,
        demo_url: prospectInfo.demoUrl,
        whatsapp_message: prospectMessages?.whatsapp ?? "",
        email_message: prospectMessages?.email ?? "",
        dm_message: prospectMessages?.dm ?? "",
        extracted_summary: prospectInfo.businessName || prospectInfo.category || prospectInfo.location,
        outreach_status: "new",
      } as Prospect),
      notes: prospectInfo.notes,
      follow_up_count: 0,
      created_at: now,
      updated_at: now,
      last_contacted_at: null,
      next_follow_up_at: null,
    };
  };

  const handleSave = () =>
    runAction(
      "save",
      () => {
        const prospect = buildProspect();
        saveProspect(prospect);
        setProspectId(prospect.id);
      },
      prospectId ? "Prospect updated" : "Prospect saved",
    );

  const copyText = async (value: string, label: string) => {
    if (!value) {
      toast.error(`Generate or add ${label.toLowerCase()} first`);
      return;
    }
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  };

  const downloadHtml = () => {
    if (!html) {
      toast.error("Generate the website first");
      return;
    }
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = "index.html";
    anchor.click();
    URL.revokeObjectURL(href);
    toast.success("index.html downloaded");
  };

  const downloadBusinessReport = () => {
    if (!businessReport) {
      toast.error("Run extraction or generate a website first");
      return;
    }
    const blob = new Blob([businessReport], { type: "text/markdown;charset=utf-8" });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = "business-intelligence-report.md";
    anchor.click();
    URL.revokeObjectURL(href);
    toast.success("business-intelligence-report.md downloaded");
  };

  const openWhatsApp = () => {
    const phone = phoneDigits(info.phone);
    if (!phone || !messages?.whatsapp) {
      toast.error("Add a phone number and generate the WhatsApp message first");
      return;
    }
    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(messages.whatsapp)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const openEmail = () => {
    if (!info.email || !messages?.email) {
      toast.error("Add an email address and generate the email first");
      return;
    }
    window.location.href = `mailto:${info.email}?subject=${encodeURIComponent(messages.emailSubject)}&body=${encodeURIComponent(messages.email)}`;
  };

  const markSent = () => {
    const nextDate = nextFollowUpDate(0);
    if (!prospectId) {
      const prospect = buildProspect();
      saveProspect({
        ...prospect,
        outreach_status: "contacted",
        last_contacted_at: new Date().toISOString(),
        next_follow_up_at: nextDate,
        follow_up_count: 1,
      });
      setProspectId(prospect.id);
    } else {
      setStatus(prospectId, "contacted");
      updateProspect(prospectId, {
        next_follow_up_at: nextDate,
        follow_up_count: 1,
      });
    }
    setConfirmSent(false);
    toast.success("Outreach marked as sent");
  };

  const handleDeploy = async () => {
    if (!html) {
      toast.error("Generate the website before deploying");
      return;
    }
    if (qualityAudit && !qualityAudit.passed) {
      toast.warning("Quality audit has warnings. Review them before sending this live.");
    }
    setBusy("deploy");
    const result = await deployGeneratedWebsite({
      businessName: info.businessName || names.project,
      html,
    });
    setBusy(null);

    if (result.ok && result.url) {
      updateInfo("demoUrl", result.url);
      toast.success("Website deployed and live URL added");
      return;
    }

    if (result.status === "setup_required") {
      toast.info(`Deployment setup required: ${(result.missing ?? []).join(", ")}`);
    } else {
      toast.error(result.message);
    }
  };

  const activeMessage = messages?.[messageTab] ?? "";
  const actionInProgress = Boolean(busy);
  const generationNeedsReview = Boolean(businessUnderstanding && !extractionReviewed);
  const generationDisabled = actionInProgress || generationNeedsReview;

  return (
    <div className="space-y-7">
      <PageHeading
        eyebrow="Website workspace"
        title="Create a production-ready site"
        description="Paste what you have, shape the facts, generate the website, then prepare outreach for manual approval."
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => resetGenerationState("Started a fresh generation")}>
              <RotateCcw className="size-4" />
              New Generation
            </Button>
            <Button variant="outline" onClick={handleSave} loading={busy === "save"} disabled={actionInProgress && busy !== "save"}>
              <Save className="size-4" />
              Save Prospect
            </Button>
            <Button onClick={handleGenerateBoth} loading={busy === "both"} disabled={generationDisabled}>
              <WandSparkles className="size-4" />
              Generate Website + Message
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {[
          ["01", "Import or paste", "Use a screenshot, photo, listing, or notes."],
          ["02", "Generate and review", "Create the site and personalized copy."],
          ["03", "Deploy and contact", "Add the URL, approve, then open a draft."],
        ].map(([number, title, text], index) => (
          <div
            key={number}
            className={cn(
              "flex items-center gap-4 rounded-2xl border p-4",
              index === 0 ? "border-brand-200 bg-brand-50/60" : "border-[#e7e8ef] bg-white",
            )}
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-xs font-extrabold text-brand-700 shadow-sm">
              {number}
            </span>
            <div>
              <p className="text-sm font-bold">{title}</p>
              <p className="mt-0.5 text-xs text-[#858b9d]">{text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(280px,.72fr)_minmax(0,1fr)_minmax(280px,.72fr)]">
        <Card className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <SectionLabel>Launch readiness</SectionLabel>
              <h2 className="mt-1 text-lg font-extrabold tracking-[-0.035em]">
                {recommendedAction}
              </h2>
            </div>
            <span
              className={cn(
                "rounded-full px-3 py-1 text-xs font-extrabold",
                launchReadiness >= 85
                  ? "bg-emerald-50 text-emerald-700"
                  : launchReadiness >= 55
                    ? "bg-amber-50 text-amber-700"
                    : "bg-slate-100 text-slate-600",
              )}
            >
              {launchReadiness}%
            </span>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#eeeef4]">
            <div className="h-full rounded-full bg-brand-600" style={{ width: `${launchReadiness}%` }} />
          </div>
          <div className="mt-4 space-y-2">
            {readinessChecks.slice(0, 4).map((check) => (
              <ReadinessRow key={check.label} check={check} />
            ))}
          </div>
          <div className="mt-4 rounded-2xl border border-[#ececf2] bg-[#fafafd] p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[0.65rem] font-bold tracking-[0.12em] text-[#9a9faf] uppercase">Lead score</span>
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-[0.68rem] font-extrabold",
                  leadScore.temperature === "Hot"
                    ? "bg-rose-50 text-rose-700"
                    : leadScore.temperature === "Warm"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-slate-100 text-slate-600",
                )}
              >
                {leadScore.temperature}
              </span>
            </div>
            <div className="mt-2 flex items-end gap-2">
              <span className="text-3xl font-black tracking-[-0.08em] text-ink-950">{leadScore.score}</span>
              <span className="pb-1 text-xs font-bold text-[#858b9d]">/ 100</span>
            </div>
            <p className="mt-2 text-xs leading-5 text-[#747b8f]">{leadScore.recommendedAngle}</p>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-start gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-brand-50 text-brand-600">
              <Target className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="font-extrabold tracking-[-0.025em]">Business intelligence</h2>
              <p className="mt-1 text-xs leading-5 text-[#858b9d]">{intelligence.summary}</p>
            </div>
            <Button variant="outline" onClick={downloadBusinessReport} disabled={!businessReport}>
              <Download className="size-4" />
              Report
            </Button>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <Insight label="Best CTA" value={intelligence.bestCta} />
            <Insight label="Suggested package" value={intelligence.suggestedPackage} />
            <Insight label="Price range" value={intelligence.suggestedPriceRange} />
            <Insight label="Likely weakness" value={intelligence.onlineWeakness} />
          </div>
          <div className="mt-4 grid gap-3 rounded-2xl border border-[#eef0f5] bg-[#fafafd] p-3 md:grid-cols-4">
            <Insight
              label="Detected name"
              value={
                businessUnderstanding
                  ? `${businessUnderstanding.selectedBusinessName || "Your Business Name"} (${businessUnderstanding.businessNameConfidence}/100)`
                  : "Run extraction first"
              }
            />
            <Insight
              label="Industry"
              value={
                businessUnderstanding
                  ? `${businessUnderstanding.industry.primaryIndustry} (${businessUnderstanding.industry.confidence}/100)`
                  : "Not classified yet"
              }
            />
            <Insight
              label="Website category"
              value={businessUnderstanding?.industry.category.label || "Not assigned yet"}
            />
            <Insight
              label="Theme"
              value={
                businessUnderstanding
                  ? `${businessUnderstanding.theme.variation} / ${businessUnderstanding.theme.palette.join(", ")}`
                  : "Waiting for category"
              }
            />
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
              <ShieldCheck className="size-4" />
            </span>
            <div>
              <h2 className="font-extrabold tracking-[-0.025em]">Fact safety ledger</h2>
              <p className="mt-1 text-xs leading-5 text-[#858b9d]">
                Keep the demo persuasive without turning guesses into visible claims.
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-2">
            <FactPill label="Business name" value={info.businessName || "Add before launch"} state={valueState(info.businessName)} />
            <FactPill label="Contact route" value={contactSummary(info) || "Add phone, email, or social"} state={contactSummary(info) ? "Verified" : "Missing"} />
            <FactPill label="Services" value={info.services || info.category || "Clarify the offer"} state={info.services || info.category ? "Verified" : "Missing"} />
            <FactPill label="Demo URL" value={info.demoUrl || "Needed before outreach"} state={info.demoUrl ? "Verified" : "Missing"} />
          </div>
          <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
            {pendingChecks.length
              ? `${pendingChecks.length} item${pendingChecks.length === 1 ? "" : "s"} still need attention before this is outreach-ready.`
              : "All core launch checks are ready. Manual approval is still required before sending."}
          </div>
        </Card>
      </div>

      <div className="grid items-start gap-5 2xl:grid-cols-[minmax(380px,.75fr)_minmax(0,1.25fr)]">
        <div className="space-y-5">
          <Card className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <SectionLabel>Source information</SectionLabel>
                <h2 className="mt-2 text-xl font-extrabold tracking-[-0.035em]">Import business info</h2>
                <p className="mt-1 text-xs leading-5 text-[#7f8597]">
                  Import a screenshot or paste mixed details. Review the extracted facts before generating.
                </p>
              </div>
              <Clipboard className="size-5 text-[#a3a8b7]" />
            </div>

            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void importBusinessImage(file);
              }}
            />

            {imagePreview ? (
              <div className="mt-5 overflow-hidden rounded-2xl border border-brand-200 bg-brand-50/50">
                <div className="relative aspect-[16/9] overflow-hidden bg-white">
                  <div
                    role="img"
                    aria-label={`Imported screenshot: ${imageFile?.name ?? "business image"}`}
                    className="absolute inset-0 bg-contain bg-center bg-no-repeat"
                    style={{ backgroundImage: `url("${imagePreview}")` }}
                  />
                  <button
                    type="button"
                    className="absolute top-3 right-3 grid size-9 place-items-center rounded-xl border border-white/70 bg-white/92 text-[#596075] shadow-lg hover:bg-white hover:text-ink-950"
                    onClick={removeImage}
                    aria-label="Remove imported screenshot"
                    disabled={busy === "image"}
                  >
                    <X className="size-4" />
                  </button>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-ink-950">
                        {imageFile?.name}
                      </p>
                      <p className="mt-1 text-[0.7rem] text-[#7d8496]">
                        {busy === "image"
                          ? `AI analyzing screenshot - ${Math.round(ocrProgress * 100)}%`
                          : ocrProgress === 1
                            ? "AI analysis complete - review the populated fields below"
                            : "Screenshot ready - analyze again or try a clearer crop"}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => imageFile && void importBusinessImage(imageFile)}
                      loading={busy === "image"}
                      disabled={!imageFile || actionInProgress}
                    >
                      <ScanText className="size-4" />
                      Analyze Again
                    </Button>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white">
                    <div
                      className="h-full rounded-full bg-brand-500 transition-[width]"
                      style={{
                        width: `${
                          ocrProgress
                            ? Math.max(ocrProgress * 100, busy === "image" ? 6 : 0)
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className={cn(
                  "mt-5 flex min-h-44 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-8 text-center",
                  isDraggingImage
                    ? "border-brand-500 bg-brand-50"
                    : "border-[#dfe3d8] bg-[#fbfcf8] hover:border-brand-300 hover:bg-brand-50/55",
                )}
                onClick={() => imageInputRef.current?.click()}
                onDragEnter={(event) => {
                  event.preventDefault();
                  setIsDraggingImage(true);
                }}
                onDragOver={(event) => event.preventDefault()}
                onDragLeave={(event) => {
                  event.preventDefault();
                  if (event.currentTarget === event.target) setIsDraggingImage(false);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  setIsDraggingImage(false);
                  const file = event.dataTransfer.files?.[0];
                  if (file) void importBusinessImage(file);
                }}
              >
                <span className="grid size-12 place-items-center rounded-2xl bg-white text-brand-600 shadow-sm">
                  <ImageUp className="size-5" />
                </span>
                <span className="mt-4 text-sm font-extrabold text-ink-950">
                  Upload a business screenshot or photo
                </span>
                <span className="mt-1 max-w-sm text-xs leading-5 text-[#7f8597]">
                  Click or drag an image here. AI vision analyzes it and fills the profile for review.
                </span>
                <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[0.68rem] font-bold text-[#697084] shadow-sm">
                  <FileImage className="size-3.5 text-brand-600" />
                  PNG, JPG or WebP - 12 MB max
                </span>
              </button>
            )}

            <div className="my-5 flex items-center gap-3 text-[0.66rem] font-bold tracking-[0.12em] text-[#9a9faf] uppercase">
              <span className="h-px flex-1 bg-[#e8e9ef]" />
              Or paste text
              <span className="h-px flex-1 bg-[#e8e9ef]" />
            </div>
            <label className="mt-5 block">
              <span className="sr-only">Paste business information</span>
              <textarea
                className="field-input min-h-56 resize-y leading-6"
                value={info.rawInfo}
                onChange={(event) => updateInfo("rawInfo", event.target.value)}
                placeholder={"Example:\nBusiness: North Coast Auto Care\nLocation: St. Ann\nWhatsApp: +1 876...\nServices: diagnostics, brakes, servicing\nInstagram: https://..."}
              />
            </label>
            <Button
              variant="outline"
              className="mt-3 w-full"
              onClick={handleParse}
              loading={busy === "parse"}
              disabled={!info.rawInfo.trim() || actionInProgress}
            >
              <Sparkles className="size-4 text-brand-600" />
              Parse Business Info
            </Button>
            <Button
              variant="outline"
              className="mt-2 w-full"
              onClick={() => resetGenerationState("Current generation data cleared")}
              disabled={actionInProgress && busy !== "image" && busy !== "parse"}
            >
              <X className="size-4" />
              Clear Current Data
            </Button>
          </Card>

          <Card className="p-5 sm:p-6">
            <SectionHeader
              icon={<FileCode2 className="size-4" />}
              title="Business profile"
              description="Only verified details should become visible claims."
            />
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Business name" value={info.businessName} onChange={(value) => updateInfo("businessName", value)} />
              <Field id="business-category-field" label="Business category" value={info.category} onChange={(value) => updateInfo("category", value)} />
              <Field label="Location" value={info.location} onChange={(value) => updateInfo("location", value)} />
              <Field label="Phone / WhatsApp" value={info.phone} onChange={(value) => updateInfo("phone", value)} />
              <Field label="Email" type="email" value={info.email} onChange={(value) => updateInfo("email", value)} />
              <Field label="Existing website" type="url" value={info.websiteUrl} onChange={(value) => updateInfo("websiteUrl", value)} />
              <Field label="Social media link" type="url" value={info.socialUrl} onChange={(value) => updateInfo("socialUrl", value)} />
              <Field label="Brand colors" value={info.brandColors} onChange={(value) => updateInfo("brandColors", value)} placeholder="#4f46e5, #14b8a6" />
            </div>
            <div className="mt-4 space-y-4">
              <TextField label="Services / products" value={info.services} onChange={(value) => updateInfo("services", value)} />
              <TextField label="Observed opportunity / pain point" value={info.painPoints} onChange={(value) => updateInfo("painPoints", value)} />
              <TextField label="Internal notes" value={info.notes} onChange={(value) => updateInfo("notes", value)} />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Package price" value={info.packagePrice} onChange={(value) => updateInfo("packagePrice", value)} />
              <Field label="Live site URL" type="url" value={info.demoUrl} onChange={(value) => updateInfo("demoUrl", value)} placeholder="https://business-name.vercel.app" />
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            <SectionHeader
              icon={<MousePointerClick className="size-4" />}
              title="Generate"
              description="Generate only after extracted facts are reviewed and approved."
            />
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <Button variant="outline" onClick={handleGenerateWebsite} loading={busy === "website"} disabled={generationDisabled}>
                <Globe2 className="size-4" />
                Generate Website
              </Button>
              <Button variant="outline" onClick={handleGenerateMessages} loading={busy === "message"} disabled={actionInProgress}>
                <MessageCircle className="size-4" />
                Generate Sales Message
              </Button>
              <Button className="sm:col-span-2" onClick={handleGenerateBoth} loading={busy === "both"} disabled={generationDisabled}>
                <WandSparkles className="size-4" />
                Generate Website + Message
              </Button>
            </div>
          </Card>

          {businessUnderstanding ? (
            <Card className="p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <SectionHeader
                  icon={extractionReviewed ? <CheckCircle2 className="size-4" /> : <AlertTriangle className="size-4" />}
                  title={extractionReviewed ? "Extraction approved" : "Extraction review"}
                  description="Quick-check the fields that drive the generated site."
                />
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2.5 py-1 text-[0.65rem] font-extrabold",
                    extractionReviewed ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700",
                  )}
                >
                  {extractionReviewed ? "Approved" : "Needs review"}
                </span>
              </div>

              <div className="mt-4 space-y-2">
                {extractionReviewItems.slice(0, 4).map((item) => (
                  <ConfidenceReviewRow key={item.label} compact {...item} />
                ))}
              </div>

              {extractionWarnings.length ? (
                <details className="mt-3 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  <summary className="cursor-pointer font-extrabold">Warnings ({extractionWarnings.length})</summary>
                  <ul className="mt-2 space-y-1 leading-5">
                    {extractionWarnings.map((warning) => (
                      <li key={warning}>- {warning}</li>
                    ))}
                  </ul>
                </details>
              ) : null}

              <details className="mt-3 rounded-xl border border-[#ececf2] bg-[#fafafd] px-3 py-2 text-xs text-[#687083]">
                <summary className="cursor-pointer font-extrabold text-[#4b5565]">Advanced review controls</summary>
                {businessUnderstanding.businessNameCandidates.length ? (
                  <div className="mt-3">
                    <div className="text-[0.62rem] font-bold tracking-[0.12em] text-[#9a9faf] uppercase">Name candidates</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {businessUnderstanding.businessNameCandidates.slice(0, 4).map((candidate) => (
                        <button
                          key={candidate.value}
                          type="button"
                          className="rounded-full border border-[#e1e3eb] bg-white px-2.5 py-1 text-[0.7rem] font-bold text-[#60687a] hover:border-brand-200 hover:text-brand-700"
                          onClick={() => updateInfo("businessName", candidate.value)}
                        >
                          {candidate.value} ({candidate.score})
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
                <div className="mt-3">
                  <div className="text-[0.62rem] font-bold tracking-[0.12em] text-[#9a9faf] uppercase">Regenerate direction</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {generationModes.map((mode) => (
                      <button
                        key={mode.key}
                        type="button"
                        className={cn(
                          "rounded-lg border px-2.5 py-1.5 text-[0.7rem] font-extrabold",
                          generationMode === mode.key
                            ? "border-brand-300 bg-brand-50 text-brand-700"
                            : "border-[#e4e6ee] bg-white text-[#747b8f] hover:border-brand-200",
                        )}
                        onClick={() => setGenerationMode(mode.key)}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>
              </details>

              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (imageFile) void importBusinessImage(imageFile);
                    else handleParse();
                  }}
                  loading={busy === "image" || busy === "parse"}
                  disabled={actionInProgress}
                >
                  <ScanText className="size-4" />
                  Fix
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    document.getElementById("business-category-field")?.focus();
                    setExtractionReviewed(false);
                    toast.info("Edit the category, then approve review again.");
                  }}
                  disabled={actionInProgress}
                >
                  <SlidersHorizontal className="size-4" />
                  Category
                </Button>
                <Button onClick={() => setExtractionReviewed(true)} disabled={actionInProgress}>
                  <CheckCircle2 className="size-4" />
                  Approve
                </Button>
              </div>
            </Card>
          ) : null}
        </div>

        <div className="min-w-0 space-y-5 2xl:sticky 2xl:top-8">
          <Card className="overflow-hidden">
            <div className="flex flex-col justify-between gap-4 border-b border-[#e9eaf0] px-5 py-4 sm:flex-row sm:items-center sm:px-6">
              <div>
                <SectionLabel>Website generator output</SectionLabel>
                <h2 className="mt-1 text-lg font-extrabold tracking-[-0.035em]">Production-ready website</h2>
                <p className="mt-1 font-mono text-[0.65rem] text-[#9a9faf]">
                  Active generation: {generationId.slice(0, 8)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={() => resetGenerationState("Started a clean generation")}>
                  <RotateCcw className="size-4" />
                  New Generation
                </Button>
                <div className="flex rounded-xl bg-[#f1f1f5] p-1">
                  <TabButton active={outputTab === "preview"} onClick={() => setOutputTab("preview")}>
                    <Globe2 className="size-3.5" /> Preview
                  </TabButton>
                  <TabButton active={outputTab === "code"} onClick={() => setOutputTab("code")}>
                    <Code2 className="size-3.5" /> HTML
                  </TabButton>
                </div>
              </div>
            </div>

            {html ? (
              <>
                {outputTab === "preview" ? (
                  <div className="bg-[#ececf2] p-3 sm:p-5">
                    <div className="overflow-hidden rounded-xl border border-[#dfe0e7] bg-white shadow-[0_16px_40px_rgba(21,26,45,.12)]">
                      <div className="flex h-10 items-center gap-2 border-b border-[#ececf2] bg-white px-4">
                        <span className="size-2.5 rounded-full bg-red-400" />
                        <span className="size-2.5 rounded-full bg-amber-400" />
                        <span className="size-2.5 rounded-full bg-emerald-400" />
                        <div className="ml-2 flex-1 truncate rounded-md bg-[#f4f4f7] px-3 py-1 text-center text-[0.65rem] text-[#8a90a2]">
                          {info.demoUrl || `${names.project}.vercel.app`}
                        </div>
                      </div>
                      <iframe
                        title="Generated website preview"
                        srcDoc={previewHtml}
                        sandbox=""
                        scrolling="no"
                        tabIndex={-1}
                        referrerPolicy="no-referrer"
                        className="pointer-events-none h-[620px] w-full select-none bg-white"
                      />
                    </div>
                  </div>
                ) : (
                  <pre className="scrollbar-thin max-h-[670px] overflow-auto bg-[#161a2b] p-5 text-xs leading-6 text-[#dce0f0]">
                    <code>{html}</code>
                  </pre>
                )}
                <div className="grid gap-3 border-t border-[#e9eaf0] p-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end sm:p-5">
                  <div>
                    <label className="field-label" htmlFor="demo-url-output">Live site URL</label>
                    <input
                      id="demo-url-output"
                      type="url"
                      className="field-input"
                      value={info.demoUrl}
                      onChange={(event) => updateInfo("demoUrl", event.target.value)}
                      placeholder="Paste the deployed Vercel link"
                    />
                  </div>
                  <Button variant="outline" onClick={() => copyText(html, "Website HTML")}>
                    <Copy className="size-4" />
                    Copy HTML
                  </Button>
                  <Button variant="secondary" onClick={downloadHtml}>
                    <Download className="size-4" />
                    Download
                  </Button>
                </div>
                <div className="grid gap-2 border-t border-[#eff0f4] bg-[#fafafd] px-5 py-4 text-xs sm:grid-cols-3">
                  <OutputName label="Folder" value={names.folder} />
                  <OutputName label="Vercel project" value={names.project} />
                  <OutputName label="File" value={names.file} />
                </div>
                <div className="border-t border-[#eff0f4] p-5">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <ListChecks className="size-4 text-brand-600" />
                        <h3 className="text-sm font-extrabold">Website quality audit</h3>
                      </div>
                      <p className="mt-1 text-xs text-[#858b9d]">
                        {qualityAudit
                          ? `${qualityAudit.score}/100 ${qualityAudit.passed ? "ready with review" : "needs review"}`
                          : "Generate a website to run the checklist."}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" onClick={() => resetGenerationState("Current generation data cleared")}>
                        <X className="size-4" />
                        Clear Current Data
                      </Button>
                      <Button onClick={handleDeploy} loading={busy === "deploy"} disabled={!html || actionInProgress}>
                      <Rocket className="size-4" />
                      Deploy Website
                      </Button>
                    </div>
                  </div>
                  {qualityAudit ? (
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      {qualityAudit.items.map((check) => (
                        <div
                          key={check.label}
                          className={cn(
                            "rounded-xl border p-3 text-xs",
                            check.passed
                              ? "border-emerald-100 bg-emerald-50 text-emerald-800"
                              : "border-amber-200 bg-amber-50 text-amber-800",
                          )}
                        >
                          <div className="font-bold">{check.passed ? "Pass" : "Review"}: {check.label}</div>
                          <p className="mt-1 leading-5 opacity-80">{check.detail}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </>
            ) : (
              <div className="grid min-h-[520px] place-items-center px-6 py-14 text-center">
                <div>
                  <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                    <Globe2 className="size-6" />
                  </div>
                  <h3 className="mt-5 text-lg font-extrabold tracking-[-0.03em]">Your preview will appear here</h3>
                  <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#7a8194]">
                    Add the business details, then generate a complete single-file website with production-minded metadata.
                  </p>
                  <Button className="mt-5" onClick={handleGenerateWebsite} loading={busy === "website"} disabled={generationDisabled}>
                    <Sparkles className="size-4" />
                    Generate Website
                  </Button>
                </div>
              </div>
            )}
          </Card>

          <Card className="overflow-hidden">
            <div className="flex flex-col justify-between gap-4 border-b border-[#e9eaf0] px-5 py-4 sm:flex-row sm:items-center sm:px-6">
              <div>
                <SectionLabel>Sales message generator</SectionLabel>
                <h2 className="mt-1 text-lg font-extrabold tracking-[-0.035em]">Personalized outreach</h2>
              </div>
              <label className="relative">
                <span className="sr-only">Message tone</span>
                <select
                  className="field-input min-h-10 appearance-none py-2 pr-9 text-xs font-semibold"
                  value={tone}
                  onChange={(event) => {
                    const nextTone = event.target.value as MessageTone;
                    setTone(nextTone);
                    if (messages) setMessages(generateSalesMessages(info, nextTone, DEFAULT_SETTINGS));
                  }}
                >
                  {TONES.map((option) => <option key={option}>{option}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-3.5 -translate-y-1/2 text-[#8a90a2]" />
              </label>
            </div>
            <div className="scrollbar-thin flex gap-1 overflow-x-auto border-b border-[#e9eaf0] px-3 pt-3 sm:px-5">
              {messageTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  className={cn(
                    "border-b-2 px-3 py-2.5 text-xs font-bold whitespace-nowrap",
                    messageTab === tab.key
                      ? "border-brand-600 text-brand-700"
                      : "border-transparent text-[#858b9c] hover:text-ink-950",
                  )}
                  onClick={() => setMessageTab(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {messages ? (
              <>
                {messageTab === "email" ? (
                  <div className="border-b border-[#eff0f4] px-5 py-3 text-xs">
                    <span className="font-bold text-[#656c7f]">Subject:</span>{" "}
                    <span className="text-[#777e90]">{messages.emailSubject}</span>
                    <button
                      type="button"
                      className="ml-2 font-bold text-brand-600"
                      onClick={() => copyText(messages.emailSubject, "Email subject")}
                    >
                      Copy
                    </button>
                  </div>
                ) : null}
                <textarea
                  className="scrollbar-thin min-h-64 w-full resize-y border-0 bg-white p-5 text-sm leading-6 text-[#3f4659] outline-none sm:p-6"
                  value={activeMessage}
                  onChange={(event) =>
                    setMessages((current) =>
                      current ? { ...current, [messageTab]: event.target.value } : current,
                    )
                  }
                  aria-label={`${messageTabs.find((tab) => tab.key === messageTab)?.label} message`}
                />
                <div className="flex flex-wrap gap-2 border-t border-[#e9eaf0] p-4 sm:p-5">
                  <Button variant="outline" onClick={() => copyText(activeMessage, "Sales message")}>
                    <Copy className="size-4" />
                    Copy Message
                  </Button>
                  <Button variant="outline" onClick={() => copyText(info.demoUrl, "Site link")}>
                    <ExternalLink className="size-4" />
                    Copy Site Link
                  </Button>
                  <Button variant="outline" onClick={openWhatsApp}>
                    <MessageCircle className="size-4" />
                    Open WhatsApp
                  </Button>
                  <Button variant="outline" onClick={openEmail}>
                    <Mail className="size-4" />
                    Open Email Draft
                  </Button>
                  <Button variant="secondary" className="sm:ml-auto" onClick={() => setConfirmSent(true)}>
                    <Send className="size-4" />
                    Mark as Sent
                  </Button>
                </div>
              </>
            ) : (
              <div className="grid min-h-72 place-items-center px-6 py-12 text-center">
                <div>
                  <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-mint-50 text-emerald-600">
                    <MessageCircle className="size-5" />
                  </div>
                  <h3 className="mt-4 font-extrabold tracking-[-0.025em]">No messages generated yet</h3>
                  <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#7a8194]">
                    Create channel-specific outreach with a clear concept disclosure and no fake urgency.
                  </p>
                  <Button variant="outline" className="mt-5" onClick={handleGenerateMessages} loading={busy === "message"} disabled={actionInProgress}>
                    <Sparkles className="size-4" />
                    Generate Sales Messages
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      <div className="sticky bottom-3 z-20 flex flex-col gap-2 rounded-2xl border border-white/70 bg-white/90 p-3 shadow-[0_18px_60px_rgba(21,26,45,.16)] backdrop-blur-xl sm:flex-row sm:items-center">
        <div className="hidden flex-1 items-center gap-3 px-2 text-xs text-[#72798c] sm:flex">
          <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
            <Route className="size-4" />
          </span>
          <span>
            <strong className="text-ink-950">Next:</strong> {recommendedAction}. Manual approval remains required before sending.
          </span>
        </div>
        <Button variant="outline" onClick={() => resetGenerationState("Started a fresh generation")}>
          <RotateCcw className="size-4" />
          New Generation
        </Button>
        <Button variant="outline" onClick={handleSave} loading={busy === "save"} disabled={actionInProgress && busy !== "save"}>
          <Save className="size-4" />
          Save Prospect
        </Button>
        <Button onClick={handleGenerateBoth} loading={busy === "both"} disabled={generationDisabled}>
          <WandSparkles className="size-4" />
          Generate Website + Message
        </Button>
      </div>

      <ConfirmModal
        open={confirmSent}
        title="Mark this outreach as sent?"
        description="This only updates the prospect status. Seraphim does not send messages automatically."
        confirmLabel="Mark as sent"
        onCancel={() => setConfirmSent(false)}
        onConfirm={markSent}
      />
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
        {icon}
      </span>
      <div>
        <h2 className="font-extrabold tracking-[-0.025em]">{title}</h2>
        <p className="mt-1 text-xs text-[#858b9d]">{description}</p>
      </div>
    </div>
  );
}

function Insight({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#ececf2] bg-[#fafafd] p-3">
      <div className="text-[0.62rem] font-bold tracking-[0.12em] text-[#9a9faf] uppercase">{label}</div>
      <div className="mt-2 text-xs leading-5 font-semibold text-[#555d70]">{value}</div>
    </div>
  );
}

function ReadinessRow({ check }: { check: ReadinessCheck }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-[#ececf2] bg-white p-2.5">
      <span
        className={cn(
          "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full",
          check.passed ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600",
        )}
      >
        {check.passed ? <CheckCircle2 className="size-3.5" /> : <Sparkles className="size-3.5" />}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-extrabold text-ink-950">{check.label}</p>
        <p className="mt-0.5 line-clamp-2 text-[0.72rem] leading-4 text-[#7b8294]">{check.detail}</p>
      </div>
    </div>
  );
}

function FactPill({
  label,
  value,
  state,
}: {
  label: string;
  value: string;
  state: "Verified" | "Missing";
}) {
  return (
    <div className="grid gap-2 rounded-xl border border-[#ececf2] bg-[#fafafd] p-3 sm:grid-cols-[92px_minmax(0,1fr)_auto] sm:items-center">
      <span className="text-[0.65rem] font-bold tracking-[0.12em] text-[#9a9faf] uppercase">{label}</span>
      <span className="min-w-0 truncate text-xs font-semibold text-[#555d70]">{value}</span>
      <span
        className={cn(
          "w-fit rounded-full px-2 py-1 text-[0.65rem] font-extrabold",
          state === "Verified" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700",
        )}
      >
        {state}
      </span>
    </div>
  );
}

function ConfidenceReviewRow({
  label,
  value,
  confidence,
  detail,
  compact = false,
}: {
  label: string;
  value: string;
  confidence: number;
  detail: string;
  compact?: boolean;
}) {
  const tone = confidenceTone(confidence);

  return (
    <div
      className={cn(
        compact ? "rounded-xl border p-3" : "rounded-2xl border p-4",
        tone === "strong"
          ? "border-emerald-100 bg-emerald-50/70"
          : tone === "review"
            ? "border-amber-100 bg-amber-50/70"
            : "border-rose-100 bg-rose-50/70",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[0.65rem] font-bold tracking-[0.12em] text-[#8c94a6] uppercase">{label}</div>
          <div className={cn("mt-1 truncate font-extrabold text-ink-950", compact ? "text-xs" : "text-sm")}>{value}</div>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-1 text-[0.65rem] font-extrabold",
            tone === "strong"
              ? "bg-emerald-100 text-emerald-700"
              : tone === "review"
                ? "bg-amber-100 text-amber-700"
                : "bg-rose-100 text-rose-700",
          )}
        >
          {confidenceLabel(confidence)} {confidence}/100
        </span>
      </div>
      <p className={cn("mt-2 text-xs leading-5 text-[#687083]", compact ? "line-clamp-2" : "line-clamp-3")}>{detail}</p>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  type = "text",
  placeholder,
  onChange,
}: {
  id?: string;
  label: string;
  value: string;
  type?: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span className="field-label">{label}</span>
      <input
        id={id}
        className="field-input"
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
      />
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span className="field-label">{label}</span>
      <textarea
        className="field-input min-h-24 resize-y"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex min-h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-bold",
        active ? "bg-white text-ink-950 shadow-sm" : "text-[#7c8294]",
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function OutputName({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[0.65rem] font-bold tracking-[0.12em] text-[#9a9faf] uppercase">{label}</div>
      <div className="mt-1 truncate font-mono text-[0.72rem] text-[#50576b]">{value}</div>
    </div>
  );
}
