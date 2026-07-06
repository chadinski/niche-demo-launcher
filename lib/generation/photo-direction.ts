import type { Archetype } from "@/lib/archetypes";
import type { VisualIdentityProfile } from "@/lib/generation/taste-profile";

export type PhotoSourceMode = "uploaded-screenshot" | "representative-remote" | "css-svg-art" | "no-image";

export type PhotoDirectionRecommendation = {
  preferredMode: PhotoSourceMode;
  allowedModes: PhotoSourceMode[];
  summary: string;
  uploadedScreenshotRules: string[];
  representativeImageryRules: string[];
  cssSvgArtRules: string[];
  remoteImageRules: string[];
  labelingRules: string[];
  altTextRules: string[];
  sectionApplications: Array<{
    section: string;
    direction: string;
  }>;
  rejectionRules: string[];
  qaChecks: string[];
};

type CleanBusinessLike = {
  businessType?: string;
  services?: string[];
  products?: string[];
  visibleDescription?: string;
  sourceImageDataUrl?: string;
  sourceImageName?: string;
  visualEvidence?: string[];
  logoDescription?: string;
};

function sourceText(input: {
  cleanBusinessData: CleanBusinessLike;
  archetype: Archetype;
  visualIdentity: VisualIdentityProfile;
}) {
  return [
    input.cleanBusinessData.businessType,
    input.cleanBusinessData.visibleDescription,
    input.cleanBusinessData.services?.join(" "),
    input.cleanBusinessData.products?.join(" "),
    input.cleanBusinessData.visualEvidence?.join(" "),
    input.cleanBusinessData.logoDescription,
    input.archetype.id,
    input.archetype.name,
    input.visualIdentity.logoMood,
    input.visualIdentity.imageEnergy,
    input.visualIdentity.industryCues.join(" "),
  ].filter(Boolean).join(" ").toLowerCase();
}

function imageSubjectDirection(source: string) {
  if (/\b(food|restaurant|kitchen|grill|bakery|cafe|dining|catering)\b/i.test(source)) {
    return "food texture, plated dishes, counter details, menu surfaces, or atmosphere; never fake staff, reviews, hours, prices, or menu items";
  }
  if (/\b(auto|automotive|detailing|mechanic|garage|vehicle|car wash|tire|tyre)\b/i.test(source)) {
    return "vehicle finish, paint reflection, tools, wheels, shop-detail atmosphere, or road-ready abstract compositions; never fake certifications, warranties, or brand authorization";
  }
  if (/\b(pet|groom|animal|pet store|pet care)\b/i.test(source)) {
    return "pets, pet supplies, grooming/care objects, friendly logo-derived compositions, or comfort-led CSS/SVG art; never imply medical outcomes or real customers";
  }
  if (/\b(home service|handy|plumb|electric|repair|painting|cleaning|locksmith|contractor|hvac|roofing)\b/i.test(source)) {
    return "tools, materials, finished-work details, service-area/map abstractions, or house/tool CSS art; never imply licensing, emergency service, insurance, or guaranteed turnaround";
  }
  if (/\b(beauty|salon|spa|nails|lashes|makeup|hair|barber)\b/i.test(source)) {
    return "beauty tools, product textures, mirror/light details, salon atmosphere, or editorial abstract surfaces; never fake transformations, clients, prices, or availability";
  }
  if (/\b(health|wellness|clinic|therapy|medical|dental|care)\b/i.test(source)) {
    return "calm environment, care objects, abstract wellness composition, or gentle CSS/SVG art; never imply actual patients, clinicians, credentials, or outcomes";
  }
  return "industry-specific objects, atmosphere, location texture, or CSS/SVG compositions that clarify the offer without implying unverifiable proof";
}

