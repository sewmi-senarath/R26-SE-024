import * as Speech from 'expo-speech';

export const speakStory = (text: string) => {
  Speech.stop();
  Speech.speak(text, {
    language: 'en-US',
    pitch: 1.0,
    rate: 0.85,
  });
};

export const stopSpeaking = () => {
  Speech.stop();
};