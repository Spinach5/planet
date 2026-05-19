/* eslint-disable no-undef */
export default defineAppConfig({
	lazyCodeLoading: "requiredComponents",// 按需加载
	pages: ["pages/index/index", "pages/course/index", "pages/user/index"],

	window: {
		backgroundTextStyle: "light",
		navigationBarBackgroundColor: "#fff",
		navigationBarTitleText: "WeChat",
		navigationBarTextStyle: "black",
		navigationStyle: "custom",
	},
	tabBar: {
		custom: true,
		color: "#666666",
		selectedColor: "#007bff",
		backgroundColor: "#ffffff",
		borderStyle: "white",
		list: [
			{
				pagePath: "pages/index/index",
				text: "首页",
			},
			{
				pagePath: "pages/course/index",
				text: "课程",
			},
			{
				pagePath: "pages/user/index",
				text: "我的",
			},
		],
	},
	subPackages: [
    {
      root: 'modules',
      pages: [
        'pages/login/index', // 分包页面
		'pages/club/index'
      ],
    }
  ],

});
