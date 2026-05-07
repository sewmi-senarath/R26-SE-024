// src/constants/puzzleImages.ts
// ─────────────────────────────────────────────────────────────
// DEVELOPMENT: All images are local assets.
// PRODUCTION:  Replace `uri` values with URLs from your backend.
//              The component only reads `source` — nothing else changes.
// ─────────────────────────────────────────────────────────────

export interface PuzzleImage {
  id: string;
  label: string; // shown in UI
  source: any; // ImageSourcePropType — local require() or { uri: string }
  category: "family" | "place" | "general";
}

// ── Mock images for development ───────────────────────────────
// Replace require() with { uri: 'https://your-backend.com/...' } when backend is ready
export const MOCK_PUZZLE_IMAGES: PuzzleImage[] = [
  {
    id: "photo_1",
    label: "Family Photo 1",
    source: require("@/assets/images/puzzle_images/photo1.jpg"),
    category: "family",
  },
  {
    id: "photo_2",
    label: "Family Photo 2",
    source: require("@/assets/images/puzzle_images/photo2.png"),
    category: "family",
  },
  {
    id: "photo_3",
    label: "Garden",
    source: require("@/assets/images/puzzle_images/photo3.jpeg"),
    category: "place",
  },
  {
    id: "photo_4",
    label: "Beach",
    source: require("@/assets/images/puzzle_images/photo4.jpg"),
    category: "place",
  },
];

// Picks a random image from the pool
export function getRandomPuzzleImage(): PuzzleImage {
  return MOCK_PUZZLE_IMAGES[
    Math.floor(Math.random() * MOCK_PUZZLE_IMAGES.length)
  ];
}

// ── How to switch to backend images ──────────────────────────
// When your backend returns patient photo URLs, replace like this:
//
// export function getPatientPuzzleImages(urls: string[]): PuzzleImage[] {
//   return urls.map((url, i) => ({
//     id: `patient_photo_${i}`,
//     label: `Photo ${i + 1}`,
//     source: { uri: url },
//     category: 'family',
//   }));
// }
