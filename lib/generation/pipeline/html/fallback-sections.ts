export function buildSafeFallbackSection(input: {
  id: string;
  businessName: string;
  headline: string;
  body: string;
  cta?: string;
}) {
  const cta = input.cta
    ? `<a class="seraphim-button seraphim-button-primary" href="#contact">${input.cta}</a>`
    : "";

  return `<section id="${input.id}" class="seraphim-section seraphim-fallback-section">
  <div class="seraphim-container">
    <p class="seraphim-eyebrow">${input.businessName}</p>
    <h2>${input.headline}</h2>
    <p>${input.body}</p>
    ${cta}
  </div>
</section>`;
}
