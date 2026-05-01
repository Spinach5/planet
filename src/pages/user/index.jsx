import { useState } from 'react';
import { View, Image, Text } from '@tarojs/components';
import HeadStatus from '../../components/headStatus'
import SafeAreaView from '../../components/safeView';
import './index.scss';


export default function Index() {
	// 补充缺失的状态定义，实际项目中请根据业务逻辑完善初始值和 setter
	const [nickname, setNickname] = useState('');
	const [raw_username, setRawUsername] = useState('');
	const [username, setUsername] = useState('');
	const [is_show_raw_uname, setIsShowRawUname] = useState(false);
	const [xxt_last_login_time, setXxtLastLoginTime] = useState('');
	const [xxt_last_get_data_time, setXxtLastGetDataTime] = useState('');
	const [is_loggedin_xxt, setIsLoggedinXxt] = useState(false);
	const [showModal, setShowModal] = useState(false);

	// 模拟事件处理函数，实际需替换为真实逻辑
	const switch_is_show_raw_uname = () =>
		setIsShowRawUname(!is_show_raw_uname);
	const handleLogin = () => { };
	const manage_account = () => { };
	const showLocalImage = () => { };
	const get_course_data = () => { };
	const handleLogout = () => { };
	const tapcopyleft = () => { };
	const closeModal = () => setShowModal(false);

	return (
		<SafeAreaView>
			<HeadStatus
			  text='我的'
			></HeadStatus>
			<View className='bora card item user'>
				<View className='nick-name'>
					{nickname ? nickname : '昵称'}
				</View>
				<View
					className='user-name'
					onClick={switch_is_show_raw_uname}
				>
					{raw_username
						? is_show_raw_uname
							? raw_username
							: username
						: '账号'}
				</View>
				<View>
					<Text className='descript'>
						上次登陆xxt时间{xxt_last_login_time}
						{'\n'}
						上次拉取xxt课表时间{xxt_last_get_data_time}
					</Text>
				</View>
			</View>

			<View className='container'>
				{!is_loggedin_xxt && (
					<View className='bora login-btn' onClick={handleLogin}>
						<Text>登录</Text>
					</View>
				)}

				<View className='bora card list'>
					<View className='item' onClick={manage_account}>
						<Text>账号管理</Text>
					</View>
				</View>

				<View className='bora card list'>
					<View className='item' onClick={showLocalImage}>
						<Text>向我们反馈</Text>
					</View>
					<View className='item' onClick={showLocalImage}>
						<Text>加入我们</Text>
					</View>
				</View>

				<View className='bora card'>
					<View className='item' onClick={get_course_data}>
						<View>
							<Text>从xxt获取课表</Text>
						</View>
					</View>
					<View className='item' onClick={handleLogout}>
						<View>
							<Text style={{ color: 'red' }}>
								清除所有小程序缓存
							</Text>
						</View>
						<View>
							<Text className='descript'>
								同时将会清除登录状态
							</Text>
						</View>
					</View>
				</View>
			</View>

			<View className='copyleft'>
				<Text onClick={tapcopyleft}>copyleft</Text>
			</View>

			{showModal && (
				<View className='modal-overlay' onClick={closeModal}>
					<View
						className='modal-content'
						onClick={(e) => e.stopPropagation()}
					>
						{/* 注意：请确认图片路径是否正确，原代码为 ../../image/... */}
						<Image
							src='../../image/qrcode_1777289986212.jpg'
							mode='widthFix'
							className='modal-image'
						></Image>
					</View>
				</View>
			)}

		</SafeAreaView>
	);
}
