import { useState, useEffect } from "react";
import { View, Text, Image } from "@tarojs/components";
import Taro, { useDidShow, useRouter, usePullDownRefresh } from "@tarojs/taro";
import HeadStatus from "../../components/HeadStatus";
import SafeAreaView from "../../components/SafeAreaView";
import UserCard from "../../components/UserCard";
import userManager from "../../service/userInfo";
import runtimeLogger from "../../utils/runtimeLogger";
import { AtIcon } from "taro-ui";
import { MaterialCommunityIcons } from "taro-icons";

import "./index.css";

const menuItems = [
	{
		text: "设置",
		icon: "settings",
		onClick: () =>
			Taro.navigateTo({ url: "/modules/pages/settings/index" }),
	},
	{
		text: "运行日志",
		icon: "bug",
		onClick: () =>
			Taro.navigateTo({ url: "/modules/pages/runtimeLog/index" }),
	},
	{
		text: "项目仓库",
		icon: "source-repository",
		onClick: () => Taro.navigateTo({ url: "/modules/pages/repo/index" }),
	},
	{
		text: "加入我们",
		icon: "account-plus",
		onClick: () => Taro.navigateTo({ url: "/modules/pages/join/index" }),
	},
	{
		text: "反馈与建议",
		icon: "comment-quote",
		onClick: () =>
			Taro.navigateTo({ url: "/modules/pages/feedback/index" }),
	},
];

export default function Index() {
	const router = useRouter();
	const currentPath = router.path.split("?")[0];
	const [userInfo, setUserInfo] = useState(null);
	const [loading, setLoading] = useState(true);
	const [avatar, setAvatar] = useState("");

	const loadAvatar = () => {
		try {
			const cached = Taro.getStorageSync("user_avatar");
			if (cached) setAvatar(cached);
		} catch (e) {
			// ignore
		}
	};

	const loadUserInfo = () => {
		try {
			const info = userManager.getUserInfoSync();
			setUserInfo(info);
		} catch (error) {
			runtimeLogger.error("User", "获取用户信息失败", error);
			setUserInfo(null);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadUserInfo();
		loadAvatar();
	}, []);

	useDidShow(() => {
		loadUserInfo();
		loadAvatar();
	});

	usePullDownRefresh(() => {
		loadUserInfo();
		Taro.stopPullDownRefresh();
	});

	const handleLogin = () => {
		Taro.navigateTo({ url: "/modules/pages/login/index" });
	};

	const handleChooseAvatar = () => {
		Taro.chooseImage({
			count: 1,
			sizeType: ["compressed"],
			sourceType: ["album", "camera"],
			success: (res) => {
				const path = res.tempFilePaths[0];
				setAvatar(path);
				Taro.setStorageSync("user_avatar", path);
			},
		});
	};

	const handleLogout = () => {
		Taro.showModal({
			title: "提示",
			content: "确定要退出登录吗？",
			success: (res) => {
				if (res.confirm) {
					userManager.logout();
					setUserInfo(null);
					Taro.showToast({ title: "已退出登录", icon: "success" });
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
	const university = userInfo?.university || "?";
	const college = userInfo?.college || "?";
	const Uclass = userInfo?.class || "?";

	return (
		<SafeAreaView currentPath={currentPath}>
			<HeadStatus text="我的" />
			<View className="user-header-card">
				<View
					className="user-avatar-circle"
					onClick={handleChooseAvatar}
				>
					{avatar ? (
						<Image
							className="user-avatar-img"
							src={avatar}
							mode="aspectFill"
						/>
					) : (
						<Text className="user-avatar-text">
							{username.charAt(0)}
						</Text>
					)}
				</View>
				<View className="user-base-info">
					<Text className="user-nick-name">{username}</Text>
					<Text className="user-stu-id">{stuId}</Text>
				</View>
				<View className="user-tags">
					<UserCard text={university} />
					<UserCard text={college} />
					<UserCard text={Uclass} />
				</View>
			</View>

			<View className="user-menu-section">
				{menuItems.map((item) => (
					<View
						key={item.text}
						className="user-menu-item"
						onClick={item.onClick}
					>
						<View className="user-menu-left">
							<View className="user-menu-icon-wrap">
								<MaterialCommunityIcons
									name={item.icon}
									size="40"
									color="#47a5fd"
								/>
							</View>
							<Text className="user-menu-text">{item.text}</Text>
						</View>
						<AtIcon
							value="chevron-right"
							size="14"
							color="#c0c0c0"
						/>
					</View>
				))}
			</View>

			{!isLoggedIn ? (
				<View className="user-login-btn" onClick={handleLogin}>
					<Text>立即登录</Text>
				</View>
			) : (
				<View className="user-logout-btn" onClick={handleLogout}>
					<Text>退出登录</Text>
				</View>
			)}
		</SafeAreaView>
	);
}
