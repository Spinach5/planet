import { giteeRequest } from "../utils/request";

/**
 * 提交反馈到 Gitee Issue
 * @param {string} token - 用户的 Gitee access_token
 * @param {string} content - 反馈内容
 * @param {string} contact - 联系方式（选填）
 */
export async function sendFeedback({ token, content, contact }) {
  const titleLine = content.replace(/\n/g, " ").slice(0, 40);
  const title = `[反馈] ${titleLine}${content.length > 40 ? "..." : ""}`;

  let body = `## 反馈内容\n\n${content}`;
  if (contact) {
    body += `\n\n---\n**联系方式**: ${contact}`;
  }

  const response = await giteeRequest.post(
    "api/v5/repos/damn_2/issues",
    {
      access_token: token,
      repo: "taro_mini",
      title,
      body,
      security_hole: "false",
    },
    {
      headers: {
        "Content-Type": "application/json;charset=UTF-8",
      },
    },
  );

  if (response.status !== 201) {
    console.warn("[sendFeedback] 提交失败, status:", response.status);
    throw new Error("提交反馈失败");
  }

  return response.data;
}
