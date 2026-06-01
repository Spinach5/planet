import { useLaunch } from "@tarojs/taro";
import "./app.css";
import "taro-ui/lib/style/index.scss";
import runtimeLogger from "./utils/runtimeLogger";
import 'taro-icons/scss/MaterialCommunityIcons.scss';

function App({ children }) {
	useLaunch(async () => {
		runtimeLogger.info("App", `应用启动 (${process.env.TARO_ENV || "unknown"})`);
	});

	return children;
}

export default App;
