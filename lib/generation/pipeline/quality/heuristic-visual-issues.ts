export function detectGenericLanguage(html: string) {
  const patterns = [
    "transform your business",
    "solutions for every need",
    "trusted by thousands",
    "award-winning",
    "best-in-class",
    "lorem ipsum",
    "placeholder",
    "your image here",
  ];
  const lower = html.toLowerCase();

  return patterns.filter((pattern) => lower.includes(pattern));
}

export function hasDeadTailwindRisk(html: string, embeddedCss: string) {
  const classNames = Array.from(html.matchAll(/class=["']([^"']+)["']/gi))
    .flatMap((match) => match[1].split(/\s+/))
    .filter((className) => /^(?:p|m|grid|flex|text|bg|rounded|shadow|gap|items|justify|w|h|max-w|min-h)-/.test(className));

  return classNames.some((className) => !embeddedCss.includes(className));
}
