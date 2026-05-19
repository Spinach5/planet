import "./index.css";
import SafeAreaView from "../../components/safeView";
import Taro, { useRouter } from "@tarojs/taro";
import { Button, Icon, View, Text } from "@tarojs/components";
import { login } from "../../service/login";
import { getCurrentWeek } from "../../service/hubt/CurrentWeek";
import { getExtroInfo } from "../../service/hubt/ExtroInfo";
import { getDailySchedule } from "../../service/hubt/DailySchedule";
import { getAllWeek } from "../../service/hubt/GetAllWeek";
import { getXhid } from "../../service/hubt/GetXhid";
import { getSemeseterList } from "../../service/hubt/CurrentSemester";
import { getAllSchedule } from "../../service/hubt/AllSchedule";
import { getExamInfo } from "../../service/hubt/ExamInfo";
import { getScores } from "../../service/hubt/Scores";
import { getTimeTable } from "../../service/hubt/GetTimeTable";
import { getStuInfo } from "../../service/hubt/StuInfo";
import { cleanH5Cookies } from "../../utils/cleanH5Cookies";
import SearchBar from "../../components/SearchBar"

export default function Index() {
	const router = useRouter();
	const currentPath = router.path.split('?')[0];
	return (
		<SafeAreaView currentPath={currentPath}>
			<Button
				type="info"
				style={{ margin: "0px" }}
				onClick={async () => console.log(await getStuInfo())}
			>
				获取学生信息
			</Button>
			<Button
				type="info"
				style={{ margin: "0px" }}
				onClick={async () => console.log(await getAllSchedule())}
			>
				获取课表
			</Button>
			<Button
				type="info"
				style={{ margin: "0px" }}
				onClick={async () => console.log(await getTimeTable())}
			>
				获取课表时间
			</Button>
			<Button
				type="info"
				style={{ margin: "0px" }}
				onClick={async () => console.log(await getScores())}
			>
				获取当前分数
			</Button>
			<Button
				type="primary"
				style={{ margin: "0px" }}
				onClick={async () => console.log(await getExamInfo())}
			>
				获取考试信息
			</Button>
			<Button
				type="primary"
				style={{ margin: "0px" }}
				onClick={async () => console.log(await getSemeseterList())}
			>
				获取当前学期
			</Button>
			<Button
				type="primary"
				style={{ margin: "0px" }}
				onClick={() => login()}
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
				实习信息
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
					console.log(await getDailySchedule("2026-5-11"))
				}
			>
				今日课表
			</Button>
			<Button
				type="warning"
				style={{ margin: "0px" }}
				onClick={async () =>
					console.log(await getAllSchedule("2025-2026-1"))
				}
			>
				所有课表
			</Button>
			<Button
				type="success"
				style={{ margin: "0px" }}
				onClick={async () => console.log(await getAllWeek())}
			>
				所有周次
			</Button>
			<Button
				type="success"
				style={{ margin: "0px" }}
				onClick={async () => {
					Taro.setStorageSync("shit", "shit");
				}}
			>
				测试set缓存
			</Button>
			<Button
				type="success"
				style={{ margin: "0px" }}
				onClick={async () => {
					Taro.getStorageSync("shit");
				}}
			>
				测试get缓存
			</Button>
			<Button
				type="success"
				style={{ margin: "0px" }}
				onClick={async () => {
					console.log(await getTimeTable("2025-2026-1"));
				}}
			>
				测试获取每天课程时间
			</Button>
			<Button
				type="success"
				style={{ margin: "0px" }}
				onClick={async () => {
					await cleanH5Cookies();
				}}
			>
				清除H5cookies
			</Button>
			<Text
				class="arrow-left"
				style="font-size:48px; color:#F00"
			></Text>
			<SearchBar placeholder="er"></SearchBar>
			<View>
				<View class="fa  fa-spin fa fa-hand-peace-o" />
			</View>
		</SafeAreaView>
	);
}
