import { emotions } from "@/constants";

export type Emotion = "Angry" | "Happy" | "Sad" | "Surprised" | "Neutral";

// Emotion-specific styles
export const emotionStyles: Record<
  Emotion,
  { backgroundColor: string; rectangleColor: string; textColor: string }
> = {
  Angry: {
    backgroundColor: "#FFEFE5",
    rectangleColor: "#FF843E",
    textColor: "#782E04",
  },
  Happy: {
    backgroundColor: "#FFFBED",
    rectangleColor: "#FDDD6F",
    textColor: "#664F00",
  },
  Sad: {
    backgroundColor: "#EBF0FF",
    rectangleColor: "#8CA4EE",
    textColor: "#313A54",
  },
  Surprised: {
    backgroundColor: "#EDF8FF",
    rectangleColor: "#A1E7EB",
    textColor: "#3A7478",
  },
  Neutral: {
    backgroundColor: "#FFF0F3",
    rectangleColor: "#FFA7BC",
    textColor: "#4D3238",
  },
};

// Emotion images map
export const emotionsMap: Record<Emotion, any[]> = {
  Angry: [emotions.angry_1, emotions.angry_2, emotions.angry_3],
  Happy: [emotions.happy_1, emotions.happy_2, emotions.happy_3],
  Sad: [emotions.sad_1, emotions.sad_2, emotions.sad_3],
  Surprised: [emotions.surprised_1, emotions.surprised_2, emotions.surprised_3],
  Neutral: [emotions.neutral_1, emotions.neutral_2, emotions.neutral_3],
};
