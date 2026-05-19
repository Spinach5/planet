import { useState } from "react";
import { View, Text, Input, Button, Picker } from "@tarojs/components";
import "./index.css";
import HeadStatus from "../../../components/headStatus";
import SafeAreaView from "../../../components/safeView";
import Taro from "@tarojs/taro";
import { checkStuID } from "../../../utils/checkStuID";
import { login } from "../../../service/login";
import { AtIcon } from "taro-ui";

export default function Index() {
	const [university, setUniversity] = useState("湖北工业大学");
	const [studentId, setStudentId] = useState("");
	const [password, setPassword] = useState("");
	const [agreed, setAgreed] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [studentIdError, setStudentIdError] = useState(false);

	const universityList = ["湖北工业大学"];

	const handleLogin = async () => {
		// 学号验证
		if (!checkStuID(studentId)) {
			setStudentIdError(true);
			return;
		}

		// 密码验证
		if (!password) {
			Taro.showToast({
				title: "请输入密码",
				icon: "error",
			});
			return;
		}

		if (!agreed) {
			Taro.showToast({
				title: "请阅读并同意用户协议和隐私政策",
				icon: "none",
			});
			return;
		}

		try {
			Taro.showLoading({ title: "登录中..." });

			// 调用登录接口
			console.log("login", studentId, password);
			const res = await login(studentId, password, university);
			Taro.hideLoading();
			if (!res) {
				return;
			}
			Taro.showToast({
				title: "登录成功",
				icon: "success",
				duration: 1500,
			});

			// 延迟跳转，让用户看到成功提示
			// 将原来的 switchTab 改为 redirectTo 或重新页面
			setTimeout(() => {
				Taro.reLaunch({
					url: "/pages/user/index",
				});
			}, 150);
		} catch (error) {
			Taro.hideLoading();
			Taro.showToast({
				title: "登录失败，请检查学号和密码",
				icon: "error",
			});
			console.error("登录失败:", error);
		}
	};

	const handleStudentIdInput = (e) => {
		let value = e.detail.value;
		value = value.replace(/\D/g, "");
		setStudentId(value);
	};

	const handlePasswordInput = (e) => {
		let value = e.detail.value;
		value = value.replace(/\s/g, "");
		setPassword(value);
	};
	return (
		<SafeAreaView>
			<View className="login-container">
				<AtIcon
					value="arrow-left"
					color="#ffffff"
					onClick={() => Taro.switchTab({ url: "/pages/user/index" })}
				/>
				<HeadStatus text="登录" />

				<View className="header">
					<Picker
						mode="selector"
						range={universityList}
						value={0}
						onChange={(e) =>
							setUniversity(universityList[e.detail.value])
						}
					>
						<View className="university-picker">
							<Text className="university-name">
								{university}
							</Text>
							<Text className="arrow">▼</Text>
						</View>
					</Picker>
				</View>

				<View className="form">
					<View className="input-item">
						<Text className="input-label">学号</Text>
						<View className="input-wrapper">
							<Input
								className={`input-field ${studentIdError ? "input-error" : ""}`}
								placeholder="请输入学号"
								placeholderClass="placeholder"
								value={studentId}
								onInput={handleStudentIdInput}
								onBlur={() => {
									if (!checkStuID(studentId)) {
										setStudentIdError(true);
									} else {
										setStudentIdError(false);
									}
								}}
							/>
							{studentIdError && (
								<Text className="input-error-text">
									学号格式不正确
								</Text>
							)}
						</View>
					</View>

					<View className="input-item">
						<Text className="input-label">密码</Text>
						<View className="password-wrapper">
							<Input
								className="input-field"
								placeholder="请输入密码"
								placeholderClass="placeholder"
								password={!showPassword}
								value={password}
								onInput={handlePasswordInput}
							/>
							<Text
								className="password-toggle"
								onClick={() => setShowPassword(!showPassword)}
							>
								{showPassword ? (
									<AtIcon value="volume-plus" color="#1a2c3e" />
								) : (
									<AtIcon value="volume-off" color="#1a2c3e" />
								)}
							</Text>
						</View>
					</View>

					<Button className="login-btn" onClick={handleLogin}>
						登录
					</Button>

					<View
						className="agreement"
						onClick={() => setAgreed(!agreed)}
					>
						<View className={`checkbox ${agreed ? "checked" : ""}`}>
							{agreed && <Text className="checkmark">✓</Text>}
						</View>
						<Text className="agreement-text">
							我已阅读并同意{" "}
							<Text className="link">用户协议</Text> 和
							<Text className="link"> 隐私政策</Text>
						</Text>
					</View>
				</View>
			</View>
		</SafeAreaView>
	);
}
