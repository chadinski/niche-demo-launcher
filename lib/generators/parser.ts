import type { BusinessInfo } from "@/lib/types";

function valueAfterLabel(raw: string, labels: string[]) {
const lines = raw.split(/\r?\n/);
for (const line of lines) {
for (const label of labels) {
const match = line.match(new RegExp(`^\\s*${label}\\s*[:\\-]\\s*(.+)$`, "i"));
if (match?.[1]) return match[1].trim();
}
}
return "";
}

function firstMatch(raw: string, pattern: RegExp) {
return raw.match(pattern)?.[0]?.trim() ?? "";
}

function inferCategory(raw: string) {
const categories = [
"auto detailing",
"auto repair",
"mechanic",
"dental clinic",
"restaurant",
"cafe",
"bakery",
"florist",
"funeral home",
"memorial service",
"3d printing",
"sign shop",
"custom products",
"contractor",
"construction",
"real estate",
"interior design",
"salon",
"barber",
"spa",
"law firm",
"accounting",
"pet store",
"veterinary",
"electrical supplies",
"plumbing supplies",
"photography",
"cleaning service",
"music",
"artist",
"fitness",
"gym",
"coaching",
];

const lower = raw.toLowerCase();
return categories.find((category) => lower.includes(category)) ?? "";
}

function inferName(raw: string) {
const labeled = valueAfterLabel(raw, ["business name", "company", "name", "brand"]);
if (labeled) return labeled;

const firstLine = raw
.split(/\r?\n/)
.map((line) => line.trim())
.find(Boolean);

if (!firstLine) return "";

return firstLine
.split(/[|•]/)[0]
.split(/\s[-–]\s/)[0]
.replace(/^business\s*[:-]\s*/i, "")
.trim()
.slice(0, 80);
}

function inferServices(raw: string) {
const labeled = valueAfterLabel(raw, [
"services",
"products",
"offers",
"specialties",
"specialities",
"what they do",
]);

if (labeled) return labeled;

const serviceLine = raw
.split(/\r?\n/)
.find((line) => /\b(services?|products?|speciali[sz](?:es|ing)|offers?)\b/i.test(line));

return serviceLine?.replace(/^.*?[:-]\s*/, "").trim() ?? "";
}

function inferPainPoints(raw: string, website: string) {
const labeled = valueAfterLabel(raw, [
"pain points",
"issues",
"website issue",
"opportunity",
"problem",
"website status",
]);

if (labeled) return labeled;

if (!website) {
return "No clear website link was included in the supplied business information.";
}

return "The current online presentation may benefit from clearer mobile calls to action, stronger visual positioning, and a more polished service journey.";
}

export function emptyBusinessInfo(): BusinessInfo {
return {
rawInfo: "",
businessName: "",
category: "",
location: "",
phone: "",
email: "",
websiteUrl: "",
socialUrl: "",
services: "",
brandColors: "",
notes: "",
painPoints: "",
packagePrice: "$1,000",
demoUrl: "",
};
}

export function parseBusinessInfo(raw: string): Partial<BusinessInfo> {
const email = firstMatch(raw, /[\w.+-]+@[\w-]+(?:.[\w-]+)+/i);
const urls = raw.match(/https?:\/\/[^\s,)\]]+/gi) ?? [];
const socialUrl =
urls.find((url) => /(instagram|facebook|tiktok|linkedin|youtube|x.com|twitter).com/i.test(url)) ?? "";
const websiteUrl = urls.find((url) => url !== socialUrl) ?? "";

const phone =
valueAfterLabel(raw, ["phone", "whatsapp", "tel", "telephone", "call"]) ||
firstMatch(raw, /(?:\+?\d[\d\s().-]{7,}\d)/);

const colors = raw.match(/#[0-9a-f]{6}\b/gi)?.slice(0, 3).join(", ") ?? "";

return {
rawInfo: raw,
businessName: inferName(raw),
category: valueAfterLabel(raw, ["category", "business type", "industry", "niche"]) || inferCategory(raw),
location: valueAfterLabel(raw, ["location", "address", "service area", "based in"]),
phone,
email,
websiteUrl,
socialUrl,
services: inferServices(raw),
brandColors: valueAfterLabel(raw, ["brand colors", "brand colours", "colours", "colors"]) || colors,
painPoints: inferPainPoints(raw, websiteUrl),
};
}
