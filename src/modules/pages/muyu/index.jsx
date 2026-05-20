import { useState } from "react";
import MuYu from "../../../components/MuYu";
import "./index.css";
import HeadStatus from "../../../components/headStatus";
import SafeAreaView from "../../../components/safeView";
import Taro from "@tarojs/taro";
import { View, Text } from "@tarojs/components";
import { AtIcon } from "taro-ui";

export default function Index() {
	const [merits, setMerits] = useState(0);
	const handleMerits = () => {
		console.log("功德");
		setMerits(merits + 1);
	};
	return (
		<SafeAreaView>
			<AtIcon
				value="arrow-left"
				color="#ffffff"
				onClick={() => Taro.switchTab({ url: "/pages/index/index" })}
			/>
			<HeadStatus text="木鱼" />
			<Text
				style={{
					alignItems: "center",
					justifyContent: "center",
					textAlign: "center",
					marginTop: 10,
					marginBottom: 10,
					fontSize: 50,
				}}
			>
				今日功德:{merits}
			</Text>
			<MuYu onClick={handleMerits} />
		</SafeAreaView>
	);
}
