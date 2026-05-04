import { View } from "@tarojs/components"

export default function CourseHeader({
  children,
  className = '',
}) {
  return (
    <View
      className={`${className}`}
      style={{
		padding: "4px",
		marginBottom: "16px",
		height: "40px",
		display: "flex",
		gap: "8px"
	  }}

    >
      {children}
    </View>
  )
}
