// pages/course/index.jsx
import { useState, useEffect, useCallback } from "react";
import {
	View,
	Swiper,
	SwiperItem,
	ScrollView,
	Text,
	Picker,
	Input,
	Button,
} from "@tarojs/components";
import Taro, { useRouter, useDidShow } from "@tarojs/taro";
import SafeAreaView from "../../components/safeView";
import CourseHeader from "../../components/courseHeader";
import WeekHeader from "../../components/courseWeek";
import TimeColumn from "../../components/courseTimeColumn";
import CourseGrid from "../../components/courseGrid";
import { getCurrentWeek } from "../../service/hubt/CurrentWeek";
import { getAllWeek } from "../../service/hubt/GetAllWeek";
import { getAllSchedule } from "../../service/hubt/AllSchedule";
import { getTimeTable } from "../../service/hubt/GetTimeTable";
import { getColorFromName } from "../../utils/getHashCode";
import { getSemeseterList } from "../../service/hubt/CurrentSemester";
import { addSchedule } from "../../service/AddSchedule";
import userManager from "../../service/userInfo";
import "./index.css";

const DetailRow = ({ label, value }) => {
	const displayValue = value && value !== "undefined" ? value : "未知";
	return (
		<View
			style={{
				display: "flex",
				flexDirection: "row",
				justifyContent: "space-between",
				alignItems: "flex-start",
			}}
		>
			<Text
				style={{
					fontWeight: "bold",
					fontSize: "16px",
					color: "#333",
					flexShrink: 0,
				}}
			>
				{label}：
			</Text>
			<Text
				style={{
					fontSize: "16px",
					color: "#555",
					flex: 1,
					textAlign: "left",
					wordBreak: "break-word",
					whiteSpace: "normal",
				}}
			>
				{displayValue}
			</Text>
		</View>
	);
};

