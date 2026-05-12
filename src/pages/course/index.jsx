import { useState } from "react";
import { Text, View, Image } from "@tarojs/components";
import SafeAreaView from "../../components/safeView";
import "./index.scss";
import Btn from "../../components/Btn";
import CourseHeader from "../../components/courseHeader";
import WeekHeader from "../../components/courseWeek";

export default function Index() {

	return (
		<SafeAreaView>
			{/* 工具栏 */}
			<CourseHeader />
			<WeekHeader />
			
		</SafeAreaView>
	);
}
