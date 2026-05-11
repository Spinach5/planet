import { View, Image, Text } from "@tarojs/components";
import { useState, useEffect } from "react";
import Btn from "./Btn";
import { getCurrentWeek } from '../service/hubt/CurrentWeek';
import more from "../assets/more.svg";
import down from "../assets/down.svg";

export default function CourseHeader({ className = "" }) {
  const [currentWeek, setCurrentWeek] = useState(null);

  useEffect(() => {
    getCurrentWeek().then(week => setCurrentWeek(week));
  }, []);

	return (
		<View
			className={`${className}`}
			style={{
				padding: "4px",
				marginBottom: "16px",
				height: "40px",
				display: "flex",
				gap: "18px",
			}}
		>
			<Btn>
				<Image src={more} />
			</Btn>
			<Btn>
				<Text>第{currentWeek}周</Text>
				<Image src={down} />
			</Btn>
		</View>
	);
}
