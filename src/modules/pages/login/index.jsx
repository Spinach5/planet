import { useState } from "react";
import { View, Text, Input, Button, Picker, Image } from "@tarojs/components";
import "./index.css";
import HeadStatus from "../../../components/headStatus";
import SafeAreaView from "../../../components/safeView";
import Taro from "@tarojs/taro";
import { checkStuID } from "../../../utils/checkStuID";
import { login } from "../../../service/hubt/login";

export default function Index() {
	const [university, setUniversity] = useState("湖北工业大学");
	const [studentId, setStudentId] = useState("");
	const [password, setPassword] = useState("");
	const [agreed, setAgreed] = useState(false);
	const [showPassword, setShowPassword] = useState(false); // 密码可见性状态
	const [studentIdError, setStudentIdError] = useState(false); // 学号输入错误状态

	// 大学列表（只展示湖北工业大学）
	const universityList = ["湖北工业大学", "其他大学"];

	const handleLogin = () => {
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

		console.log("登录", { university, studentId, password });
		login(studentId, password);
			Taro.switchTab({
					url: '/pages/index/index'
				});
	};

	const handleStudentIdInput = (e) => {
		let value = e.detail.value;
		// 只保留数字
		value = value.replace(/\D/g, "");
		setStudentId(value);
		// if (checkStuID(value)) {

		// }
	};

	const handlePasswordInput = (e) => {
		let value = e.detail.value;
		value = value.replace(/\s/g, "");
		setPassword(value);
	};
{/* <View class="fa fa-arrow-left" style="font-size:48px; color:#F00"></View> */}
	return (
		<SafeAreaView>
			<View className="login-container">
				<View
					className="fa fa-arrow-left back-btn"
					onClick={() => Taro.switchTab({ url: "/pages/user/index" })}
				>
				</View>
				<HeadStatus text="登录" />

				{/* 顶部选择学校 */}
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

				{/* 登录表单 */}
				<View className="form">
					<View className="input-item">
						<Text className="input-label">学号</Text>
						<View className="input-wrapper">
							<Input
								className={`"input-field" ${studentIdError ? "input-error" : ""}`}
								placeholder="请输入学号"
								placeholderClass="placeholder"
								value={studentId}
								onInput={handleStudentIdInput}
								onBlur={() => {
									//失去焦点时验证
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
								{showPassword ? "👁️" : "👁️‍🗨️"}
							</Text>
						</View>
					</View>

					<Button className="login-btn" onClick={handleLogin}>
						登录
					</Button>

					{/* 协议同意区域 */}
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
