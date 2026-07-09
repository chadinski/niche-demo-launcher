export type LeadCountryCode = "US" | "JM" | "TT";

export interface LeadRegionCountry {
  code: LeadCountryCode;
  name: string;
  regionLabel: string;
  cityLabel: string;
  defaultRegion: string;
  defaultCity: string;
  regions: string[];
}

export const LEAD_REGION_COUNTRIES: LeadRegionCountry[] = [
  {
    code: "US",
    name: "United States",
    regionLabel: "State",
    cityLabel: "City or metro",
    defaultRegion: "Florida",
    defaultCity: "Miami",
    regions: [
      "Alabama",
      "Alaska",
      "Arizona",
      "Arkansas",
      "California",
      "Colorado",
      "Connecticut",
      "Delaware",
      "Florida",
      "Georgia",
      "Hawaii",
      "Idaho",
      "Illinois",
      "Indiana",
      "Iowa",
      "Kansas",
      "Kentucky",
      "Louisiana",
      "Maine",
      "Maryland",
      "Massachusetts",
      "Michigan",
      "Minnesota",
      "Mississippi",
      "Missouri",
      "Montana",
      "Nebraska",
      "Nevada",
      "New Hampshire",
      "New Jersey",
      "New Mexico",
      "New York",
      "North Carolina",
      "North Dakota",
      "Ohio",
      "Oklahoma",
      "Oregon",
      "Pennsylvania",
      "Rhode Island",
      "South Carolina",
      "South Dakota",
      "Tennessee",
      "Texas",
      "Utah",
      "Vermont",
      "Virginia",
      "Washington",
      "West Virginia",
      "Wisconsin",
      "Wyoming",
    ],
  },
  {
    code: "JM",
    name: "Jamaica",
    regionLabel: "Parish",
    cityLabel: "Town, city, or area",
    defaultRegion: "Kingston",
    defaultCity: "Kingston",
    regions: [
      "Clarendon",
      "Hanover",
      "Kingston",
      "Manchester",
      "Portland",
      "Saint Andrew",
      "Saint Ann",
      "Saint Catherine",
      "Saint Elizabeth",
      "Saint James",
      "Saint Mary",
      "Saint Thomas",
      "Trelawny",
      "Westmoreland",
    ],
  },
  {
    code: "TT",
    name: "Trinidad and Tobago",
    regionLabel: "Region or borough",
    cityLabel: "Town, city, or area",
    defaultRegion: "Port of Spain",
    defaultCity: "Port of Spain",
    regions: [
      "Arima",
      "Chaguanas",
      "Couva-Tabaquite-Talparo",
      "Diego Martin",
      "Mayaro-Rio Claro",
      "Penal-Debe",
      "Point Fortin",
      "Port of Spain",
      "Princes Town",
      "San Fernando",
      "San Juan-Laventille",
      "Sangre Grande",
      "Siparia",
      "Tobago",
      "Tunapuna-Piarco",
    ],
  },
];

export function getLeadCountry(code: string) {
  return LEAD_REGION_COUNTRIES.find((country) => country.code === code) ?? LEAD_REGION_COUNTRIES[0];
}

export function buildLeadSearchLocation(input: {
  city?: string;
  region?: string;
  country?: string;
  fallbackLocation?: string;
}) {
  const country = input.country ? getLeadCountry(input.country).name : "";
  const parts = [input.city, input.region, country]
    .map((part) => part?.replace(/\s+/g, " ").trim())
    .filter((part): part is string => Boolean(part));

  if (parts.length) return Array.from(new Set(parts)).join(" ");
  return input.fallbackLocation?.replace(/\s+/g, " ").trim() ?? "";
}
