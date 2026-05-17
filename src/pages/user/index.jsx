import { useState, useEffect } from 'react';
import { View, Image, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import HeadStatus from '../../components/headStatus'
import SafeAreaView from '../../components/safeView';
import './index.css';
import {logout} from '../../service/userInfo';
// import cacheManager from "../cache";

export default function Index() {
  const [nickname, setNickname] = useState('');
  const [raw_username, setRawUsername] = useState('');
  const [username, setUsername] = useState('');
  const [is_show_raw_uname, setIsShowRawUname] = useState(false);
  const [is_loggedin_xxt, setIsLoggedinXxt] = useState(false);

  // 获取登录状态的函数
  const loadUserInfo = () => {
    console.log('加载用户信息');
    const is_loggedin_xxt = Taro.getStorageSync('is_loggedin_xxt');
    console.log('是否登录:', is_loggedin_xxt);
    
    if (is_loggedin_xxt) {
      setIsLoggedinXxt(true);
      const userInfo = Taro.getStorageSync('userInfo');
      if (userInfo) {
        setNickname(userInfo.nickname || '');
        setRawUsername(userInfo.raw_username || '');
        setUsername(userInfo.username || '');
      }
    } else {
      setIsLoggedinXxt(false);
      setNickname('');
      setRawUsername('');
      setUsername('');
    }
  };

  // 每次页面显示时都重新加载
  useEffect(() => {
    loadUserInfo();
  }, []);

  // 监听路由参数变化
  useEffect(() => {
    const handleRouteChange = () => {
      loadUserInfo();
    };
    
    // 监听页面显示
    Taro.eventCenter.on('__taroRouterChange', handleRouteChange);
    
    return () => {
      Taro.eventCenter.off('__taroRouterChange', handleRouteChange);
    };
  }, []);

  const switch_is_show_raw_uname = () => setIsShowRawUname(!is_show_raw_uname);

  const handleLogin = () => {
    Taro.navigateTo({
      url: '/modules/pages/login/index'
    });
  };

  const handleLogout = () => {
    Taro.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          Taro.removeStorageSync('is_loggedin_xxt');
          Taro.removeStorageSync('userInfo');
          setIsLoggedinXxt(false);
          setNickname('');
          setRawUsername('');
          setUsername('');
		  logout();
          Taro.showToast({
            title: '已退出登录',
            icon: 'success'
          });

        }
      }
    });
  };

  return (
    <SafeAreaView>
      <HeadStatus text='我的'></HeadStatus>

      <View className='bora card item user'>
        <View className='nick-name'>
          {nickname ? nickname : (is_loggedin_xxt ? '用户' : '昵称')}
        </View>

        <View className='user-name' onClick={switch_is_show_raw_uname}>
          {is_loggedin_xxt ? (
            raw_username && is_show_raw_uname ? raw_username : (username || '账号')
          ) : (
            '未登录'
          )}
        </View>
      </View>

      <View className='container'>
        <View className='bora card list'>
          <View className='item' onClick={() => {}}>
            <Text>设置</Text>
          </View>
          <View className='item' onClick={() => {}}>
            <Text>常见问题</Text>
          </View>
          <View className='item' onClick={() => {}}>
            <Text>关于我们</Text>
          </View>
          <View className='item' onClick={() => {}}>
            <Text>反馈与建议</Text>
          </View>
          <View className='item' onClick={() => {}}>
            <Text>分享小程序</Text>
          </View>
        </View>
      </View>

      {!is_loggedin_xxt ? (
        <View className='bora login-btn highlight-btn' onClick={handleLogin}>
          <Text>立即登录</Text>
        </View>
      ) : (
        <View className='bora logout-btn' onClick={handleLogout}>
          <Text>退出登录</Text>
        </View>
      )}
      
    </SafeAreaView>
  );
}