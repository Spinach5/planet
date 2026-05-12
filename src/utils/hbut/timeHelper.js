export function getSortedClassTimes(data) {
  if (!Array.isArray(data)) return [];

  return data
    .map(item => ({
      jc: item.jc,
      startTime: item.kssj,
      endTime: item.jssj,
    }))
    .sort((a, b) => parseInt(a.jc) - parseInt(b.jc));
}
