import { View } from "@tarojs/components";

export default function UserCard({ text }) {
  return (
    <View
      style={{
        backgroundColor: "#47a5fd",
		fontSize: "8px",
        borderRadius: "16px",
        color: "white",
        display: "inline-flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "0px 20px",
      }}
    >
      {text}
    </View>
  );
}
