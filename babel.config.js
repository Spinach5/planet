// babel-preset-taro 更多选项和默认值：
// https://docs.taro.zone/docs/next/babel-config
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
