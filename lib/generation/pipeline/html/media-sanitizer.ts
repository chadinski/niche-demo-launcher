export function hasUnreliableMediaSource(html: string) {
  return /src=["'](?:\.{0,2}\/|file:|blob:|placeholder|placehold\.co|via\.placeholder)/i.test(html);
}

export function stripDangerousMediaSources(html: string) {
  return html.replace(/\s+src=["'](?:file:|blob:)[^"']*["']/gi, "");
}
