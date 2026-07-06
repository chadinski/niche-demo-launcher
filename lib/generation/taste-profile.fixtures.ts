import type { ArchetypeReconciliation, VisualIdentityProfile } from "@/lib/generation/taste-profile";

export const handyHubArchetypeRegressionFixture = {
  name: "HandyHub trades/local-services must not route to professional-services",
  selectedArchetypeId: "professional-services",
  cleanBusinessData: {
    companyName: "HandyHub",
    businessType: "In-Home Service",
    visibleDescription: "Quick, trusted home service help at your fingertips. Book plumbers, electricians, and more with ease.",
    services: ["plumbers", "electricians", "painting", "cleaning", "locksmith"],
    targetAudience: "Customers in Portmore and New Kingston looking for quick home service help.",
    visibleColors: ["orange", "blue"],
    visualEvidence: ["home repair logo", "tools", "Jamaica flag", "WhatsApp contact"],
    logoDescription: "Round orange home-service mark with house and tools.",
    rawExtractedData: "Page: In-Home Service. Portmore, Jamaica. New Kingston, Jamaica. WhatsApp and phone available.",
  },
  expectedFinalArchetypeId: "home-services",
  expectedWarning: "Generic professional/business routing was rejected for an expressive local-service niche.",
} satisfies {
  name: string;
  selectedArchetypeId: string;
  cleanBusinessData: Record<string, unknown>;
  expectedFinalArchetypeId: string;
  expectedWarning: string;
};

export const boringCorporateQaRegressionFixture = {
  name: "Technically complete but boring output should not score as premium",
  expectedMaxAuditScore: 72,
  htmlSignals: [
    "complete metadata",
    "six or more sections",
    "responsive CSS",
    "contact CTA",
    "generic corporate navy/Inter styling",
    "generic wording such as comprehensive services or tailored solutions",
  ],
} satisfies {
  name: string;
  expectedMaxAuditScore: number;
  htmlSignals: string[];
};

export type TasteLayerRegressionExpectation = {
  visualIdentity: VisualIdentityProfile;
  reconciliation: ArchetypeReconciliation;
};
