/**
 * 根据当前周数推算目标周数所在的月份
 */
export function getMonthOfWeek(currentWeek: number, targetWeek: number): number {
  const today = new Date();

  const dayOfWeek = today.getDay();
  const daysToMonday = (dayOfWeek + 6) % 7;

  const thisMonday = new Date(today);
  thisMonday.setDate(today.getDate() - daysToMonday);

  const firstMonday = new Date(thisMonday);
  firstMonday.setDate(thisMonday.getDate() - (currentWeek - 1) * 7);

  const targetMonday = new Date(firstMonday);
  targetMonday.setDate(firstMonday.getDate() + (targetWeek - 1) * 7);

  return targetMonday.getMonth() + 1;
}
