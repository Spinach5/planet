import { useState, useEffect } from "react";
import Taro from "@tarojs/taro";

export const useSafeArea = () => {
	const [top, setTop] = useState(44);
	const [bottom, setBottom] = useState(0);

	useEffect(() => {
		try {
			const cache = Taro.getStorageSync("safe_area_cache");
			if (cache && cache.data) {
				setTop(cache.data.top);
				setBottom(cache.data.bottom);
				console.log("useSafeArea 读取成功:", cache.data);
			} else {
				console.warn("未找到安全距离缓存，使用默认值");
			}
		} catch (e) {
			console.error("读取安全距离缓存失败", e);
		}
	}, []);

	return { top, bottom };
};
