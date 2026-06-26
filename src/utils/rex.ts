const ENCODE_ID_REGEX = /<input[^>]*id=["']encodeId["'][^>]*value=["']([^"']*)["']/i;

export function extractXhidFromHtml(html: string): string | null {
  const match = ENCODE_ID_REGEX.exec(html);
  return match ? match[1] : null;
}

export function parseCookiesToKeyValue(cookieStr: string): Record<string, string> {
  const cookieItems = cookieStr.split(',');
  const result: Record<string, string> = {};

  for (const item of cookieItems) {
    if (!item.trim()) continue;

    const parts = item.split(';');
    const keyValue = parts[0].trim();

    const equalIndex = keyValue.indexOf('=');
    if (equalIndex === -1) continue;

    const key = keyValue.slice(0, equalIndex).trim();
    const value = keyValue.slice(equalIndex + 1).trim();

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
