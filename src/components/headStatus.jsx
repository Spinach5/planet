import { View,Text} from "@tarojs/components";

export default function HeadStatus({
  children,
  className = '',
  text=''
}) {
  return (
    <View
      className={`head-status ${className}`}
      style={{
        display: "flex",
        flexDirection: "row",
		marginBottom: 10
      }}
    >
	<Text style={{
        color: "#fff", // 直接设置颜色
        fontWeight: "bold",
		fontSize: 40,
      }}
	>{text}</Text>
      {children}
    </View>
  );
}

