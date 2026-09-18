// MemoCare — Bilingual Voice Strings
// Default: Sinhala (si-LK) | English (en-US)

export type Language = 'si-LK' | 'en-US';

export const T = {
  // Greetings
  goodMorning:   { 'si-LK': 'සුබ උදෑසනක්', 'en-US': 'Good Morning' },
  goodAfternoon: { 'si-LK': 'සුබ දවල්ලක්', 'en-US': 'Good Afternoon' },
  goodEvening:   { 'si-LK': 'සුබ සන්ධ්‍යාවක්', 'en-US': 'Good Evening' },

  // Object Finder
  searchingFor:   { 'si-LK': (obj: string) => `ඔබේ ${obj} සොයමින්...`, 'en-US': (obj: string) => `Searching for your ${obj}...` },
  foundIn:        { 'si-LK': (obj: string, room: string) => `ඔබේ ${obj} ${room} ඇත.`, 'en-US': (obj: string, room: string) => `Your ${obj} is in the ${room}.` },
  notFound:       { 'si-LK': (obj: string) => `ඔබේ ${obj} දැනට සොයාගත නොහැක.`, 'en-US': (obj: string) => `Could not find your ${obj}.` },

  // Missing Object Alert
  missingAlert: { 'si-LK': (obj: string, room: string) => `ඔබේ ${obj} ඔබ ළඟ නෑ. ${room} ඇත.`, 'en-US': (obj: string, room: string) => `Your ${obj} is not with you. It was last seen in the ${room}.` },

  // Live Camera
  iSeeA: { 'si-LK': (obj: string) => `මමල ${obj} ෙකනකු දකිමි.`, 'en-US': (obj: string) => `I see a ${obj}.` },
  detectionFailed: { 'si-LK': 'හඳුනා ගැනීම අසාර්ථකයි. නැවත උත්සාහ කරන්න.', 'en-US': 'Detection failed. Please try again.' },
  noObjectsDetected: { 'si-LK': 'කිසිදු වස්තුවක් හඳුනා නොගත්tickt. යමක් ලාහ ලා point කරන්න.', 'en-US': 'No objects detected. Try pointing at something clearly.' },

  // Time/Date
  todayIs: { 'si-LK': (date: string) => `අද ${date}.`, 'en-US': (date: string) => `Today is ${date}.` },
  nextMeal: { 'si-LK': 'ඔබේ ඊළඟ ආහාරය ළඟදීම. ඔබේ දිනපත දෙස බලන්න.', 'en-US': 'Your next meal is coming up. Please check your daily routine.' },

  // Family/Call
  callingFamily: { 'si-LK': 'ඔබේ පවුලේ කෙනෙකු ඇමතෙමින්...', 'en-US': 'Calling your family member now.' },

  // SOS
  sosAlert: { 'si-LK': 'ඔබේ සත්කාරකවරයා දැනට ම දන්වමින් සිටිමි.', 'en-US': 'Alerting your caregiver immediately.' },

  // Welcome
  welcomeBack: { 'si-LK': (name: string) => `ඔයාට ආයෙ ඒ ගැන සතුටුයි, ${name}.`, 'en-US': (name: string) => `Welcome back, ${name}.` },

  // Login
  faceScanning: { 'si-LK': 'ඔබේ මුහුණ හඳුනාගනිමින්...', 'en-US': 'Looking for your face...' },
  loggingIn: { 'si-LK': 'ලොග් ඉන් කරමින්...', 'en-US': 'Logging you in...' },
  faceNotRecognized: { 'si-LK': 'මුහුණ හඳුනා ගැනීමට නොහැකිය. ID number භාවිතා කරන්න.', 'en-US': 'Face not recognized. Please use your ID Number.' },

  // Object saved
  objectSaved: { 'si-LK': (obj: string, room: string) => `හරි! ${obj} ${room} ලෙස සොයාගත හැකිය.`, 'en-US': (obj: string, room: string) => `Got it! ${obj} location updated as ${room}.` },
  couldNotSave: { 'si-LK': 'සේව් කිරීමට නොහැකිය. නැවත උත්සාහ කරන්න.', 'en-US': 'Could not save. Please try again.' },
} as const;

// Helper to get string value
export function t(key: keyof typeof T, lang: Language, ...args: any[]): string {
  const entry = T[key][lang];
  if (typeof entry === 'function') {
    return (entry as Function)(...args);
  }
  return entry as string;
}

// Speak helper
export function speakT(key: keyof typeof T, lang: Language, ...args: any[]) {
  const Speech = require('expo-speech');
  const text = t(key, lang, ...args);
  Speech.speak(text, { language: lang, rate: 0.9 });
}
