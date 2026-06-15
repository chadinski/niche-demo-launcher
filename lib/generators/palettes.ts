const DEFAULT_PRIMARY = "#4f46e5";
const DEFAULT_ACCENT = "#14b8a6";

function categoryPalette(category: string) {
const lower = category.toLowerCase();

if (/(auto|mechanic|vehicle|car|detailing)/.test(lower)) return ["#d97706", "#f59e0b"];
if (/(restaurant|cafe|food|bakery|catering)/.test(lower)) return ["#b45309", "#f97316"];
if (/(flor|flower|wedding|event)/.test(lower)) return ["#be185d", "#84cc16"];
if (/(dental|clinic|medical|health|wellness)/.test(lower)) return ["#0f766e", "#38bdf8"];
if (/(salon|barber|beauty|spa|makeup)/.test(lower)) return ["#be185d", "#f59e0b"];
if (/(real estate|interior|architect|construction|contractor|home)/.test(lower)) return ["#92400e", "#d6a955"];
if (/(pet|veterinary|animal)/.test(lower)) return ["#15803d", "#f97316"];
if (/(funeral|memorial|tribute|urn)/.test(lower)) return ["#8b6f3d", "#d6b46a"];
if (/(3d|printing|prototype|custom product|sign)/.test(lower)) return ["#7c3aed", "#06b6d4"];
if (/(music|artist|band|violin|studio|entertainment)/.test(lower)) return ["#7c2d12", "#eab308"];
if (/(law|legal|accounting|finance|consulting)/.test(lower)) return ["#1d4ed8", "#94a3b8"];

return [DEFAULT_PRIMARY, DEFAULT_ACCENT];
}

export function colorPair(value: string, category: string) {
const colors = value.match(/#[0-9a-f]{6}\b/gi) ?? [];
const [fallbackPrimary, fallbackAccent] = categoryPalette(category);
return [colors[0] ?? fallbackPrimary, colors[1] ?? fallbackAccent];
}
