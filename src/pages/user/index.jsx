import { useState, useEffect } from "react";
import { View, Text } from "@tarojs/components";
import Taro, { useDidShow, useRouter } from "@tarojs/taro";
import HeadStatus from "../../components/headStatus";
import SafeAreaView from "../../components/safeView";
import userManager from "../../service/userInfo";
import "./index.css";

export default function Index() {
  const router = useRouter();
  const currentPath = router.path.split("?")[0];
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // 加载用户信息（登录状态从 userManager 获取）
  const loadUserInfo = () => {
    try {
      const info = userManager.getUserInfoSync();
	  console.log(info)
      setUserInfo(info); // info 为 null 表示未登录
    } catch (error) {
      console.error("获取用户信息失败", error);
      setUserInfo(null);
    } finally {
      setLoading(false);
    }
  };

  // 页面首次加载和每次显示时重新获取用户信息
  useEffect(() => {
    loadUserInfo();
  }, []);

  useDidShow(() => {
    // 从其他页面返回时刷新登录状态
    loadUserInfo();
  });

  const handleLogin = () => {
    Taro.navigateTo({
      url: "/modules/pages/login/index",
    });
  };

  const handleLogout = () => {
    Taro.showModal({
      title: "提示",
      content: "确定要退出登录吗？",
      success: (res) => {
        if (res.confirm) {
          userManager.logout();
          setUserInfo(null); // 清空本地状态
          Taro.showToast({
            title: "已退出登录",
            icon: "success",
          });
        }
      },
    });
  };

  if (loading) {
    return (
      <SafeAreaView currentPath={currentPath}>
        <View className="loading-wrapper">加载中...</View>
      </SafeAreaView>
    );
  }

  const isLoggedIn = userManager.checkLogin();
  const username = userInfo?.realName || "昵称";
  const stuId = userInfo?.stuId || "未登录";

  return (
    <SafeAreaView currentPath={currentPath}>
      <HeadStatus text="我的" />
      <View className="bora card item user">
        <View className="nick-name">{username}</View>
        <View className="user-name">{stuId}</View>
      </View>

      <View className="container">
        <View className="bora card list">
          <View className="item" onClick={() => {}}>
            <Text>设置</Text>
          </View>
          <View className="item" onClick={() => {}}>
            <Text>常见问题</Text>
          </View>
          <View className="item" onClick={() => {}}>
            <Text>关于我们</Text>
          </View>
          <View className="item" onClick={() => {}}>
            <Text>反馈与建议</Text>
          </View>
          <View className="item" onClick={() => {}}>
            <Text>分享小程序</Text>
          </View>
        </View>
      </View>

      {!isLoggedIn ? (
        <View className="bora login-btn highlight-btn" onClick={handleLogin}>
          <Text>立即登录</Text>
        </View>
      ) : (
        <View className="bora logout-btn" onClick={handleLogout}>
          <Text>退出登录</Text>
        </View>
      )}
    </SafeAreaView>
  );
}
