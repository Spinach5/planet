import { View, Text } from "@tarojs/components";

export default function SelectAudioModal({
  audioList,      // 对象：{ key1: audioUrl, key2: audioUrl }
  currentAudioKey,
  onSelect,
  onClose,
}) {
  const audioKeys = Object.keys(audioList);

  return (
    <View className="modal-mask" onClick={onClose}>
      <View
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "80%",
          maxWidth: "500px",
          backgroundColor: "#fff",
          borderRadius: "16px",
          overflow: "hidden",
          padding: "20px",
        }}
      >
        <View
          className="modal-title"
          style={{
            textAlign: "center",
            paddingBottom: "16px",
            fontSize: "24px",
            fontWeight: "bold",
            color: "#000",
          }}
        >
          选择音频
        </View>
        {audioKeys.map((key) => (
          <View
            key={key}
            className="audio-item"
            onClick={() => onSelect(key)}
            style={{
              padding: "12px 16px",
              marginBottom: "8px",
              borderRadius: "8px",
              border: currentAudioKey === key ? "2px solid #47a5fd" : "1px solid #eee",
              backgroundColor: "#f5f5f5",
              textAlign: "center",
              fontSize: "18px",
              fontWeight: currentAudioKey === key ? "bold" : "normal",
              color: currentAudioKey === key ? "#47a5fd" : "#333",
              cursor: "pointer",
            }}
          >
            {key === "muyu" ? "木鱼声" : key === "moo" ? "牛叫声" : key}
          </View>
        ))}
      </View>
    </View>
  );
}
