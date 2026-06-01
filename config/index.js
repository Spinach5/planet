import { defineConfig } from "@tarojs/cli";
import devConfig from "./dev";
import prodConfig from "./prod";

export default defineConfig(async (merge, { command, mode }) => {
	const baseConfig = {
		projectName: "zqw",
		date: "2026-4-27",
		designWidth: 750,
		deviceRatio: {
			640: 2.34 / 2,
			750: 1,
			375: 2,
			828: 1.81 / 2,
		},
		sourceRoot: "src",
		outputRoot: `dist/${process.env.TARO_ENV}`,
		plugins: ["@tarojs/plugin-generator"],
		defineConstants: {},
		copy: {
			patterns: [],
			options: {},
		},
		framework: "react",
		compiler: process.env.TARO_ENV === "rn" ? "webpack5" : {
			type: "vite",
			vitePlugins: [{
				name: "fix-taro-icons-jsx",
				config: () => ({
					optimizeDeps: {
						esbuildOptions: {
							loader: { ".js": "jsx" },
						},
					},
				}),
			}],
		},
		mini: {
			optimizeMainPackage: {
				enable: true,
			},
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
			esnextModules: ["taro-ui"],
			// 添加代理配置
			devServer: {
				port: 10086,
				proxy: {
					"/gitee": {
						target: "https://gitee.com",
						changeOrigin: true,
						rewrite: (path) => path.replace(/^\/gitee/, ""),
						configure: (proxy, options) => {
							proxy.on("proxyRes", (proxyRes, req, res) => {
								console.log("proxyRes触发");
								if (proxyRes.headers.location) {
									let location = proxyRes.headers.location;
									if (location.startsWith("/")) {
										proxyRes.headers.location =
											"/gitee" + location;
									} else if (location.indexOf("gitee.com")) {
										const relative = location.replace(
											/https?:\/\/[^/]+/,
											"",
										);
										proxyRes.headers.location =
											"/gitee" + relative;
									}
									console.log(
										"修改后的 location:",
										proxyRes.headers.location,
									);
								}
							});
						},
					},
					"/opendiff": {
						target: "https://api.zxionf.top",
						changeOrigin: true,
						rewrite: (path) => path.replace(/^\/opendiff/, ""),
						configure: (proxy, options) => {
							proxy.on("proxyRes", (proxyRes, req, res) => {
								console.log("proxyRes触发");
								if (proxyRes.headers.location) {
									let location = proxyRes.headers.location;
									if (location.startsWith("/")) {
										proxyRes.headers.location =
											"/opendiff" + location;
									} else if (
										location.indexOf("api.zxionf.top")
									) {
										const relative = location.replace(
											/https?:\/\/[^/]+/,
											"",
										);
										proxyRes.headers.location =
											"/opendiff" + relative;
									}
									console.log(
										"修改后的 location:",
										proxyRes.headers.location,
									);
								}
							});
						},
					},
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
										location.indexOf("jwxt.hbut.edu.cn")
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
	};

	process.env.BROWSERSLIST_ENV = process.env.NODE_ENV;

	if (process.env.NODE_ENV === "development") {
		return merge({}, baseConfig, devConfig);
	}
	return merge({}, baseConfig, prodConfig);
});
