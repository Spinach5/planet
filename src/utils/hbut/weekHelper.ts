/**
 * Extract schedule weeks and their date ranges (exclude week 0).
 */
export function extractZc(
  rawData: Record<string, unknown>,
): Array<{ zc: number; rqfw: string }> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const zclist = ((rawData.data as Record<string, unknown> | undefined)?.zclist ?? []) as Array<Record<string, unknown>>;

  if (!Array.isArray(zclist)) return [];

  return zclist
    .filter((item: Record<string, unknown>) => Number(item.zc) !== 0)
    .map((item: Record<string, unknown>) => ({
      zc: Number(item.zc),
      rqfw: typeof item.rqfw === 'string' ? item.rqfw : '',
    }));
}
