export const presets = [
	[
		"taro",
		{
			framework: "react",
			ts: false,
			compiler: "vite",
			useBuiltIns: process.env.TARO_ENV === "h5" ? "usage" : false,
		},
	],
];

export const plugins = [
	[
		"import",
		{
			libraryName: "@nutui/nutui-react-taro",
			camel2DashComponentName: false,
			customName: (name, file) => {
				return `@nutui/nutui-react-taro/dist/es/packages/${name.toLowerCase()}`;
			},
			// 自动加载 scss 样式文件
			customStyleName: (name) =>
				`@nutui/nutui-react-taro/dist/es/packages/${name.toLowerCase()}/style`,
			// 自动加载 css 样式文件
			// customStyleName: (name) => `@nutui/nutui-react-taro/dist/es/packages/${name.toLowerCase()}/style/css`

			// JMAPP 主题
			// 自动加载 scss 样式文件
			// customStyleName: (name) => `@nutui/nutui-react-taro/dist/es/packages/${name.toLowerCase()}/style-jmapp`,
			// 自动加载 css 样式文件
			// customStyleName: (name) => `@nutui/nutui-react-taro/dist/es/packages/${name.toLowerCase()}/style-jmapp/css`

			// jrkf 端主题
			// 自动加载 scss 样式文件
			// customStyleName: (name) => `@nutui/nutui-react-taro/dist/es/packages/${name.toLowerCase()}/style-jrkf`,
			// 自动加载 css 样式文件
			// customStyleName: (name) => `@nutui/nutui-react-taro/dist/es/packages/${name.toLowerCase()}/style-jrkf/css`
		},
		"nutui-react",
	],
];
