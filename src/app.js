import { useLaunch } from "@tarojs/taro";
import "./app.scss";
import cacheManager from "./utils/cache";

function App({ children }) {
	useLaunch(async () => {
		console.log("App launched.");

		// 异步初始化缓存
		console.log("清空缓存")
		await cacheManager.clear();

	});

	return children;
}

export default App;
