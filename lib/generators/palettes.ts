import { resolveIndustryDesign } from "@/lib/generators/industry-designs";

export function colorPair(value: string, category: string) {
const colors = value.match(/#[0-9a-f]{6}\b/gi) ?? [];
const fallback = resolveIndustryDesign(category);
return [colors[0] ?? fallback.primary, colors[1] ?? fallback.accent];
}
