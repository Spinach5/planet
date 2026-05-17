import { useLaunch } from "@tarojs/taro";
import "./app.css";
import "./static/css/font-awesome.css"

function App({ children }) {
	useLaunch(async () => {
		console.log("App launched.");

	});

	return children;
}

export default App;
