// 假设 html 是你拿到的 HTML 字符串
const html = `<table class="table table-bordered table-condensed dataTables-example dataTable no-footer stu-table">
            <tbody>
                <tr>
                    <td title="曾秦伟">姓名：曾秦伟</td>
                    <td title="2410321409">学号：2410321409</td>
                    <td title="2024">年级：2024</td>
                </tr>
                <tr>
                    <td title="计算机科学与人工智能学院">学院：计算机科学与人工智能学院</td>
                    <td title="软件工程">专业：软件工程</td>
                    <td title="24软件4">班级：24软件4</td>
                </tr>
                <tr>
                    <td title="    1.1158">平均学分绩点：    1.1158</td>
                    <td title="59.67">算术平均分：59.67</td>
                    <td title=""></td>
                </tr>
            </tbody>
        </table> 
        <tbody>
                <!-- <tr style="height:18px;">
                    <td colspan="4" class="report1_4"></td>
                </tr> -->

                <tr>
                    <td>平均学分绩点</td>

                    <td title="144/213">144/213</td>
                    <td title="29/49">29/49</td>
                    <td title="6/9">6/9</td>
                </tr>
                <tr>
                    <td>算术平均分</td>

                    <td title="152/213">152/213</td>
                    <td title="30/49">30/49</td>
                    <td title="4/9">4/9</td>
                </tr>
            </tbody>
        </table> `;

// 提取基本信息
const name = html.match(/姓名：([^<]+)/)?.[1]?.trim();
const studentId = html.match(/学号：([^<]+)/)?.[1]?.trim();
const grade = html.match(/年级：([^<]+)/)?.[1]?.trim();
const college = html.match(/学院：([^<]+)/)?.[1]?.trim();
const major = html.match(/专业：([^<]+)/)?.[1]?.trim();
const className = html.match(/班级：([^<]+)/)?.[1]?.trim();
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

// 输出结果
const print = () => {
  console.log({
    name,
    studentId,
    grade,
    college,
    major,
    className,
    gpa,
    avgScore,
    gpaRank,
  });
};

export default print;