export default function Index() {
	const router = useRouter();
	const currentPath = router.path.split("?")[0];

	// 登录状态
	const [isLoggedIn, setIsLoggedIn] = useState(null);

	// 课表核心数据
	const [semesterList, setSemesterList] = useState([]);
	const [currentSemester, setCurrentSemester] = useState(null);
	const [currentWeek, setCurrentWeek] = useState(null);
	const [actualWeek, setActualWeek] = useState(null);
	const [weekList, setWeekList] = useState([]);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [timeTable, setTimeTable] = useState([]);
	const [courses, setCourses] = useState([]);
	const [loading, setLoading] = useState(true);
	const [weeksData, setWeeksData] = useState({});
	const [modalVisible, setModalVisible] = useState(false);
	const [currentCourse, setCurrentCourse] = useState(null);
	const [weeksDataReady, setWeeksDataReady] = useState(false);

	// 添加课程弹窗
	const [addModalVisible, setAddModalVisible] = useState(false);
	const [addForm, setAddForm] = useState({
		kcmc: "",
		teacher: "",
		startJc: "",
		endJc: "",
		startWeek: "",
		endWeek: "",
		weekDay: "1",
		classroom: "",
	});

	// 学期选择器显示控制
	const [semesterPickerVisible, setSemesterPickerVisible] = useState(false);

	const openModal = useCallback((course) => {
		setCurrentCourse(course);
		setModalVisible(true);
	}, []);

	const closeModal = useCallback(() => {
		setModalVisible(false);
		setCurrentCourse(null);
	}, []);

	const resetCourseData = useCallback(() => {
		setCurrentSemester(null);
		setCurrentWeek(null);
		setActualWeek(null);
		setWeekList([]);
		setCurrentIndex(0);
		setTimeTable([]);
		setCourses([]);
		setLoading(true);
		setWeeksData({});
		setModalVisible(false);
		setCurrentCourse(null);
	}, []);

	// 刷新课表（重新加载当前学期的数据）
	const refreshCourseData = useCallback(async () => {
		if (!isLoggedIn || !currentSemester) return;
		setLoading(true);
		try {
			const [scheduleData, timeData] = await Promise.all([
				getAllSchedule(false, currentSemester),
				getTimeTable(currentSemester),
			]);
			setCourses(scheduleData || []);
			setTimeTable(timeData || []);
		} catch (err) {
			console.error("刷新课表失败", err);
			Taro.showToast({ title: "刷新失败", icon: "none" });
		} finally {
			setLoading(false);
		}
	}, [isLoggedIn, currentSemester]);

	// 检测登录状态
	const checkLoginStatus = useCallback(() => {
		try {
			const loggedIn = userManager.checkLogin();
			if (loggedIn && !isLoggedIn) {
				resetCourseData();
				setIsLoggedIn(true);
			} else if (!loggedIn && isLoggedIn === true) {
				resetCourseData();
				setIsLoggedIn(false);
			} else if (isLoggedIn === null) {
				setIsLoggedIn(loggedIn);
				if (!loggedIn) resetCourseData();
			}
		} catch (error) {
			console.error("获取登录状态失败", error);
			if (isLoggedIn === true) resetCourseData();
			setIsLoggedIn(false);
		}
	}, [isLoggedIn, resetCourseData]);

	useEffect(() => {
		checkLoginStatus();
	}, [checkLoginStatus]);

	useDidShow(() => {
		checkLoginStatus();
	});

	// 获取学期列表
	useEffect(() => {
		if (!isLoggedIn) return;
		getSemeseterList()
			.then((list) => {
				setSemesterList(list);
				if (list && list.length) {
					setCurrentSemester(list[list.length - 1]); // 默认选中最后一个学期
				}
			})
			.catch((err) => {
				console.error("获取学期列表失败", err);
				Taro.showToast({ title: "获取学期失败", icon: "none" });
			});
	}, [isLoggedIn]);

	useEffect(() => {
		if (
			weekList.length &&
			Object.keys(weeksData).length === weekList.length
		) {
			setWeeksDataReady(true);
		} else {
			setWeeksDataReady(false);
		}
	}, [weekList, weeksData]);
	// 获取周次列表
	useEffect(() => {
		if (!isLoggedIn || !currentSemester) return;
		console.log("选中的学期", currentSemester);
		Promise.all([getCurrentWeek(), getAllWeek(currentSemester)])
			.then(([week, weeks]) => {
				// 统一转为数字类型，避免字符串与数字比较问题
				const weeksNum = weeks.map((w) => parseInt(w, 10));
				const weekNum = parseInt(week, 10);
				let validWeek = weekNum;
				if (!weeksNum.indexOf(weekNum)) {
					validWeek = weeksNum[0] || 1;
					console.warn(
						`当前周 ${weekNum} 不在周列表中，已重置为 ${validWeek}`,
					);
				}
				setWeekList(weeksNum);
				setCurrentWeek(validWeek);
				setActualWeek(validWeek);
				const idx = weeksNum.indexOf(validWeek);
				setCurrentIndex(idx >= 0 ? idx : 0);
			})
			.catch((err) => {
				console.error("获取周次失败", err);
				setWeekList([]);
			});
	}, [isLoggedIn, currentSemester]);
	// 加载课程和时间表（依赖当前学期）
	useEffect(() => {
		if (!isLoggedIn || !currentSemester) return;
		setLoading(true);
		Promise.all([
			getAllSchedule(false, currentSemester),
			getTimeTable(currentSemester),
		])
			.then(([scheduleData, timeData]) => {
				setCourses(scheduleData || []);
				setTimeTable(timeData || []);
			})
			.catch((err) => {
				console.error("获取课表失败", err);
				setCourses([]);
				setTimeTable([]);
			})
			.finally(() => setLoading(false));
	}, [isLoggedIn, currentSemester]);

	// 当 weekList 或 currentWeek 变化时，确保 Swiper 索引同步
	useEffect(() => {
		if (weekList.length && currentWeek) {
			const idx = weekList.indexOf(currentWeek);
			if (idx !== -1 && idx !== currentIndex) {
				setCurrentIndex(idx);
			}
		}
	}, [weekList, currentWeek]);
	// 预处理所有周的课程网格数据
	useEffect(() => {
		if (
			!isLoggedIn ||
			loading ||
			weekList.length === 0 ||
			timeTable.length === 0 ||
			courses.length === 0
		)
			return;
		const periodIndexMap = {};
		timeTable.forEach((item, idx) => {
			periodIndexMap[parseInt(item.jc)] = idx;
		});
		const newData = {};
		for (const week of weekList) {
			const weekCourses = courses.filter((course) =>
				course.zcstr?.some((w) => parseInt(w) === parseInt(week)),
			);
			const gridItems = weekCourses
				.map((course, idx) => {
					const weekDay = parseInt(course.xingqi);
					const colIndex = weekDay - 1;
					const periods = course.djc.map((p) => parseInt(p));
					if (!periods.length) return null;
					const startPeriod = Math.min(...periods);
					const endPeriod = Math.max(...periods);
					const startRow = periodIndexMap[startPeriod];
					const endRow = periodIndexMap[endPeriod];
					if (startRow === undefined || endRow === undefined)
						return null;
					const rowSpan = endRow - startRow + 1;
					return {
						id: `${course.kcmc}_${course.xingqi}_${startPeriod}_${idx}`,
						name: course.kcmc,
						room: course.croommc,
						teacher: course.tmc,
						col: colIndex,
						row: startRow,
						rowSpan,
						color: getColorFromName(course.kcmc),
						kcxz: course.kcxz || "未知",
						xf: course.xf || "未知",
						jxbzc: course.jxbzc || "未知",
						weeks: course.zcstr ? course.zcstr.join(",") : "未知",
						periods: course.djc.join(","),
						weekDay: course.xingqi,
					};
				})
				.filter((item) => item !== null);
			newData[week] = gridItems;
		}
		setWeeksData(newData);
	}, [isLoggedIn, loading, weekList, timeTable, courses]);

	const handleWeekChange = useCallback(
		(week) => {
			const idx = weekList.indexOf(week);
			if (idx !== -1 && idx !== currentIndex) {
				setCurrentIndex(idx);
				setCurrentWeek(week);
			}
		},
		[weekList, currentIndex],
	);

	// TODO 在其他学期触发时切回本学期
	const handleBackToCurrentWeek = useCallback(() => {
		if (actualWeek && weekList.length > 0) {
		const idx = weekList.indexOf(actualWeek);
		if (idx !== -1) {
			setCurrentIndex(idx);
			setCurrentWeek(actualWeek);
		}
		}
	}, [actualWeek, weekList]);

	const onSwiperChange = useCallback(
		(e) => {
			const idx = e.detail.current;
			const week = weekList[idx];
			if (week && week !== currentWeek) {
				setCurrentIndex(idx);
				setCurrentWeek(week);
			}
		},
		[weekList, currentWeek],
	);

	// 选择学期（Picker 确认后）
	const handleSemesterChange = (e) => {
		const idx = e.detail.value;
		const selected = semesterList[idx];
		if (selected && selected !== currentSemester) {
			setCurrentSemester(selected);
		}
		setSemesterPickerVisible(false);
	};

	// 添加课程
	const handleAddCourse = async () => {
		const {
			kcmc,
			startJc,
			endJc,
			startWeek,
			endWeek,
			weekDay,
			teacher,
			classroom,
		} = addForm;
		if (!kcmc || !startJc || !endJc || !startWeek || !endWeek) {
			Taro.showToast({ title: "请填写完整必填项", icon: "none" });
			return;
		}
		const sJc = parseInt(startJc);
		const eJc = parseInt(endJc);
		const sWeek = parseInt(startWeek);
		const eWeek = parseInt(endWeek);
		if (Number.isNaN(sJc) || Number.isNaN(eJc) || sJc > eJc) {
			Taro.showToast({ title: "节次范围无效", icon: "none" });
			return;
		}
		if (Number.isNaN(sWeek) || Number.isNaN(eWeek) || sWeek > eWeek) {
			Taro.showToast({ title: "周数范围无效", icon: "none" });
			return;
		}
		const schedule = {
			kcmc,
			tmc: teacher || "",
			croommc: classroom || "",
			xingqi: parseInt(weekDay),
			djc: [sJc, eJc],
			zcstr: Array.from(
				{ length: eWeek - sWeek + 1 },
				(_, i) => sWeek + i,
			),
		};
		try {
			await addSchedule(currentSemester, schedule);
			Taro.showToast({ title: "添加成功", icon: "success" });
			setAddModalVisible(false);
			setAddForm({
				kcmc: "",
				teacher: "",
				startJc: "",
				endJc: "",
				startWeek: "",
				endWeek: "",
				weekDay: "1",
				classroom: "",
			});
			await refreshCourseData(); // 刷新课表
		} catch (err) {
			console.error("添加课程失败", err);
			Taro.showToast({ title: "添加失败", icon: "none" });
		}
	};

	// 加载界面
	if (isLoggedIn === null) {
		return (
			<SafeAreaView currentPath={currentPath}>
				<View className="loading-container">
					<View className="loading-text">加载中...</View>
				</View>
			</SafeAreaView>
		);
	}
	if (!isLoggedIn) {
		return (
			<SafeAreaView currentPath={currentPath}>
				<View
					style={{
						flex: 1,
						display: "flex",
						justifyContent: "center",
						alignItems: "center",
					}}
				>
					<Text
						style={{
							fontSize: "80px",
							fontWeight: "bold",
							textAlign: "center",
							color: "#333",
						}}
					>
						请先登录!
					</Text>
				</View>
			</SafeAreaView>
		);
	}
	const isLoading =
		loading ||
		!currentSemester ||
		!currentWeek ||
		weekList.length === 0 ||
		timeTable.length === 0;
	if (isLoading) {
		return (
			<SafeAreaView currentPath={currentPath}>
				<View className="loading-container">
					<View className="loading-text">加载中...</View>
				</View>
			</SafeAreaView>
		);
	}
	if (!weeksDataReady) {
		return (
			<View className="loading-container">
				<View className="loading-text">加载课程数据中...</View>
			</View>
		);
	}
	const swiperHeight = timeTable.length * 150; // 单位 px
	return (
		<SafeAreaView currentPath={currentPath}>
			<CourseHeader
				currentSemester={currentSemester}
				currentWeek={currentWeek}
				onWeekChange={handleWeekChange}
				onRefresh={refreshCourseData}
				onSelectSemester={() => setSemesterPickerVisible(true)}
				onAddCourse={() => setAddModalVisible(true)}
			/>
			<WeekHeader currentWeek={currentWeek} />
			<ScrollView
				scrollY
				className="outer-scroll"
				showScrollbar={false}
				enhanced
				bounces={false}
			>
				<View className="schedule-row">
					<TimeColumn timeTable={timeTable} />

					<View
						className="swiper-col"
						style={{ height: `${swiperHeight}rpx` }}
					>
						<Swiper
							current={currentIndex}
							onChange={onSwiperChange}
							className="week-swiper"
							circular={false}
							autoplay={false}
							indicatorDots={false}
						>
							{weekList.map((week) => (
								<SwiperItem key={week}>
									<CourseGrid
										gridCourses={weeksData[week] || []}
										rowCount={timeTable.length}
										onCardClick={openModal}
									/>
								</SwiperItem>
							))}
						</Swiper>
					</View>
				</View>
			</ScrollView>
			{/* 返回本周的按钮 */}
			{actualWeek && currentWeek !== actualWeek && (<View className="gobacktoday" onClick={handleBackToCurrentWeek}>返回本周</View>)}
			{/* 课程详情弹窗 */}
			{modalVisible && currentCourse && (
				<View className="course-info" onClick={closeModal}>
					<View
						style={{
							width: "80%",
							maxWidth: "500px",
							backgroundColor: "#fff",
							borderRadius: "16px",
							overflow: "hidden",
							padding: "10px",
						}}
						onClick={(e) => e.stopPropagation()}
					>
						<View
							style={{
								textAlign: "center",
								padding: "16px",
								fontSize: "30px",
								fontWeight: "bold",
								color: "#000",
							}}
						>
							课程信息
						</View>
						<ScrollView
							scrollY
							style={{ maxHeight: "60vh", padding: "5px" }}
						>
							<View
								style={{
									display: "flex",
									flexDirection: "column",
									gap: "12px",
								}}
							>
								<DetailRow
									label="课程名称"
									value={currentCourse.name}
								/>
								<DetailRow
									label="教师"
									value={currentCourse.teacher}
								/>
								<DetailRow
									label="教室"
									value={currentCourse.room}
								/>
								<DetailRow
									label="课程性质"
									value={currentCourse.kcxz}
								/>
								<DetailRow
									label="学分"
									value={currentCourse.xf}
								/>
								<DetailRow
									label="教学班组成"
									value={currentCourse.jxbzc}
								/>
								<DetailRow
									label="周次"
									value={currentCourse.weeks}
								/>
								<DetailRow
									label="节次"
									value={currentCourse.periods}
								/>
								<DetailRow
									label="星期"
									value={`星期${currentCourse.weekDay}`}
								/>
							</View>
						</ScrollView>
					</View>
				</View>
			)}

			{/* 学期选择器（隐藏的Picker，通过可见状态控制） */}
			{semesterPickerVisible && (
				<View
					className="picker-mask"
					onClick={() => setSemesterPickerVisible(false)}
				>
					<View
						className="picker-container"
						onClick={(e) => e.stopPropagation()}
					>
						<Picker
							mode="selector"
							range={semesterList}
							onChange={handleSemesterChange}
						>
							<View
								style={{
									padding: "20px",
									textAlign: "center",
									background: "#fff",
								}}
							>
								请选择学期
							</View>
						</Picker>
					</View>
				</View>
			)}

			{/* 添加课程弹窗 */}
			{addModalVisible && (
				<View
					className="course-info"
					onClick={() => setAddModalVisible(false)}
				>
					<View
						style={{
							width: "85%",
							maxWidth: "500px",
							backgroundColor: "#fff",
							borderRadius: "16px",
							overflow: "hidden",
							padding: "20px",
						}}
						onClick={(e) => e.stopPropagation()}
					>
						<View
							style={{
								textAlign: "center",
								paddingBottom: "16px",
								fontSize: "30px",
								fontWeight: "bold",
								color: "#000",
							}}
						>
							添加课程
						</View>
						<ScrollView scrollY style={{ maxHeight: "70vh" }}>
							<View
								style={{
									display: "flex",
									flexDirection: "column",
									gap: "12px",
								}}
							>
								<Input
									placeholder="课程名称 *"
									value={addForm.kcmc}
									onInput={(e) =>
										setAddForm({
											...addForm,
											kcmc: e.detail.value,
										})
									}
								/>
								<Input
									placeholder="教师"
									value={addForm.teacher}
									onInput={(e) =>
										setAddForm({
											...addForm,
											teacher: e.detail.value,
										})
									}
								/>
								<Input
									placeholder="开始节次 *"
									value={addForm.startJc}
									onInput={(e) =>
										setAddForm({
											...addForm,
											startJc: e.detail.value,
										})
									}
								/>
								<Input
									placeholder="结束节次 *"
									value={addForm.endJc}
									onInput={(e) =>
										setAddForm({
											...addForm,
											endJc: e.detail.value,
										})
									}
								/>
								<Input
									placeholder="开始周 *"
									value={addForm.startWeek}
									onInput={(e) =>
										setAddForm({
											...addForm,
											startWeek: e.detail.value,
										})
									}
								/>
								<Input
									placeholder="结束周 *"
									value={addForm.endWeek}
									onInput={(e) =>
										setAddForm({
											...addForm,
											endWeek: e.detail.value,
										})
									}
								/>
								<Picker
									mode="selector"
									range={[
										"周一",
										"周二",
										"周三",
										"周四",
										"周五",
										"周六",
										"周日",
									]}
									onChange={(e) =>
										setAddForm({
											...addForm,
											weekDay: (
												parseInt(e.detail.value) + 1
											).toString(),
										})
									}
								>
									<View
										style={{
											borderBottom: "1px solid #ccc",
											padding: "8px 0",
										}}
									>
										星期：
										{
											[
												"周一",
												"周二",
												"周三",
												"周四",
												"周五",
												"周六",
												"周日",
											][parseInt(addForm.weekDay) - 1]
										}
									</View>
								</Picker>
								<Input
									placeholder="教室"
									value={addForm.classroom}
									onInput={(e) =>
										setAddForm({
											...addForm,
											classroom: e.detail.value,
										})
									}
								/>
								<View
									style={{
										flexDirection: "row",
										justifyContent: "space-between",
										marginTop: "20px",
									}}
								>
									<View
										onClick={() =>
											setAddModalVisible(false)
										}
										style={{
											padding: "10px 20px",
											backgroundColor: "#ccc",
											borderRadius: "8px",
										}}
									>
										取消
									</View>
									<View
										onClick={handleAddCourse}
										style={{
											padding: "10px 20px",
											backgroundColor: "#47a5fd",
											color: "#fff",
											borderRadius: "8px",
										}}
									>
										确定
									</View>
								</View>
							</View>
						</ScrollView>
					</View>
				</View>
			)}
		</SafeAreaView>
	);
}
