/**
 * 提取空教室信息
 */
export function extractEmpytClassRoom(data: Array<Record<string, unknown>>): Array<{
  jsmc: string;
  jslx: string;
  jxlmc: string;
  maxvolume: string;
}> {
  if (!Array.isArray(data)) return [];
  return data.map((item) => ({
    jsmc: typeof item.jsmc === "string" ? item.jsmc : String(item.jsmc ?? ""),
    jslx: typeof item.jslx === "string" ? item.jslx : String(item.jslx ?? ""),
    jxlmc: typeof item.jxlmc === "string" ? item.jxlmc : String(item.jxlmc ?? ""),
    maxvolume:
      item.zdskrnrs != null ? String(item.zdskrnrs)
      : item.maxvolume != null ? String(item.maxvolume)
      : "",
  }));
}
