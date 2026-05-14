// index.jsx
import { useState, useEffect } from "react";
import { View, ScrollView } from "@tarojs/components";
import SafeAreaView from "../../components/safeView";
import CourseHeader from "../../components/courseHeader";
import WeekHeader from "../../components/courseWeek";
import CourseTable from "../../components/courseTable";
import { getCurrentWeek } from "../../service/hubt/CurrentWeek";
import "./index.css";

export default function Index() {
	const [currentWeek, setCurrentWeek] = useState(null);

	useEffect(() => {
		getCurrentWeek().then((week) => setCurrentWeek(week));
	}, []);

	const handleWeekChange = (week) => {
		setCurrentWeek(week);
	};

	if (currentWeek === null) return <View>加载中...</View>;

	return (
		<SafeAreaView>
			<CourseHeader
				currentWeek={currentWeek}
				onWeekChange={handleWeekChange}
			/>
			<WeekHeader currentWeek={currentWeek} />
			<CourseTable currentWeek={currentWeek} />
		</SafeAreaView>
	);
}
