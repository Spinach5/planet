import { defineConfig } from "@tarojs/cli";
import devConfig from "./dev";
import prodConfig from "./prod";

export default defineConfig(async (merge, { command, mode }) => {
	const baseConfig = {
		projectName: "zqw",
		date: "2026-4-27",
		sourceRoot: "src",
		outputRoot: "dist",
		plugins: ["@tarojs/plugin-generator", "@tarojs/plugin-html"],
		designWidth(input) {
			// 配置 NutUI 375 尺寸
			if (input?.file?.replace(/\\+/g, "/").indexOf("@nutui") > -1) {
				return 375;
			}
			// 全局使用 Taro 默认的 750 尺寸
			return 750;
		},
		deviceRatio: {
			640: 2.34 / 2,
			750: 1,
			828: 1.81 / 2,
			375: 2 / 1,
		},
		sass: {
			data: '@import "@nutui/nutui-react-taro/dist/styles/variables.scss";',
			// JMAPP 主题
			// data: `@import '@nutui/nutui-react-taro/dist/styles/variables-jmapp.scss';`
			// JRKF 主题
			// data: `@import '@nutui/nutui-react-taro/dist/styles/variables-jrkf.scss';`
		},
		defineConstants: {},
		copy: {
			patterns: [],
			options: {},
		},
		framework: "react",
		compiler: "vite",
		mini: {
			postcss: {
				pxtransform: {
					enable: true,
					config: {},
				},
				cssModules: {
					enable: false,
					config: {
						namingPattern: "module",
						generateScopedName: "[name]__[local]___[hash:base64:5]",
					},
				},
			},
		},
		h5: {
			publicPath: "/",
			staticDirectory: "static",
			// 添加代理配置
			devServer: {
				port: 10086,
				proxy: {
					"/hbut": {
						target: "https://jwxt.hbut.edu.cn",
						changeOrigin: true,
						rewrite: (path) => path.replace(/^\/hbut/, ""),
						configure: (proxy, options) => {
							proxy.on("proxyRes", (proxyRes, req, res) => {
								console.log("proxyRes触发");
								if (proxyRes.headers.location) {
									let location = proxyRes.headers.location;
									if (location.startsWith("/")) {
										proxyRes.headers.location =
											"/hbut" + location;
									} else if (
										location.includes("jwxt.hbut.edu.cn")
									) {
										const relative = location.replace(
											/https?:\/\/[^/]+/,
											"",
										);
										proxyRes.headers.location =
											"/hbut" + relative;
									}
									console.log(
										"修改后的 location:",
										proxyRes.headers.location,
									);
								}
							});
						},
					},
				},
			},
			miniCssExtractPluginOption: {
				ignoreOrder: true,
				filename: "css/[name].[hash].css",
				chunkFilename: "css/[name].[chunkhash].css",
			},
			postcss: {
				autoprefixer: {
					enable: true,
					config: {},
				},
				cssModules: {
					enable: false,
					config: {
						namingPattern: "module",
						generateScopedName: "[name]__[local]___[hash:base64:5]",
					},
				},
			},
		},
		rn: {
			appName: "taroDemo",
			postcss: {
				cssModules: {
					enable: false,
				},
			},
		},
	};

	process.env.BROWSERSLIST_ENV = process.env.NODE_ENV;

	if (process.env.NODE_ENV === "development") {
		return merge({}, baseConfig, devConfig);
	}
	return merge({}, baseConfig, prodConfig);
});
