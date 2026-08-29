// Generic, warm, non-distressing fallback stories for Story Recall. Used when
// there is no patient profile to personalize from, or when the LLM is
// unavailable. Every answer is stated plainly in the story so it is always
// verifiable. Each story carries enough questions to fill the hardest level.

export interface StaticStoryQuestion {
  question: string;
  correctAnswer: string;
  /** All choices including the correct one; shuffled at build time. */
  options: string[];
}

export interface StaticStory {
  id: string;
  text: string;
  questions: StaticStoryQuestion[];
}

export const STORY_POOL: StaticStory[] = [
  {
    id: "market-day",
    text:
      "On Saturday morning, Mr. Perera walked to the market near the temple. " +
      "He bought three red apples, a loaf of bread, and a bunch of yellow bananas. " +
      "On the way home he met his old friend Nihal, and they sat on a bench to talk about their grandchildren. " +
      "The sun was warm, and a small brown dog followed them along the road.",
    questions: [
      { question: "What day did Mr. Perera go to the market?", correctAnswer: "Saturday", options: ["Saturday", "Sunday", "Monday", "Friday"] },
      { question: "What was the market near?", correctAnswer: "The temple", options: ["The temple", "The river", "The school", "The hospital"] },
      { question: "How many apples did he buy?", correctAnswer: "Three", options: ["Three", "Two", "Four", "Five"] },
      { question: "Who did he meet on the way home?", correctAnswer: "Nihal", options: ["Nihal", "His brother", "The doctor", "A stranger"] },
      { question: "What colour were the bananas?", correctAnswer: "Yellow", options: ["Yellow", "Green", "Red", "Brown"] },
      { question: "What animal followed them?", correctAnswer: "A dog", options: ["A dog", "A cat", "A bird", "A cow"] },
    ],
  },
  {
    id: "garden-evening",
    text:
      "Mrs. Fernando loved her garden. Every evening she watered the roses and the little lime tree by the gate. " +
      "Her granddaughter Maya often came to help, carrying a small blue watering can. " +
      "One evening they saw a bright butterfly land on a white flower, and Maya laughed with delight. " +
      "Afterwards they had a warm cup of tea on the porch.",
    questions: [
      { question: "What did Mrs. Fernando love?", correctAnswer: "Her garden", options: ["Her garden", "Her car", "Cooking", "Painting"] },
      { question: "What tree was by the gate?", correctAnswer: "A lime tree", options: ["A lime tree", "A mango tree", "An apple tree", "A palm tree"] },
      { question: "Who helped her in the garden?", correctAnswer: "Maya", options: ["Maya", "Nihal", "Her son", "The neighbour"] },
      { question: "What colour was the watering can?", correctAnswer: "Blue", options: ["Blue", "Red", "Green", "Yellow"] },
      { question: "What landed on the flower?", correctAnswer: "A butterfly", options: ["A butterfly", "A bee", "A bird", "A leaf"] },
      { question: "What did they drink afterwards?", correctAnswer: "Tea", options: ["Tea", "Coffee", "Milk", "Water"] },
    ],
  },
  {
    id: "train-trip",
    text:
      "Last month, Mr. and Mrs. Silva took the morning train to Kandy to visit their son. " +
      "They packed sandwiches and a flask of tea for the journey. " +
      "Through the window they watched green hills and a sparkling waterfall pass by. " +
      "When they arrived, their son met them at the station with a big smile and a bunch of flowers.",
    questions: [
      { question: "Where did the Silvas travel to?", correctAnswer: "Kandy", options: ["Kandy", "Galle", "Colombo", "Jaffna"] },
      { question: "Who were they visiting?", correctAnswer: "Their son", options: ["Their son", "Their daughter", "A friend", "The doctor"] },
      { question: "What did they pack to eat?", correctAnswer: "Sandwiches", options: ["Sandwiches", "Rice", "Cake", "Fruit"] },
      { question: "What did they see through the window?", correctAnswer: "A waterfall", options: ["A waterfall", "The sea", "A city", "A desert"] },
      { question: "What time did the train leave?", correctAnswer: "Morning", options: ["Morning", "Evening", "Night", "Noon"] },
      { question: "What did their son bring?", correctAnswer: "Flowers", options: ["Flowers", "A cake", "A book", "An umbrella"] },
    ],
  },
];
