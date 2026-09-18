// Generic single-blank cloze sentences for Sentence Completion, used when there
// is no patient profile to personalize from or the LLM is unavailable. "___"
// marks the blank; every option list includes the correct answer.

export interface StaticSentence {
  text: string;
  answer: string;
  options: string[];
}

export const SENTENCE_POOL: StaticSentence[] = [
  { text: "In the morning, many people enjoy a warm cup of ___.", answer: "Tea", options: ["Tea", "Shoes", "Grass", "Paper"] },
  { text: "You wear shoes on your ___.", answer: "Feet", options: ["Feet", "Hands", "Head", "Ears"] },
  { text: "The sun rises in the ___.", answer: "East", options: ["East", "West", "Kitchen", "Garden"] },
  { text: "We use an umbrella when it starts to ___.", answer: "Rain", options: ["Rain", "Sing", "Sleep", "Cook"] },
  { text: "A cat likes to drink ___.", answer: "Milk", options: ["Milk", "Sand", "Petrol", "Ink"] },
  { text: "At night, the sky is full of ___.", answer: "Stars", options: ["Stars", "Fish", "Cars", "Bread"] },
  { text: "We keep food cold inside the ___.", answer: "Fridge", options: ["Fridge", "Oven", "Cupboard", "Mirror"] },
  { text: "Before you sleep, it is good to brush your ___.", answer: "Teeth", options: ["Teeth", "Shoes", "Curtains", "Windows"] },
];
