export function ensureStandaloneSeraphimPage(html: string) {
  let output = html.trim();

  if (!/^<!doctype html>/i.test(output)) {
    output = `<!DOCTYPE html>\n${output}`;
  }

  if (!/<meta\s+name=["']robots["']/i.test(output)) {
    output = output.replace(/<head([^>]*)>/i, `<head$1>\n<meta name="robots" content="noindex, nofollow">`);
  }

  if (!/<meta\s+name=["']generator["']\s+content=["']Seraphim Generator["']/i.test(output)) {
    output = output.replace(/<head([^>]*)>/i, `<head$1>\n<meta name="generator" content="Seraphim Generator">`);
  }

  if (!/data-seraphim-generator=["']true["']/i.test(output)) {
    output = output.replace(/<body([^>]*)>/i, `<body$1 data-seraphim-generator="true">`);
  }

  return output;
}
