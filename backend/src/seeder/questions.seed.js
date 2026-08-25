const MMSE_QUESTIONS = [
  //  ORIENTATION (10 pts)
  {
    id: 'orientation_time',
    section: 'Orientation',
    type: 'mcq',
    prompt: 'What year is it?',
    subPrompt: 'Select the correct answer',
    options: [
      { id: 'a', label: '2023' },
      { id: 'b', label: '2024' },
      { id: 'c', label: '2025' },
      { id: 'd', label: '2026' },
    ],
    expectedAnswers: ['2026'],
    timeLimit: 10,
    maxScore: 5,  // orientation_time covers year/season/date/day/month as a group
  },
  {
    id: 'orientation_place',
    section: 'Orientation',
    type: 'mcq',
    prompt: 'What country are we in?',
    subPrompt: 'Select the correct answer',
    options: [
      { id: 'a', label: 'Russia' },
      { id: 'b', label: 'China' },
      { id: 'c', label: 'Sri Lanka' },
      { id: 'd', label: 'India' },
    ],
    expectedAnswers: ['Sri Lanka'],
    timeLimit: 10,
    maxScore: 5,  // orientation_place covers state/city/suburb/floor/place
  },

  // ── REGISTRATION (3 pts)
  {
    id: 'registration',
    section: 'Registration',
    type: 'word_recall_display',
    prompt: 'Remember these three items',
    subPrompt: 'I will say three words. Repeat them back to me.',
    words: ['Apple', 'Table', 'Penny'],
    timeLimit: 20,
    maxScore: 3,
    maxAttempts: 5,
  },

  // ── ATTENTION (5 pts) 
  {
    id: 'attention_serial7',
    section: 'Attention',
    type: 'serial_subtraction',
    prompt: 'Subtract 7 from 100',
    subPrompt: 'Keep subtracting 7 from each answer',
    expectedAnswers: ['93', '86', '79', '72', '65'],
    timeLimit: 60,
    maxScore: 5,
  },

  // ── RECALL (3 pts)
  {
    id: 'recall',
    section: 'Recall',
    type: 'word_recall_input',
    prompt: 'What were the three words?',
    subPrompt: 'Ask the patient to recall the three words shown earlier',
    words: ['Apple', 'Table', 'Penny'],
    timeLimit: 30,
    maxScore: 3,
  },

  // ── LANGUAGE (9 pts)
  {
    id: 'language_naming_watch',
    section: 'Language',
    type: 'image_mcq',
    prompt: 'What is this object called?',
    subPrompt: 'Look at the image carefully',
    image: 'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=400',
    options: [
      { id: 'a', label: 'Clock' },
      { id: 'b', label: 'Watch' },
      { id: 'c', label: 'Timer' },
      { id: 'd', label: 'Bracelet' },
    ],
    expectedAnswers: ['Clock'],
    referenceAsset: 'clock',
    timeLimit: 10,
    maxScore: 1,
  },
  {
    id: 'language_naming_pencil',
    section: 'Language',
    type: 'image_mcq',
    prompt: 'What is this object called?',
    image: 'https://as1.ftcdn.net/v2/jpg/15/10/94/14/1000_F_1510941409_fLVGkWuGHlGROcYdMVXJHmnvDmQZm3rm.webp',
    imageDescription: 'A writing instrument',
    options: [
      { id: 'a', label: 'Pen' },
      { id: 'b', label: 'Marker' },
      { id: 'c', label: 'Pencil' },
      { id: 'd', label: 'Crayon' },
    ],
    expectedAnswers: ['Pencil'],
    referenceAsset: 'pencil',
    timeLimit: 10,
    maxScore: 1,
  },
  {
    id: 'language_repeat',
    section: 'Language',
    type: 'phrase_repeat',
    prompt: 'Repeat this phrase exactly:',
    subPrompt: '"No ifs, ands or buts"',
    timeLimit: 20,
    maxScore: 1,
  },
  {
    id: 'language_close_eyes',
    section: 'Language',
    type: 'instruction_action',
    prompt: 'Read the instruction below and follow it',
    subPrompt: 'CLOSE YOUR EYES',
    // instructionSteps: ['Close your eyes'],
    timeLimit: 10,
    maxScore: 1,
  },
  {
    id: 'language_three_stage',
    section: 'Language',
    type: 'instruction_action',
    prompt: 'Follow these three instructions:',
    instructionSteps: [
      'Take the paper in your right hand',
      'Fold the paper in half',
      'Put the paper on your lap',
    ],
    timeLimit: 30,
    maxScore: 3,
  },
  {
    id: 'language_writing',
    section: 'Language',
    type: 'text_input',
    prompt: 'Write a complete sentence',
    subPrompt: 'It must contain a subject and a verb and make sense',
    timeLimit: 30,
    maxScore: 1,
  },
  {
    id: 'language_drawing',
    section: 'Language',
    type: 'drawing_canvas',
    prompt: 'Copy this drawing',
    subPrompt: 'Draw the shapes as accurately as you can',
    referenceAsset: 'pentagons',
    timeLimit: 60,
    maxScore: 1,
  },
];

module.exports = {
  MMSE_QUESTIONS,
};