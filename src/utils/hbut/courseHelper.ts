function stripHtml(str: string): string {
  return (str || '').replace(/<[^>]*>/g, '');
}

export interface CourseRaw {
  kcmc: string;
  tmc: string;
  croommc: string;
  xqmc: string;
  jxbzc: string;
  kcxz: string;
  zcstr: string;
  xf: string;
  zongxs: string;
  xingqi: string;
  djc: string;
  djs: string;
}

export interface CourseCleaned {
  kcmc: string;
  tmc: string;
  croommc: string;
  xqmc: string;
  jxbzc: string;
  kcxz: string;
  zcstr: number[];
  xf: string;
  zongxs: string;
  xingqi: string;
  djc: number[];
}

export function extractCourseData(courseList: CourseRaw[]): CourseCleaned[] {
  const map = new Map<string, CourseCleaned>();

  for (const item of courseList) {
    const name = stripHtml(item.kcmc);
    const key = `${name}|${item.zcstr}|${item.xingqi}|${item.djs}`;

    if (!map.has(key)) {
      map.set(key, {
        kcmc: name,
        tmc: stripHtml(item.tmc),
        croommc: stripHtml(item.croommc),
        xqmc: item.xqmc,
        jxbzc: stripHtml(item.jxbzc),
        kcxz: item.kcxz,
        zcstr: item.zcstr.split(',').map(Number),
        xf: item.xf,
        zongxs: item.zongxs,
        xingqi: item.xingqi,
        djc: [Number(item.djc)],
      });
    } else {
      const exist = map.get(key);
      if (exist) {
        exist.djc.push(Number(item.djc));
      }
    }
  }

  return Array.from(map.values()).map((course) => {
    course.djc.sort((a, b) => a - b);
    return course;
  });
}
