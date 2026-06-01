import { useLaunch } from "@tarojs/taro";
import "./app.css";
import runtimeLogger from "./utils/runtimeLogger";
import { ThemeProvider } from "./utils/theme";
import 'taro-icons/scss/MaterialCommunityIcons.scss';

function App({ children }) {
	useLaunch(async () => {
		runtimeLogger.info("App", `应用启动 (${process.env.TARO_ENV || "unknown"})`);
	});

	return <ThemeProvider>{children}</ThemeProvider>;
}

export default App;
