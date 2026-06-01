import { useState, useEffect, useCallback, useRef } from "react";
import {
	View,
	Swiper,
	SwiperItem,
	ScrollView,
	Text,
} from "@tarojs/components";
import Taro, { useRouter, useDidShow, usePullDownRefresh } from "@tarojs/taro";
import SafeAreaView from "../../components/SafeAreaView";
import CourseHeader from "../../components/CourseHeader";
import WeekHeader from "../../components/WeekHeader";
import TimeColumn from "../../components/TimeColumn";
import CourseGrid from "../../components/CourseGrid";
import Loading from "../../components/Loading";
import CourseInfoModal from "../../components/CourseInfoModal";
import { getCurrentWeek, getAllWeek, getAllSchedule, getTimeTable, getSemesterList } from "../../service";
import { getColorFromName } from "../../utils/getHashCode";
import { addSchedule } from "../../service/AddSchedule";
import userManager from "../../service/userInfo";
import runtimeLogger from "../../utils/runtimeLogger";
import "./index.css";

export default function Index() {
	const router = useRouter();
	const currentPath = router.path.split("?")[0];

	const [isLoggedIn, setIsLoggedIn] = useState(null);
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
	const [isTimeout, setIsTimeout] = useState(false);
	const timeoutRef = useRef(null);

	// 学期选择器显示控制

	// 打开课程详情弹窗
	const openModal = useCallback((course) => {
		setCurrentCourse(course);
		setModalVisible(true);
	}, []);

	// 关闭课程详情弹窗
	const closeModal = useCallback(() => {
		setModalVisible(false);
		setCurrentCourse(null);
	}, []);

	const handleSemesterChange = useCallback(
		(selectedSemester) => {
			if (selectedSemester && selectedSemester !== currentSemester) {
				setCurrentSemester(selectedSemester);
			}
		},
		[currentSemester],
	);
	// 重置课程数据
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

	// 刷新课表
	const refreshCourseData = useCallback(async (forceRefresh = false) => {
		if (!isLoggedIn || !currentSemester) {
			Taro.showToast({ title: "请先登录", icon: "none" });
			return;
		}
		setLoading(true);
		try {
			const [scheduleData, timeData] = await Promise.all([
				getAllSchedule(forceRefresh, currentSemester),
				getTimeTable(currentSemester),
			]);
			setCourses(scheduleData || []);
			setTimeTable(timeData || []);
			if (forceRefresh) {
				Taro.showToast({ title: "刷新成功", icon: "success", duration: 1000 });
			}
		} catch (err) {
			runtimeLogger.error("Course", "刷新课表失败", err);
			Taro.showToast({ title: "刷新失败", icon: "none" });
		} finally {
			setLoading(false);
		}
	}, [isLoggedIn, currentSemester]);

	// 添加课程回调（传递给 CourseHeader）
	const handleAddCourseConfirm = useCallback(
		async (schedule) => {
			try {
				await addSchedule(schedule);
				Taro.showToast({ title: "添加成功", icon: "success" });
				refreshCourseData(); // 添加后刷新课表
			} catch (err) {
				runtimeLogger.error("Course", "添加课程失败", err);
				Taro.showToast({ title: "添加失败", icon: "none" });
				throw err;
			}
		},
		[refreshCourseData],
	);

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
			runtimeLogger.error("Course", "获取登录状态失败", error);
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
		getSemesterList()
			.then((list) => {
				setSemesterList(list);
				if (list && list.length) {
					setCurrentSemester(list[list.length - 1]);
				}
			})
			.catch((err) => {
				console.error("获取学期列表失败", err);
				Taro.showToast({ title: "获取学期失败", icon: "none" });
			});
	}, [isLoggedIn]);

	// 周数据就绪判断
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
		Promise.all([getCurrentWeek(), getAllWeek(currentSemester)])
			.then(([week, weeks]) => {
				const weeksNum = weeks.map((w) => parseInt(w, 10));
				const weekNum = parseInt(week, 10);
				let validWeek = weekNum;
				if (!weeksNum.indexOf(weekNum)) {
					validWeek = weeksNum[0] || 1;
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

	// 加载课程和时间表
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

	// 同步 Swiper 索引
	useEffect(() => {
		if (weekList.length && currentWeek) {
			const idx = weekList.indexOf(currentWeek);
			if (idx !== -1 && idx !== currentIndex) {
				setCurrentIndex(idx);
			}
		}
	}, [weekList, currentWeek, currentIndex]);

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

	// 课表加载超时控制
	useEffect(() => {
		if (loading) {
			setIsTimeout(false);
			timeoutRef.current = setTimeout(() => {
				setIsTimeout(true);
				setLoading(false);
			}, 15000);
		} else {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
				timeoutRef.current = null;
			}
		}
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
				timeoutRef.current = null;
			}
		};
	}, [loading]);

	usePullDownRefresh(() => {
		refreshCourseData(true).finally(() => {
			Taro.stopPullDownRefresh();
		});
	});

	// 登录状态为空，加载中
	if (isLoggedIn === null) {
		return (
			<SafeAreaView currentPath={currentPath}>
				<Loading />
			</SafeAreaView>
		);
	}

	// 未登录
	if (!isLoggedIn) {
		return (
			<SafeAreaView currentPath={currentPath}>
				<View className="notLoginView">
					<Text className="notLoginText">请先登录!</Text>
				</View>
			</SafeAreaView>
		);
	}

	// 加载超时
	if (isTimeout) {
		return (
			<SafeAreaView currentPath={currentPath}>
				<View className="notLoginView">
					<Text className="notLoginText">加载超时!</Text>
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
				<Loading />
			</SafeAreaView>
		);
	}

	if (!weeksDataReady) {
		return (
			<SafeAreaView currentPath={currentPath}>
				<Loading text="加载课表数据中..." />
			</SafeAreaView>
		);
	}

	const swiperHeight = timeTable.length * 150;

	return (
		<SafeAreaView currentPath={currentPath}>
			<CourseHeader
				currentSemester={currentSemester}
				currentWeek={currentWeek}
				onWeekChange={handleWeekChange}
				onRefresh={() => refreshCourseData(true)}
				onAddCourseConfirm={handleAddCourseConfirm}
				semesterList={semesterList} // 新增
				onSemesterChange={handleSemesterChange} // 新增
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

			{actualWeek && currentWeek !== actualWeek && (
				<View className="gobacktoday" onClick={handleBackToCurrentWeek}>
					返回本周
				</View>
			)}

			{/* 课程详情弹窗 */}
			<CourseInfoModal
				visible={modalVisible}
				course={currentCourse}
				onClose={closeModal}
			/>
		</SafeAreaView>
	);
}
