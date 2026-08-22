export const startVoiceCommand = (onCommand) => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    console.error("Speech Recognition not supported in this browser.");
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event) => {
    const command = event.results[0][0].transcript.toLowerCase();
    console.log("Voice Command Received:", command);
    onCommand(command);
  };

  recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
  };

  recognition.start();
  return recognition;
};

export const parseObjectQuery = (text) => {
  // Simple regex to find "where is my X" or just "find X"
  const match = text.match(/(?:where is my|find|show me|where's my)\s+([a-z\s]+)/i);
  return match ? match[1].trim() : null;
};
