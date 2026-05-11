import { Button, Cell } from "@nutui/nutui-react-taro";
import "./index.scss";
import SafeAreaView from "../../components/safeView";
import { login } from "../../utils/hbut/login";
import { getCurrentWeek } from "../../service/hubt/CurrentWeek";
import { getExtroInfo } from "../../service/hubt/ExtroInfo";
import { getXhid } from "../../service/hubt/GetXhid";

export default function Index() {
	return (
		<SafeAreaView className="">
			<Cell style={{ flexWrap: "wrap" }}>
				<Button
					type="primary"
					style={{ margin: "10px" }}
					onClick={() => login("2410321409", "Spinach114514!")}
				>
					登录
				</Button>
				<Button
					type="info"
					style={{ margin: "10px" }}
					onClick={async () => console.log(await getCurrentWeek())}
				>
					当前周数
				</Button>
				<Button
					type="default"
					style={{ margin: "10px" }}
					onClick={async () => console.log(await getExtroInfo())}
				>
					所有周数清单
				</Button>
				<Button
					type="danger"
					style={{ margin: "10px" }}
					onClick={async () => console.log(await getXhid())}
				>
					获取xhid
				</Button>
				<Button type="warning" style={{ margin: "10px" }}>
					今日课表
				</Button>
				<Button type="success" style={{ margin: "10px" }}>
					Success
				</Button>
			</Cell>
		</SafeAreaView>
	);
}
