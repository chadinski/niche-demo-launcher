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

const noiseLabels = new Set([
"search", "home", "posts", "photos", "reviews", "about", "menu", "share",
"follow", "like", "comment", "sponsored", "open", "directions", "call",
"message", "more", "back", "today", "screenshot", "image", "photo",
"facebook", "instagram", "google", "chrome", "safari", "january", "february",
"march", "april", "may", "june", "july", "august", "september", "october",
"november", "december", "yesterday", "save", "visit", "website", "maps",
"reels", "profile", "notifications", "likes", "comments", "shares", "followers",
"following", "overview", "mentions", "tagged", "story", "stories", "ad", "ads",
]);

const businessNameKeywords =
/\b(studio|salon|auto|automotive|detailing|repairs?|dental|care|restaurant|cafe|coffee|bar|grill|catering|barber|print|printing|3d|design|works|services|construction|memorial|funeral|clinic|spa|interiors|events|music|company|co\.?|ltd\.?|limited|group|solutions|supplies|florist|bakery|fitness|gym|wellness|beauty|realty|law|accounting|cleaning|veterinary|pet)\b/i;

function isNoiseLine(line: string) {
const value = line.trim();
const lower = value.toLowerCase().replace(/[.!]+$/, "");
const usefulCharacters = value.match(/[a-z]/gi)?.length ?? 0;

if (!value || usefulCharacters < 3) return true;
if (noiseLabels.has(lower)) return true;
if (/^\d{1,2}:\d{2}(?:\s?[ap]m)?$/i.test(value)) return true;
if (/^\d{1,2}:\d{2}(?:\s?[ap]m)?\s+(?:today|(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?))/i.test(value)) return true;
if (/^(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2}(?:,?\s+\d{4})?$/i.test(value)) return true;
if (/^(?:19|20)\d{2}$/.test(value)) return true;
if (/^\d{1,2}[/-]\d{1,2}[/-](?:\d{2}|\d{4})$/.test(value)) return true;
if (/^(?:https?:\/\/|www\.)\S+$/i.test(value)) return true;
if (/^[\w.+-]+@[\w-]+(?:\.[\w-]+)+$/i.test(value)) return true;
if (/\b(?:battery|wi-?fi|lte|5g|4g|3g|carrier|signal|airplane mode|no service|charging|verizon|t-mobile|at&t|digicel|flow)\b/i.test(value)) return true;
if (/\b(?:screenshot|screen shot|image metadata|file name|dimensions|megapixels|edited|saved to photos)\b/i.test(value)) return true;
if (/^(?:visit\s+website|view\s+profile|open\s+app|see\s+more|send\s+message|get\s+directions)$/i.test(value)) return true;
if (/^[\d\s.,:;|/\\()[\]{}+%#@!?_-]+$/.test(value)) return true;
if (usefulCharacters / value.length < 0.35) return true;

return false;
}

function isLikelyBusinessName(line: string) {
const value = line.trim();

if (isNoiseLine(value)) return false;
if (value.length < 3 || value.length > 80) return false;
if (/@|https?:\/\/|www\./i.test(value)) return false;
if (/^(?:welcome|contact us|learn more|book now|shop now|see all|view all)\b/i.test(value)) return false;
if (/[.!?]$/.test(value) && value.split(/\s+/).length > 7) return false;

const words = value.match(/[a-z][a-z'&.-]*/gi) ?? [];
return words.length >= 1 && words.length <= 10;
}

function scoreBusinessNameCandidate(line: string, index: number) {
const value = line.trim();
const words = value.split(/\s+/).filter(Boolean);
const titleLike = /^[A-Z0-9][A-Za-z0-9'&.-]*(?:\s+[A-Z0-9][A-Za-z0-9'&.-]*){0,7}$/.test(value);
const hasBusinessKeyword = businessNameKeywords.test(value);
const allCaps = /^[A-Z0-9&'. -]+$/.test(value) && /[A-Z]/.test(value);
const tooGeneric = /^(?:official|public figure|local business|community|product\/service|company|business)$/i.test(value);

if (!isLikelyBusinessName(value) || tooGeneric) return -100;

return (
(hasBusinessKeyword ? 14 : 0) +
(titleLike ? 8 : 0) +
(allCaps ? 3 : 0) +
(words.length >= 2 && words.length <= 5 ? 5 : 0) +
(words.length === 1 && hasBusinessKeyword ? 2 : 0) +
Math.max(0, 8 - index)
);
}

function cleanRawBusinessInfo(raw: string) {
return raw
.split(/\r?\n/)
.map((line) => line.replace(/\s+/g, " ").trim())
.filter((line) => !isNoiseLine(line))
.join("\n");
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

const candidates = cleanRawBusinessInfo(raw)
.split(/\r?\n/)
.map((line) => line.trim())
.filter(isLikelyBusinessName)
.slice(0, 12);

const bestCandidate = candidates
.map((line, index) => ({
line,
score: scoreBusinessNameCandidate(line, index),
}))
.sort((a, b) => b.score - a.score)[0]?.line;

if (!bestCandidate) return "";

return bestCandidate
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
const cleanedRaw = cleanRawBusinessInfo(raw);
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
category: valueAfterLabel(raw, ["category", "business type", "industry", "niche"]) || inferCategory(cleanedRaw),
location: valueAfterLabel(raw, ["location", "address", "service area", "based in"]),
phone,
email,
websiteUrl,
socialUrl,
services: inferServices(cleanedRaw),
brandColors: valueAfterLabel(raw, ["brand colors", "brand colours", "colours", "colors"]) || colors,
painPoints: inferPainPoints(raw, websiteUrl),
};
}
