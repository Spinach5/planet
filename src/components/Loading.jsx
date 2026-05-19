import { View, Text } from "@tarojs/components";

export default function Loading({ text = "加载中..." }) {
  return (
    <View
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "fixed",   // 固定定位，覆盖全屏
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
      }}
    >
      <View
        className="fa fa-spin fa fa-hand-peace-o"  // fa-spin 是旋转动画类（FontAwesome 提供）
        style={{
          fontSize: "99px",
          marginBottom: "12px",
        }}
      />
      <Text style={{ fontSize: "28px", color: "#333" }}>{text}</Text>
    </View>
  );
}
