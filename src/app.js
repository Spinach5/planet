import { useLaunch } from "@tarojs/taro";
import "./app.css";

function App({ children }) {
	useLaunch(async () => {
		console.log("App launched.");

	});

	return children;
}

export default App;
