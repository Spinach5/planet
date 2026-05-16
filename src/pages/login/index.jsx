import { useState } from "react";
import { View, Text, Input, Button, Picker, Image } from "@tarojs/components";
import "./index.css";
import HeadStatus from "../../components/headStatus";
import SafeAreaView from "../../components/safeView";
import img from "../../assets/微信.png";
import { login } from "../../service/hubt/login";
import Taro from "@tarojs/taro";
import { getAllSchedule } from "../../service/hubt/AllSchedule";

export default function Index() {
	const [university, setUniversity] = useState("湖北工业大学");
	const [studentId, setStudentId] = useState("");
	const [password, setPassword] = useState("");
	const [agreed, setAgreed] = useState(false);
	const [showPassword, setShowPassword] = useState(false); // 密码可见性状态
	const [studentIdError, setStudentIdError] = useState(false); // 学号输入错误状态

	// 大学列表（只展示湖北工业大学）
	const universityList = ["湖北工业大学"];

	const handleLogin = () => {
  // 学号验证
  if (!studentId) {
    Taro.showToast({
      title: '请输入学号',
      icon: 'none'
    });
    setStudentIdError(true);
    return;
  }
  
  // 学号长度验证
  if (studentId.length !== 10) {
    Taro.showToast({
      title: '学号必须为10位数字',
      icon: 'none'
    });
    setStudentIdError(true);
    return;
  }
  
  setStudentIdError(false);
  
  // 密码验证
  if (!password) {
    Taro.showToast({
      title: '请输入密码',
      icon: 'none'
    });
    return;
  }
  
  if (!agreed) {
    Taro.showToast({
      title: '请阅读并同意用户协议和隐私政策',
      icon: 'none'
    });
    return;
  }
  login(studentId, password)
  console.log("登录中...", { university, studentId, password });
  Taro.showToast({
    title: '登录成功',
    icon: 'success'
  });
  Taro.switchTab({
    url: '/pages/index/index'
  });
};

	// 学号输入处理（只允许数字）
	const handleStudentIdInput = (e) => {
		let value = e.detail.value;
		// 只保留数字
		value = value.replace(/\D/g, "");
		if (value.length <= 12) {
			setStudentId(value);
		}
		// if (value.length > 0 && value.length !== 10) {
		// 	setStudentIdError(true);
		// } else {
		// 	setStudentIdError(false);
		// }
	};

	// 密码输入处理（不允许空格）
	const handlePasswordInput = (e) => {
		let value = e.detail.value;
		// 移除所有空格
		value = value.replace(/\s/g, "");
		setPassword(value);
	};

	return (
		<SafeAreaView>
			<View className="login-container">
				<View
					className="back-btn"
					onClick={() => Taro.switchTab({ url: "/pages/user/index" })}
				>
					<Text className="back-icon">←</Text>
				</View>
				<HeadStatus text="门户登录" />

				{/* 顶部区域 */}
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
					<Text className="subtitle">统一身份认证</Text>
				</View>

				{/* 登录表单 */}
				<View className="form">
					<View className="input-item">
						<Text className="input-label">学号</Text>
						<view className="input-wrapper">
							<Input
								className={`"input-field" ${studentIdError ? "input-error" : ""}`}
								placeholder="请输入学号"
								placeholderClass="placeholder"
								value={studentId}
								onInput={handleStudentIdInput}
								onBlur={()=>{
									//失去焦点时验证
									if(studentId&&studentId.length!==10){
										setStudentIdError(true);
									}else{
										setStudentIdError(false);
									}
								}}
							/>
							{studentIdError && <Text className="input-error-text">学号长度不正确</Text>}
						</view>
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
