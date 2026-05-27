import { View, Text } from "@tarojs/components";
import Taro from "@tarojs/taro";
import HeadStatus from "../../../components/HeadStatus";
import SafeAreaView from "../../../components/SafeAreaView";
import { AtIcon } from "taro-ui";
import "./index.css";

const CONTACT_EMAIL = "super_spinach@qq.com";

export default function Index() {
  const handleCopyEmail = () => {
    Taro.setClipboardData({ data: CONTACT_EMAIL });
    Taro.showToast({ title: "邮箱已复制", icon: "success" });
  };

  return (
    <SafeAreaView>
      <View className="uniform-page-header">
        <AtIcon
          value="arrow-left"
          color="#ffffff"
          onClick={() => Taro.navigateBack()}
        />
        <HeadStatus text="加入我们" />
      </View>

      <View className="join-content">
        <View className="join-hero">
          <View className="join-illustration">
            <Text className="join-illustration-icon">🚀</Text>
          </View>
          <Text className="join-tagline">好家伙</Text>
          <Text className="join-subtitle">
            我们是一群热爱技术的同学，致力于打造更好的校园服务平台
          </Text>
        </View>

        <View className="join-card">
          <Text className="join-section-title">关于项目</Text>
          <Text className="join-desc">
            本项目为学生提供课表查询、成绩查询、考试安排、校园地图、日常工具等一站式服务。项目完全开源，欢迎各位同学参与贡献，一起让校园生活更加便利。
          </Text>
        </View>

        <View className="join-card">
          <Text className="join-section-title">参与方式</Text>
          <View className="join-way-item">
            <View className="join-way-dot" />
            <Text className="join-way-text">
              访问项目仓库，提交 Issue 或 Pull Request
            </Text>
          </View>
          <View className="join-way-item">
            <View className="join-way-dot" />
            <Text className="join-way-text">
              加入开发群组，参与需求讨论与功能设计
            </Text>
          </View>
          <View className="join-way-item">
            <View className="join-way-dot" />
            <Text className="join-way-text">
              帮助测试新功能，提交反馈与建议
            </Text>
          </View>
        </View>

        <View className="join-card" onClick={handleCopyEmail}>
          <Text className="join-section-title">联系方式</Text>
          <View className="join-email-row">
            <AtIcon value="mail" size="16" color="#2563eb" />
            <Text className="join-email">{CONTACT_EMAIL}</Text>
            <Text className="join-email-hint">点击复制</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
