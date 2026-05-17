export function extractRanks(html){
const gpa = html.match(/平均学分绩点：\s*([\d.]+)/)?.[1];
const avgScore = html.match(/算术平均分：\s*([\d.]+)/)?.[1];

// 提取绩点排名（顺序：年级、专业、班级）
const gpaRankMatch = html.match(/平均学分绩点<\/td>\s*<td[^>]*>([^<]+)<\/td>\s*<td[^>]*>([^<]+)<\/td>\s*<td[^>]*>([^<]+)<\/td>/);
const gpaRank = gpaRankMatch ? {
  grade: gpaRankMatch[1],
  major: gpaRankMatch[2],
  class: gpaRankMatch[3]
} : null;

// 提取算术平均分排名（顺序：年级、专业、班级）
const avgRankMatch = html.match(/算术平均分<\/td>\s*<td[^>]*>([^<]+)<\/td>\s*<td[^>]*>([^<]+)<\/td>\s*<td[^>]*>([^<]+)<\/td>/);
const avgRank = avgRankMatch ? {
  grade: avgRankMatch[1],
  major: avgRankMatch[2],
  class: avgRankMatch[3]
} : null;

// return 对象
return {
  gpa,
  avgScore,
  gpaRank,
  avgRank
}
}
