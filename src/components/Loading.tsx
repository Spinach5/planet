import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";
import { ActivityIndicator, StyleSheet, View } from "react-native";

interface LoadingProps {
  /** Overlay mode: fixed fullscreen (default true) */
  overlay?: boolean;
  text?: string;
}

/**
 * Loading indicator matching Taro project's Loading.jsx.
 * Default overlay mode covers the full screen with semi-transparent background.
 */
export function Loading({ overlay = true, text = "加载中..." }: LoadingProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        overlay ? styles.overlay : styles.inline,
        overlay && { backgroundColor: "rgba(255,255,255,0.7)" },
      ]}
    >
      <ActivityIndicator size="large" color={theme.primary} />
      <ThemedText style={styles.text}>{text}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  inline: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  text: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
});
