export interface ClassTime {
  jc: string;
  startTime: string;
  endTime: string;
}

interface RawTimeItem {
  jc: string;
  kssj: string;
  jssj: string;
}

export function getSortedClassTimes(data: RawTimeItem[]): ClassTime[] {
  if (!Array.isArray(data)) return [];

  return data
    .map((item) => ({
      jc: item.jc,
      startTime: item.kssj,
      endTime: item.jssj,
    }))
    .sort((a, b) => parseInt(a.jc) - parseInt(b.jc));
}
