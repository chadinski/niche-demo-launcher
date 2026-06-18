import type { GeneralWebsiteCategoryId, ThemeVariation } from "@/lib/industry-theme-engine";

export interface IndustryThemeEngineTestCase {
  label: string;
  sampleExtractedText: string;
  expectedBusinessName: string;
  expectedIndustry: string;
  expectedCategory: GeneralWebsiteCategoryId;
  expectedThemeDirection: ThemeVariation;
}

export const industryThemeEngineTestCases: IndustryThemeEngineTestCase[] = [
  {
    label: "restaurant",
    sampleExtractedText: "Island Flame Jerk Kitchen\nMenu\nJerk chicken, seafood, catering, lunch specials\nWhatsApp to order\nKingston",
    expectedBusinessName: "Island Flame Jerk Kitchen",
    expectedIndustry: "restaurant",
    expectedCategory: "food-hospitality-entertainment",
    expectedThemeDirection: "bold-high-energy",
  },
  {
    label: "mechanic",
    sampleExtractedText: "Precision Auto Garage\nBrake repair, engine diagnostics, oil change, transmission service\nCall now for vehicle repair",
    expectedBusinessName: "Precision Auto Garage",
    expectedIndustry: "mechanic or auto repair",
    expectedCategory: "trades-repairs-local-services",
    expectedThemeDirection: "modern",
  },
  {
    label: "funeral home",
    sampleExtractedText: "Grace Memorial Funeral Home\nFuneral service, burial, cremation, obituary support, memorial chapel\nShare a tribute",
    expectedBusinessName: "Grace Memorial Funeral Home",
    expectedIndustry: "memorial or community organization",
    expectedCategory: "memorial-community-special-purpose",
    expectedThemeDirection: "soft-elegant",
  },
  {
    label: "dentist",
    sampleExtractedText: "BrightCare Dental Clinic\nDental cleaning, whitening, family dentist, patient appointments\nBook Appointment",
    expectedBusinessName: "BrightCare Dental Clinic",
    expectedIndustry: "dentist or clinic",
    expectedCategory: "health-wellness-beauty",
    expectedThemeDirection: "soft-elegant",
  },
  {
    label: "boutique",
    sampleExtractedText: "Velvet Lane Boutique\nNew collection, dresses, accessories, pickup and delivery available\nShop Now",
    expectedBusinessName: "Velvet Lane Boutique",
    expectedIndustry: "retail or product brand",
    expectedCategory: "retail-products-ecommerce",
    expectedThemeDirection: "luxury",
  },
  {
    label: "musician",
    sampleExtractedText: "J. Nova Music\nArtist portfolio, booking, live performance, music videos, event dates\nContact for Booking",
    expectedBusinessName: "J. Nova Music",
    expectedIndustry: "creative or event brand",
    expectedCategory: "creative-events-personal-brands",
    expectedThemeDirection: "bold-high-energy",
  },
  {
    label: "accountant",
    sampleExtractedText: "Sterling Tax & Accounting\nAccountant, bookkeeping, payroll, business finance, consultation\nBook Consultation",
    expectedBusinessName: "Sterling Tax & Accounting",
    expectedIndustry: "professional service",
    expectedCategory: "professional-finance-business",
    expectedThemeDirection: "corporate",
  },
  {
    label: "courier service",
    sampleExtractedText: "SwiftRoute Logistics\nCourier delivery, pickup, logistics support, same-day service, local business routes",
    expectedBusinessName: "SwiftRoute Logistics",
    expectedIndustry: "courier or logistics service",
    expectedCategory: "professional-finance-business",
    expectedThemeDirection: "corporate",
  },
  {
    label: "3d printing company",
    sampleExtractedText: "MakerLab 3D Printing\n3D printing, prototype fabrication, custom product design, signage, laser cutting",
    expectedBusinessName: "MakerLab 3D Printing",
    expectedIndustry: "3d printing or product studio",
    expectedCategory: "retail-products-ecommerce",
    expectedThemeDirection: "modern",
  },
  {
    label: "church nonprofit",
    sampleExtractedText: "Hope Parish Community Church\nChurch ministry, nonprofit outreach, charity food drive, youth program\nSupport the community",
    expectedBusinessName: "Hope Parish Community Church",
    expectedIndustry: "memorial or community organization",
    expectedCategory: "memorial-community-special-purpose",
    expectedThemeDirection: "local-community",
  },
];
