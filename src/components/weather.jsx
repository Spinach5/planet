import { View,Text} from "@tarojs/components";
import { white,radius_m,black} from "../styles/variables.scss";

export default function WeatherTile({
  children,
  className = '',
  symbol='-',
  text='无'
}) {
  return (
    <View
      className={`weather-tile ${className}`}
      style={{
        display: "flex",
        flexDirection: "row",
		backgroundColor:white,
		borderRadius:radius_m,
      }}
    >
	<Text style={{
        color:black, // 直接设置颜色
        fontWeight: "bold",
      }}
	>{symbol}{text}</Text>
      {children}
    </View>
  );
}

