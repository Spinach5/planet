import { useLaunch } from "@tarojs/taro";
import "./app.css";
import 'taro-ui/dist/style/index.scss'

function App({ children }) {
	useLaunch(async () => {
		console.log("App launched.");

	});

	return children;
}

export default App;
