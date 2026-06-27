/**
 * Build semester list from grade year to current semester.
 * Matches the original Taro project's semesterHelper.
 *
 * @param initYear - Grade/入学年份, e.g. "2024"
 * @param currentSemester - Current semester string, e.g. "2025-2026-2"
 * @returns Array of semester strings from grade year to current
 */
export function getSemesterList(
  initYear: string,
  currentSemester: string,
): string[] {
  const startYear = parseInt(initYear, 10);
  if (Number.isNaN(startYear) || startYear < 2018) return [];

  const parts = currentSemester.split("-");
  if (parts.length < 3) return [];

  const targetYear = parseInt(parts[0], 10);
  const targetSemester = parseInt(parts[2], 10);
  if (Number.isNaN(targetYear) || Number.isNaN(targetSemester)) return [];

  const result: string[] = [];
  let year = startYear;
  let sem = 1;

  while (year < targetYear || (year === targetYear && sem <= targetSemester)) {
    result.push(`${String(year)}-${String(year + 1)}-${String(sem)}`);

    if (year === targetYear && sem === targetSemester) break;

    if (sem === 1) {
      sem = 2;
    } else {
      sem = 1;
      year += 1;
    }
  }

  return result;
}
