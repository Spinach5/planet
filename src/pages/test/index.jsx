import "./index.scss";
import SafeAreaView from "../../components/safeView";
import { Button } from "@tarojs/components";
import { login } from "../../utils/hbut/login";
import { getCurrentWeek } from "../../service/hubt/CurrentWeek";
import { getExtroInfo } from "../../service/hubt/ExtroInfo";
import { getXhid } from "../../service/hubt/GetXhid";
import { getSchedule } from "../../service/hubt/Schedule";
import { getAllWeek } from "../../service/hubt/GetAllWeek";

export default function Index() {
	return (
		<SafeAreaView className="">
			<Button
				type="primary"
				style={{ margin: "0px" }}
				onClick={() => login("2410321409", "Spinach114514!")}
			>
				登录
			</Button>
			<Button
				type="info"
				style={{ margin: "0px" }}
				onClick={async () => console.log(await getCurrentWeek())}
			>
				当前周数
			</Button>
			<Button
				type="default"
				style={{ margin: "0px" }}
				onClick={async () => console.log(await getExtroInfo())}
			>
				所有周数清单
			</Button>
			<Button
				type="danger"
				style={{ margin: "0px" }}
				onClick={async () => console.log(await getXhid())}
			>
				获取xhid
			</Button>
			<Button
				type="warning"
				style={{ margin: "0px" }}
				onClick={async () =>
					console.log(await getSchedule("2026-5-11"))
				}
			>
				今日课表
			</Button>
			<Button
				type="success"
				style={{ margin: "0px" }}
				onClick={async () => console.log(await getAllWeek())}
			>
				所有周次
			</Button>
		</SafeAreaView>
	);
}
