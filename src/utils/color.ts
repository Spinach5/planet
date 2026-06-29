/**
 * Color utility functions.
 * Extracted from books.tsx and club.tsx to eliminate duplication.
 */

/** Generate a numeric hash code from a string */
export function getHashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/** Generate a consistent HSL color from a name string */
export function getColorFromName(name: string): string {
  return `hsl(${String(getHashCode(name) % 360)}, 70%, 55%)`;
}