export function recommendPhotoDirection(input: {
  cleanBusinessData: CleanBusinessLike;
  archetype: Archetype;
  visualIdentity: VisualIdentityProfile;
}): PhotoDirectionRecommendation {
  const source = sourceText(input);
  const hasUploadedImage = Boolean(input.cleanBusinessData.sourceImageDataUrl || input.cleanBusinessData.sourceImageName);
  const visualNiche = /\b(food|restaurant|auto|detailing|pet|beauty|salon|home service|handy|travel|retail|creative|fitness|wellness)\b/i.test(source);
  const preferredMode: PhotoSourceMode = hasUploadedImage
    ? "uploaded-screenshot"
    : visualNiche
      ? "css-svg-art"
      : "css-svg-art";
  const subjectDirection = imageSubjectDirection(source);

  return {
    preferredMode,
    allowedModes: hasUploadedImage
      ? ["uploaded-screenshot", "css-svg-art", "representative-remote"]
      : ["css-svg-art", "representative-remote", "no-image"],
    summary: hasUploadedImage
      ? "Use the uploaded screenshot/photo as verified visual evidence where it helps orientation or proof, then support it with CSS/SVG art rather than random stock."
      : "No verified photo is available; prefer CSS/SVG art or carefully labeled representative imagery over random stock.",
    uploadedScreenshotRules: [
      "Use __SERAPHIM_SOURCE_IMAGE__ only when the section benefits from verified source material.",
      "Treat uploaded screenshots as evidence/proof or brand reference, not as a polished hero photo unless it is visually strong.",
      "Crop with object-position: top center for social profile screenshots so business identity and contact details remain visible.",
      "Do not enlarge a low-resolution screenshot so much that it looks broken; frame it as source proof or brand material.",
      "Never extract hidden claims from the image beyond visible verified facts.",
    ],
    representativeImageryRules: [
      `Representative imagery, if used, should show ${subjectDirection}.`,
      "Representative imagery must support mood and category, not pretend to show the actual business, staff, clients, facilities, projects, results, or inventory.",
      "Use only stable HTTPS remote image URLs when a remote image is truly valuable; otherwise use CSS/SVG art.",
      "Do not use placeholder image services, local filenames, relative paths, data from unknown domains, or empty frames.",
    ],
    cssSvgArtRules: [
      "Use CSS/SVG art when verified photography is missing, risky, or likely to mislead.",
      "CSS/SVG art can include abstract product/service silhouettes, maps, route lines, plate rings, gloss sweeps, paw marks, tool panels, mirror cards, texture fields, and icon compositions.",
      "CSS/SVG art must be decorative or explanatory; it must not imply real proof, real facilities, real people, awards, metrics, or verified work samples.",
      "Inline SVG must be small, accessible, and decorative with aria-hidden unless it conveys labeled information.",
    ],
    remoteImageRules: [
      "Do not use a random stock image just because the section needs visual weight.",
      "Remote images are allowed only when they are reliable HTTPS images from reputable royalty-free/photo CDN sources and category-accurate.",
      "Remote images must not show identifiable people as actual clients, staff, patients, students, or customers unless supplied by the business.",
      "Remote images must include width/height or stable aspect-ratio, lazy loading below the fold, and honest alt text.",
      "If the image is representative, add nearby visible text such as 'Representative imagery - replace with verified business photography before launch.'",
    ],
    labelingRules: [
      "Uploaded screenshots may be labeled as 'Source image supplied for this demo' or 'Verified source material'.",
      "Representative visuals must be labeled honestly when they could be mistaken for the business's own work or facility.",
      "CSS/SVG art usually does not need a visible label unless it represents a replaceable photo slot.",
      "Do not use labels that sound like proof, such as 'real customer result', unless verified.",
    ],
    altTextRules: [
      "Informative uploaded images need alt text that describes visible business material without adding claims.",
      "Representative images need alt text beginning with 'Representative image of...' when appropriate.",
      "Decorative CSS/SVG art should be aria-hidden or have empty alt text.",
      "Never put essential CTA or business facts only inside an image.",
    ],
    sectionApplications: [
      { section: "hero", direction: hasUploadedImage ? "Use uploaded source image if it strengthens identity; otherwise create a category-specific CSS/SVG hero composition." : "Prefer CSS/SVG hero composition with optional honest representative image only if category-specific." },
      { section: "services", direction: "Use icons, service rails, CSS art, or small representative object visuals rather than fake project photos." },
      { section: "showcase/gallery", direction: "Use uploaded image, representative visual frames, or labeled replaceable slots; never fake portfolio proof." },
      { section: "trust/proof", direction: "Use verified facts and source image material only; do not use stock people or fake review visuals." },
      { section: "contact/CTA", direction: "Use abstract texture, map/route, phone/contact art, or uploaded logo/screenshot crop without implying extra capabilities." },
    ],
    rejectionRules: [
      "Reject random stock photography that could belong to any business.",
      "Reject broken image sources, placeholder services, local filesystem paths, and uncaptioned representative images.",
      "Reject images that imply fake employees, customers, facilities, reviews, products, medical outcomes, properties, vehicles, prices, awards, or certifications.",
      "Reject hero visuals that do not match the extracted industry, brand temperature, or logo mood.",
    ],
    qaChecks: [
      "Every non-decorative image must have reliable src and honest alt text.",
      "Representative imagery must be visibly labeled if it can be mistaken for verified business material.",
      "Use uploaded screenshot/photo when it is the only verified visual proof and it strengthens the page.",
      "Prefer CSS/SVG art over misleading stock imagery when business photography is missing.",
    ],
  };
}
