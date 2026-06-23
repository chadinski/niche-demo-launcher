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
  }

  body,
  main,
  section,
  header,
  footer {
    opacity: 1 !important;
    visibility: visible !important;
  }

  .reveal,
  [class*="reveal"],
  [data-reveal],
  [data-animate],
  [data-animation],
  .fade-in,
  .fade-up,
  .animate,
  .animated {
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
  if (!html.trim() || html.includes("data-niche-preview-reset")) {
    return html;
  }

  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head([^>]*)>/i, `<head$1>${previewResetCss}`);
  }

  return `${previewResetCss}${html}`;
}
