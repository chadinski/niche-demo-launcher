const DEFAULT_PRIMARY = "#4f46e5";
const DEFAULT_ACCENT = "#14b8a6";

function categoryPalette(category: string) {
const lower = category.toLowerCase();

if (/(auto detailing|detailing|car care)/.test(lower)) return ["#0f172a", "#38bdf8"];
if (/(auto repair|mechanic|vehicle|car)/.test(lower)) return ["#1f2937", "#f97316"];
if (/(restaurant|cafe|food|bakery|catering)/.test(lower)) return ["#7c2d12", "#fb923c"];
if (/(flor|flower|wedding|event)/.test(lower)) return ["#9d174d", "#84cc16"];
if (/(dental|clinic|medical|health)/.test(lower)) return ["#0f766e", "#38bdf8"];
if (/(wellness|therapy|spa)/.test(lower)) return ["#52796f", "#d4a373"];
if (/(salon|barber|beauty|makeup)/.test(lower)) return ["#9f1239", "#e8b4a2"];
if (/(real estate|interior|architect|property)/.test(lower)) return ["#57534e", "#c08457"];
if (/(construction|contractor|builder|roofing|plumbing|electrical)/.test(lower)) return ["#334155", "#f59e0b"];
if (/(pet|veterinary|animal|grooming)/.test(lower)) return ["#166534", "#f59e0b"];
if (/(funeral|memorial|tribute|urn|cremation)/.test(lower)) return ["#465649", "#b8a47a"];
if (/(3d|printing|prototype|custom product|fabrication|sign)/.test(lower)) return ["#6d28d9", "#06b6d4"];
if (/(music|artist|band|violin|performer|entertainment)/.test(lower)) return ["#581c87", "#f43f5e"];
if (/(law|legal|accounting|finance|consulting|professional service)/.test(lower)) return ["#1e3a5f", "#64748b"];

return [DEFAULT_PRIMARY, DEFAULT_ACCENT];
}

export function colorPair(value: string, category: string) {
const colors = value.match(/#[0-9a-f]{6}\b/gi) ?? [];
const [fallbackPrimary, fallbackAccent] = categoryPalette(category);
return [colors[0] ?? fallbackPrimary, colors[1] ?? fallbackAccent];
}
