const previewResetCss = `
<style data-niche-preview-reset>
  *, *::before, *::after {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0s !important;
    scroll-behavior: auto !important;
  }

  html,
  body {
    min-height: 100% !important;
    overflow-x: hidden !important;
    overflow-y: auto !important;
    overscroll-behavior: contain !important;
    scroll-snap-type: none !important;
  }

  body,
  main,
  section,
  header,
  footer {
    opacity: 1 !important;
    visibility: visible !important;
  }

  :where(
    .reveal,
    [class*="reveal"],
    [class*="fade"],
    [class*="animate"],
    [class*="motion"],
    [class*="observe"],
    [class*="parallax"],
    [data-reveal],
    [data-animate],
    [data-animation],
    [data-aos],
    [data-scroll],
    [data-observe],
    [style*="opacity: 0"],
    [style*="opacity:0"],
    [style*="visibility: hidden"],
    [style*="visibility:hidden"]
  ) {
    opacity: 1 !important;
    visibility: visible !important;
    transform: none !important;
    filter: none !important;
    clip-path: none !important;
  }

  .preloader,
  [class*="preloader"] {
    display: none !important;
  }
</style>
`;

export function createPreviewHtml(html: string) {
  const safeHtml=sanitizePreviewHtml(html);
  if (!safeHtml.trim() || safeHtml.includes("data-niche-preview-reset")) {
    return safeHtml;
  }

  if (/<head[^>]*>/i.test(safeHtml)) {
    if (/<\/head>/i.test(safeHtml)) {
      return safeHtml.replace(/<\/head>/i, `${previewResetCss}</head>`);
    }

    return safeHtml.replace(/<head([^>]*)>/i, `<head$1>${previewResetCss}`);
  }

  return `${previewResetCss}${safeHtml}`;
}

export function sanitizePreviewHtml(html:string){
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi,"")
    .replace(/<(?:iframe|object|embed|base)\b[^>]*>[\s\S]*?<\/(?:iframe|object|embed|base)\s*>/gi,"")
    .replace(/<(?:iframe|object|embed|base)\b[^>]*\/?>/gi,"")
    .replace(/<meta\b[^>]*http-equiv\s*=\s*["']?refresh["']?[^>]*>/gi,"")
    .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi,"")
    .replace(/\s+(href|src|action|formaction)\s*=\s*(["'])\s*(?:javascript:|data:text\/html)[\s\S]*?\2/gi,' $1="#"');
}
