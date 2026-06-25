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
  if (!html.trim() || html.includes("data-niche-preview-reset")) {
    return html;
  }

  if (/<head[^>]*>/i.test(html)) {
    if (/<\/head>/i.test(html)) {
      return html.replace(/<\/head>/i, `${previewResetCss}</head>`);
    }

    return html.replace(/<head([^>]*)>/i, `<head$1>${previewResetCss}`);
  }

  return `${previewResetCss}${html}`;
}
