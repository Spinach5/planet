import { useState, useEffect } from "react";
import { View, Text, Textarea, Input } from "@tarojs/components";
import Taro from "@tarojs/taro";
import HeadStatus from "../../../components/HeadStatus";
import SafeAreaView from "../../../components/SafeAreaView";
import { sendFeedback } from "../../../service/sendFeedback";
import { AtIcon } from "taro-ui";
import "./index.css";

const TOKEN_CACHE_KEY = "gitee_access_token";

function getCachedToken() {
  try {
    return Taro.getStorageSync(TOKEN_CACHE_KEY) || "";
  } catch {
    return "";
  }
}

function saveToken(token) {
  Taro.setStorageSync(TOKEN_CACHE_KEY, token);
}

export default function Index() {
  const [content, setContent] = useState("");
  const [contact, setContact] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [token, setToken] = useState("");
  const [showTokenInput, setShowTokenInput] = useState(false);

  useEffect(() => {
    const cached = getCachedToken();
    if (cached) setToken(cached);
  }, []);

  const handleSaveToken = () => {
    if (!token.trim()) {
      Taro.showToast({ title: "请输入 access_token", icon: "none" });
      return;
    }
    saveToken(token.trim());
    setShowTokenInput(false);
    Taro.showToast({ title: "已保存", icon: "success" });
  };

  const handleSubmit = async () => {
    if (!token.trim()) {
      Taro.showToast({ title: "请先设置 Gitee Access Token", icon: "none" });
      return;
    }
    if (!content.trim()) {
      Taro.showToast({ title: "请输入反馈内容", icon: "none" });
      return;
    }

    setSubmitting(true);
    try {
      await sendFeedback({
        token: token.trim(),
        content: content.trim(),
        contact: contact.trim(),
      });
      Taro.showToast({ title: "感谢反馈！", icon: "success" });
      setContent("");
      setContact("");
    } catch (err) {
      console.warn("提交反馈失败:", err);
      Taro.showToast({ title: "提交失败，请重试", icon: "none" });
    } finally {
      setSubmitting(false);
    }
  };

  const charCount = content.length;
  const hasToken = !!token.trim();

  return (
    <SafeAreaView>
      <View className="uniform-page-header">
        <AtIcon
          value="arrow-left"
          color="#ffffff"
          onClick={() => Taro.navigateBack()}
        />
        <HeadStatus text="反馈与建议" />
      </View>

      <View className="feedback-content">
        <View className="feedback-card">
          <Text className="feedback-label">
            Gitee Access Token
            <Text className="feedback-label-hint">（必填）</Text>
          </Text>
          {showTokenInput || !hasToken ? (
            <View className="token-input-row">
              <Input
                className="token-input"
                placeholder="请输入您的 Gitee access_token"
                value={token}
                onInput={(e) => setToken(e.detail.value)}
                password
              />
              <View className="token-save-btn" onClick={handleSaveToken}>
                <Text className="token-save-btn-text">保存</Text>
              </View>
            </View>
          ) : (
            <View className="token-saved-row">
              <View className="token-saved-left">
                <AtIcon value="check-circle" size="16" color="#16a34a" />
                <Text className="token-saved-text">已设置</Text>
              </View>
              <View
                className="token-change-btn"
                onClick={() => setShowTokenInput(true)}
              >
                <Text className="token-change-btn-text">更改</Text>
              </View>
            </View>
          )}
          <Text className="token-tip">
            反馈将提交到项目仓库，需要您的 Gitee access_token 进行身份验证
          </Text>
        </View>

        <View className="feedback-card">
          <Text className="feedback-label">反馈内容</Text>
          <Textarea
            className="feedback-textarea"
            placeholder="请详细描述您的问题或建议..."
            value={content}
            onInput={(e) => setContent(e.detail.value)}
            maxlength={500}
            autoHeight
          />
          <Text className="feedback-char-count">{charCount}/500</Text>
        </View>

        <View className="feedback-card">
          <Text className="feedback-label">联系方式（选填）</Text>
          <Textarea
            className="feedback-contact-input"
            placeholder="QQ / 微信 / 邮箱，方便我们联系您"
            value={contact}
            onInput={(e) => setContact(e.detail.value)}
            maxlength={100}
            autoHeight
          />
        </View>

        <View className="feedback-card feedback-tips-card">
          <View className="feedback-tips-row">
            <AtIcon value="info" size="14" color="#999" />
            <Text className="feedback-tips-text">
              反馈将以 Issue 形式提交到项目仓库，我们会尽快处理
            </Text>
          </View>
        </View>

        <View
          className={`feedback-submit ${submitting ? "feedback-submit-disabled" : ""}`}
          onClick={submitting ? undefined : handleSubmit}
        >
          <Text className="feedback-submit-text">
            {submitting ? "提交中..." : "提交反馈"}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
