import { useState } from "react";
import { View, Text, Input, Button, Picker } from "@tarojs/components";
import "./index.css";
import HeadStatus from "../../../components/HeadStatus";
import SafeAreaView from "../../../components/SafeAreaView";
import Taro from "@tarojs/taro";
import { checkStuID } from "../../../utils/checkStuID";
import { login } from "../../../service";
import runtimeLogger from "../../../utils/runtimeLogger";
import { AtIcon } from "taro-ui";

const AGREEMENT_TEXT = `
欢迎使用"炖仔鸡"（以下简称"本应用"）！

本应用是大学校园教务信息查询辅助工具，旨在为在校学生提供便捷的课程表查询、成绩查询、考试安排查询、校园生活服务等功能。

一、服务说明
1. 本应用为第三方开发的校园工具，非大学官方产品。
2. 本应用通过用户提供的教务系统账号密码，代为查询教务信息并在应用内展示。
3. 本应用的所有数据来源于大学教务管理系统，仅供参考，请以教务系统官方数据为准。

二、用户责任
1. 用户应妥善保管自己的教务系统账号和密码，因账号泄露导致的信息安全问题由用户自行承担。
2. 用户不得利用本应用从事任何违法违规活动，包括但不限于：
   批量爬取数据、干扰教务系统正常运行、利用本应用进行任何形式的商业牟利。
3. 用户应确保所提供的账号信息真实有效，不得使用他人账号登录。

三、免责声明
1. 本应用仅提供信息查询和展示服务，不对教务系统数据的准确性、完整性和时效性做任何保证。
2. 因教务系统维护、网络故障、学校政策调整等原因导致的服务中断或数据异常，本应用不承担责任。
3. 本应用对用户的登录密码进行本地加密存储，但无法保证绝对的信息安全。
4. 本应用保留随时修改或中断服务的权利，无需事先通知用户。

四、知识产权
1. 本应用的代码、界面设计、图标等知识产权归开发者所有。
2. 未经开发者书面许可，任何人不得对本应用进行反向工程、修改或复制。

五、其他
1. 本协议的解释、效力及争议的解决，适用中华人民共和国法律。
2. 如本协议的任何条款被认定为无效，不影响其余条款的效力。
3. 开发者保留对本协议的最终解释权。

如您继续使用本应用，即表示您已阅读并同意本协议的全部内容。`;

const PRIVACY_TEXT = `
"炖仔鸡"（以下简称"我们"）深知个人信息对您的重要性，我们将按照法律法规的规定，保护您的个人信息安全。

一、信息收集
1. 账号信息：您在登录时需要提供教务系统的学号和密码，用于代理登录教务系统获取您的课程、成绩等信息。
2. 教务数据：登录成功后，我们会从教务系统获取并缓存您的以下信息：
   课程表数据、成绩数据、考试安排、学籍信息（姓名、院系、专业、班级等）、学期与周次信息。
3. 设备信息：为保障服务正常运行，我们可能收集设备型号、操作系统版本等基本信息。

二、信息使用
1. 您的账号信息仅用于代理登录教务系统，不会上传至任何第三方服务器。
2. 教务数据缓存在您的设备本地，用于在应用内展示，提升访问速度。
3. 我们不会将您的个人信息出售、出租或分享给任何第三方。
4. 我们不会使用您的个人信息进行任何形式的广告推送。

三、信息存储
1. 所有个人信息均存储在您的设备本地（使用 Taro.Storage）。
2. 密码经过加密处理后存储，不以明文形式保存。
3. 您可以随时通过"设置"中的"退出登录"功能清除所有本地存储的个人信息。
4. 应用卸载后，所有本地数据将被一并删除。

四、信息安全
1. 我们采用登录密码加密存储等技术手段保护您的信息安全。
2. H5 端通过服务端代理请求教务系统，不直接暴露您的信息。
3. 尽管我们采取了安全措施，但请注意互联网不存在"绝对安全"的信息传输。

五、您的权利
1. 您有权随时查看、更正您的个人信息（通过应用内功能）。
2. 您有权随时退出登录并清除所有本地数据。
3. 您有权卸载应用以终止一切数据收集行为。

六、未成年人保护
1. 我们特别重视未成年人的个人信息保护。
2. 如您是未成年人，请在监护人指导下使用本应用。

七、政策更新
1. 我们可能适时更新本隐私政策，更新后的政策将在应用内公示。
2. 重大变更将以弹窗等显著方式通知您。

如您对本隐私政策有任何疑问，请联系开发者。`;

export default function Index() {
	const [university, setUniversity] = useState("湖北工业大学");
	const [studentId, setStudentId] = useState("");
	const [password, setPassword] = useState("");
	const [agreed, setAgreed] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [studentIdError, setStudentIdError] = useState(false);
	const [modalType, setModalType] = useState(null); // null | "agreement" | "privacy"

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
			runtimeLogger.error("Login", "登录失败", error);
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

	const renderModalContent = () => {
		const text = modalType === "agreement" ? AGREEMENT_TEXT : PRIVACY_TEXT;
		// 将 **text** 或单独成行的标题转换为 bold
		const lines = text.split("\n");
		return lines.map((line, i) => {
			const trimmed = line.trim();
			if (!trimmed) {
				return <View key={i} style={{ height: "12px" }} />;
			}
			// 一级标题（一、二、三...）
			if (/^[一二三四五六七八九十]、/.test(trimmed)) {
				return (
					<Text key={i} className="bold" style={{ display: "block", marginTop: "16px", marginBottom: "6px" }}>
						{trimmed}
					</Text>
				);
			}
			// 数字小标题（1. 2. 3.）
			if (/^\d+\./.test(trimmed)) {
				return (
					<Text key={i} className="bold" style={{ display: "block", marginTop: "10px" }}>
						{trimmed}
					</Text>
				);
			}
			// 重要段落（包含特定关键词的行加粗）
			const boldKeywords = [
				"本地加密", "不会上传", "不会将您的个人信息出售", "密码经过加密",
				"不会使用您的个人信息进行任何形式的广告推送", "不直接暴露",
				"账号信息仅用于代理登录", "无法保证绝对的信息安全",
				"仅提供信息查询和展示服务", "非湖北工业大学官方产品", "禁止",
			];
			const shouldBold = boldKeywords.some(kw => trimmed.includes(kw));
			return (
				<Text key={i} className={shouldBold ? "bold" : ""} style={{ display: "block" }}>
					{trimmed}
				</Text>
			);
		});
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
							<Text
								className="link"
								onClick={(e) => {
									e.stopPropagation();
									setModalType("agreement");
								}}
							>
								用户协议
							</Text>{" "}
							和
							<Text
								className="link"
								onClick={(e) => {
									e.stopPropagation();
									setModalType("privacy");
								}}
							>
								{" "}隐私政策
							</Text>
						</Text>
					</View>
				</View>

				{/* 弹窗 */}
				{modalType && (
					<View className="modal-mask" onClick={() => setModalType(null)}>
						<View className="modal-container" onClick={(e) => e.stopPropagation()}>
							<View className="modal-title">
								{modalType === "agreement" ? "用户协议" : "隐私政策"}
							</View>
							<View className="modal-body">
								{renderModalContent()}
							</View>
							<View className="modal-close" onClick={() => setModalType(null)}>
								<Text className="modal-close-text">我知道了</Text>
							</View>
						</View>
					</View>
				)}
			</View>
		</SafeAreaView>
	);
}
