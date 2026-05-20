import { Image, View, Text } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useState } from "react";
import audio_muyu from "../assets/audio/muyu.mp3";
import audio_moo from "../assets/audio/moo.mp3";
import SelectAudioModal from "./SelectAudioModal";
import { Muyu, MuyuStick } from "../assets/muyu";
import "./MuYu.css";
import { AtIcon } from "taro-ui";

const audioMap = {
	muyu: audio_muyu,
	moo: audio_moo,
};

export default function MuYu({ onClick }) {
	const [showAudioModal, setShowAudioModal] = useState(false);
	const [currentAudioKey, setCurrentAudioKey] = useState("muyu");

	// 播放音频函数
	const playAudio = (key) => {
		const src = audioMap[key];
		if (!src) return;
		const innerAudioContext = Taro.createInnerAudioContext();
		innerAudioContext.src = src;
		innerAudioContext.autoplay = true;
		innerAudioContext.onError((res) => {
			console.error("音频播放失败", res);
		});
	};

	const handleClick = () => {
		onClick?.(); // 功德+1
		playAudio(currentAudioKey);
	};

	const handleSelectAudio = (key) => {
		setCurrentAudioKey(key);
		setShowAudioModal(false);
		// 可选：预览新音频
		// playAudio(key);
	};

	return (
		<>
			<View className="muyu-container" onClick={handleClick}>
				<MuyuStick className="muyu-stick" />
				<Muyu className="muyu-img" />
			</View>
			<View
				className="choose-audio"
				onClick={() => setShowAudioModal(true)}
			>
				<AtIcon value="file-audio" color="#0069cc" />
				<Text style={{ marginLeft: "8px" }}>选择音频</Text>
			</View>

			{showAudioModal && (
				<SelectAudioModal
					audioList={audioMap}
					currentAudioKey={currentAudioKey}
					onSelect={handleSelectAudio}
					onClose={() => setShowAudioModal(false)}
				/>
			)}
		</>
	);
}
