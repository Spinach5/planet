import { View, Swiper, SwiperItem, Image, Text, Navigator, ScrollView } from '@tarojs/components'
import './index.scss'
import { useState } from 'react'
import SafeAreaView from "../../components/safeView"

export default function Index() {

  const week = ['一', '二', '三', '四', '五', '六', '日']
  const [now_month, setNowMonth] = useState(new Date().getMonth() + 1)
  const [week_days, setWeekDays] = useState([])
  const [course_time, setCourseTime] = useState([])
  const [now_week_courses, setNowWeekCourses] = useState([])
  const [is_show_switch_week, setIsShowSwitchWeek] = useState(false)
  const [is_show_calss_details, setIsShowClassDetails] = useState(false)
  const [selected_course, setSelectedCourse] = useState({})
  const [scrollTop, setScrollTop] = useState(0)
  const [closeClassDetails, setCloseClassDetails] = useState(false)
  const [closeSwitchWeek, setCloseSwitchWeek] = useState(false)
  const showClassDetails = (item) => {
  }
  const switchToWeek = (week_number) => {
  }

  return (
    <SafeAreaView className='page'>
      <View className='gradient'></View>

      {/* 日期区域 */}
      <View className='date'>
        <View className='month'>
          <View style={{ fontWeight: 'bold' }}>{now_month}</View>
          <View>月</View>
        </View>
        <View className='day'>
          {[...Array(7)].map((_, index) => (
            <View
              key={index}
              className={`week ${week_days[index]?.isToday ? 'todayDate' : ''}`}
            >
              <View className='week-item'>周{week[index]}</View>
              <View className='day-item'>{week_days[index]?.fullDate}</View>
            </View>
          ))}
        </View>
      </View>

      {/* 课表区域 */}
      <ScrollView
        scrollX={false}
        scrollY
        scrollTop={scrollTop}
        className='course-scroll'
      >
        <View className='scroll-container'>
          {/* 左侧栏目 */}
          <View className='left'>
            {[...Array(11)].map((_, index) => (
              <View key={index} className='left-line'>
                <View className='number'>{index + 1}</View>
                <View className='time-start'>{course_time[index]?.[0]}</View>
                <View className='time-end'>{course_time[index]?.[1]}</View>
              </View>
            ))}
            <View style={{ fontSize: 'small', height: '120px' }}>其他课程</View>
          </View>

          {/* 右侧课程展示区 */}
          <View className='course'>
            {now_week_courses.map((item, idx) => (
              <View
                key={idx}
                className='kcb-item'
                style={{
                  marginLeft: `${item.isToday != 7 ? item.isToday * 99 : 0}rpx`,
                  marginTop: `${(item.begin_number - 1) * 108.5}rpx`,
                  height: `${item.class_length * 110 - 10}rpx`,
                }}
                onClick={() => showClassDetails(item)}
              >
                <View
                  className='class-info'
                  style={{ backgroundColor: item.color[1] }}
                >
                  <View className='class-location' style={{ color: item.color[0] }}>
                    @{item.location}
                  </View>
                  <View className='class-name' style={{ color: item.color[0] }}>
                    {item.name}
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* 课程详情弹窗 */}
      {is_show_calss_details && (
        <View className='modal-overlay' onClick={closeClassDetails}>
          <View className='modal-content' onClick={(e) => e.stopPropagation()}>
            <View className='bora card list'>
              <View className='item center'>{selected_course.name}</View>
              <View className='item'>@{selected_course.location}</View>
              <View className='item'>{selected_course.teacherName}</View>
              <View className='item'>{selected_course.courseNo}</View>
            </View>
          </View>
        </View>
      )}

      {/* 周次选择弹窗 */}
      {is_show_switch_week && (
        <View className='modal-overlay items' onClick={closeSwitchWeek}>
          <View className='modal-content' onClick={(e) => e.stopPropagation()}>
            <View className='bora card items' style={{ padding: '16px' }}>
              {[...Array(22)].map((_, index) => (
                <View
                  key={index}
                  className='iteme'
                  onClick={() => switchToWeek(index + 1)}
                  data-week-number={index + 1}
                >
                  第{index + 1}周
                </View>
              ))}
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  )
}