import { View } from "@tarojs/components";

export default function UserCard({ text }) {
  return (
    <View
      style={{
        backgroundColor: "#47a5fd",
		fontSize: "10px",
        borderRadius: "10px",
        color: "white",
        display: "inline-flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "12px 20px",
		height: "100%",
      }}
    >
      {text}
    </View>
  );
}
