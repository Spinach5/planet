const ENCODE_ID_REGEX = /<input[^>]*id=["']encodeId["'][^>]*value=["']([^"']*)["']/i;

export function extractXhidFromHtml(html: string): string | null {
  const match = ENCODE_ID_REGEX.exec(html);
  return match ? match[1] : null;
}

export function parseCookiesToKeyValue(cookieStr: string): Record<string, string> {
  const result: Record<string, string> = {};

  const trimmed = cookieStr.trim();
  if (!trimmed) return result;

  const cookiePairs = trimmed.split(/;\s*/);

  for (const pair of cookiePairs) {
    const equalIndex = pair.indexOf('=');
    if (equalIndex === -1) continue;

    const key = pair.slice(0, equalIndex).trim();
    const value = pair.slice(equalIndex + 1).trim();

    if (key && !Object.prototype.hasOwnProperty.call(result, key)) {
      result[key] = value;
    }
  }

  return result;
}

export function stringifyCookieObj(cookieObj: Record<string, string>): string {
  return Object.entries(cookieObj)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
}
