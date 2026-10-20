import * as Speech from 'expo-speech';

// cached lookup — querying available voices is async and only needs doing once
let bestVoicePromise: Promise<string | undefined> | null = null;

const pickBestVoice = async (): Promise<string | undefined> => {
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    const englishVoices = voices.filter((v) => v.language?.startsWith('en'));

    // prefer a higher-quality "Enhanced"/"Premium" voice if the device has
    // one installed — these sound noticeably more natural than the default
    // robotic system voice
    const enhanced = englishVoices.find(
      (v) => v.quality === Speech.VoiceQuality.Enhanced
    );
    return (enhanced || englishVoices[0])?.identifier;
  } catch {
    return undefined;
  }
};

// splits into sentences and speaks them one at a time with a short pause
// between each — a flat continuous read sounds instructional, brief pauses
// at sentence boundaries read as more deliberate/narrative
const splitIntoSentences = (text: string): string[] =>
  text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

const PAUSE_BETWEEN_SENTENCES_MS = 600;

interface SpeechToken {
  cancelled: boolean;
  paused: boolean;
  pauseHere?: () => void;
  resume?: () => void;
}

// only one story plays at a time, so a single module-level token is enough
// for pauseSpeaking()/resumeSpeaking() to reach whichever speakStory() call
// is currently active
let currentToken: SpeechToken | null = null;

export const speakStory = async (
  text: string,
  onDone?: () => void,
  onProgress?: (currentSentence: number, totalSentences: number) => void
) => {
  Speech.stop();
  const myToken: SpeechToken = { cancelled: false, paused: false };
  currentToken = myToken;

  if (!bestVoicePromise) bestVoicePromise = pickBestVoice();
  const voice = await bestVoicePromise;
  if (myToken.cancelled) return;

  const sentences = splitIntoSentences(text);
  let index = 0;

  const speakNext = () => {
    if (myToken.cancelled || myToken.paused) return;
    if (index >= sentences.length) {
      onDone?.();
      return;
    }

    const sentence = sentences[index];
    onProgress?.(index + 1, sentences.length);
    index += 1;

    Speech.speak(sentence, {
      language: 'en-US',
      voice,
      pitch: 0.88,   // lower — warmer, softer tone instead of a clinical read
      rate: 0.72,    // slower, calmer storytelling pace
      onDone: () => {
        if (myToken.cancelled || myToken.paused) return;
        setTimeout(speakNext, PAUSE_BETWEEN_SENTENCES_MS);
      },
      onStopped: () => {
        if (!myToken.paused && !myToken.cancelled) onDone?.();
      },
      onError: () => onDone?.(),
    });
  };

  // pausing rewinds to the start of the sentence that got cut off, since
  // expo-speech can only stop/start whole utterances, not mid-sentence —
  // resuming replays that sentence rather than skipping the rest of it
  myToken.pauseHere = () => {
    index = Math.max(0, index - 1);
    myToken.paused = true;
    Speech.stop();
  };
  myToken.resume = () => {
    myToken.paused = false;
    speakNext();
  };

  speakNext();
};

export const pauseSpeaking = () => {
  currentToken?.pauseHere?.();
};

export const resumeSpeaking = () => {
  currentToken?.resume?.();
};

export const stopSpeaking = () => {
  if (currentToken) currentToken.cancelled = true;
  Speech.stop();
};
