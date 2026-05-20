import {
    View,
    Swiper,
    SwiperItem,
    Image,
    Text,
    Navigator,
    ScrollView,
} from "@tarojs/components";
import Taro from '@tarojs/taro'
import "./index.css";
import SafeAreaView from "../../../components/safeView";
import HeadStatus from "../../../components/headStatus";
import InputBar from "../../../components/InputBar"
import CategoryFilter from "../../../components/CategoryFilter";
import { useState, useEffect } from "react";
import { useLoad } from "@tarojs/taro";
import { opendiffRequest } from "../../../utils/request"

export default function Index() {
    const [clubs, setClubs] = useState([])
    const [clubcategory, setClubCategory] = useState([])
    useLoad(async () => {
        const club_res = await opendiffRequest.get('/opendiff/clubs')
        const club_categories_res = await opendiffRequest.get('/opendiff/clubcategory')
        setClubs(club_res.data)
        setClubCategory(club_categories_res.data)
    })
    useEffect(() => {
        console.log(clubs)  // 当 clubs 更新时会打印最新值
    }, [clubs])
    return (<SafeAreaView>
        {/* 返回按钮 */}
        <View
            className="fa fa-arrow-left back-btn"
            onClick={() => Taro.switchTab({ url: "/pages/index/index" })}
        ></View>
        {/* 标题 */}
        <HeadStatus text="社团" />
        {/* 搜索组件 */}
        <InputBar placeholder={"搜索社团"}></InputBar>
        {/* 分类选择器 */}
        <CategoryFilter
            allText={'全部'}
            categories={[{ id: 1, name: 'text' }]}
            onChange={(category) => { console.log(category) }}
        />
        {/* 卡片 */}
        {/* <ScrollView scrollY
				className="outer-scroll"
				showScrollbar={false}
				enhanced
				bounces={false}>
            {clubs.length > 0 ? (clubs.map(club => (
                <View key={club.id}>社团名{club.name}</View>
            ))) : (<View>暂无社团数据</View>)}
        </ScrollView> */}
        <View>
            {clubs.length > 0 ? (clubs.map(club => (
                <View key={club.id}>社团名{club.name}</View>
            ))) : (<View>暂无社团数据</View>)}
            {/* <View class="item-name">{{item.name}}</View>
            <View class="content-row">
                <View class="label">社团简介:</View>
                <View class="value">{{item.introduction}}</View>
            </View>
            <View class="content-row">
                <View class="label">社团活动:</View>
                <View class="value">{{item.activities}}</View>
            </View> */}
        </View>
    </SafeAreaView>);
}
