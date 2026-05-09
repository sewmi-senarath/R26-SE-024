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

type PatientPhotoInput = {
  uri: string;
  label?: string;
  category?: PuzzleImage["category"];
};

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
    source: require("@/assets/images/puzzle_images/photo3.png"),
    category: "place",
  },
  {
    id: "photo_4",
    label: "Beach",
    source: require("@/assets/images/puzzle_images/photo4.png"),
    category: "place",
  },
  {
    id: "photo_5",
    label: "Beach",
    source: require("@/assets/images/puzzle_images/photo5.png"),
    category: "place",
  },
  {
    id: "photo_6",
    label: "Beach",
    source: require("@/assets/images/puzzle_images/photo6.png"),
    category: "place",
  },
  
];

// Picks a random image from the pool
export function getRandomPuzzleImage(): PuzzleImage {
  return MOCK_PUZZLE_IMAGES[
    Math.floor(Math.random() * MOCK_PUZZLE_IMAGES.length)
  ];
}

export function buildPatientPuzzleImages(
  photos: PatientPhotoInput[],
): PuzzleImage[] {
  const seen = new Set<string>();

  return photos
    .map((photo) => ({
      ...photo,
      uri: photo.uri?.trim(),
    }))
    .filter((photo) => {
      if (!photo.uri || seen.has(photo.uri)) return false;
      seen.add(photo.uri);
      return true;
    })
    .map((photo, index) => ({
      id: `patient_photo_${index}`,
      label: photo.label || `Personal Photo ${index + 1}`,
      source: { uri: photo.uri },
      category: photo.category || "family",
    }));
}

export function buildMixedPuzzleImagePool(
  patientPhotos: PuzzleImage[],
): PuzzleImage[] {
  if (patientPhotos.length === 0) return MOCK_PUZZLE_IMAGES;

  const generalPhotos = MOCK_PUZZLE_IMAGES.filter(
    (image) => image.category !== "family",
  );

  return shufflePuzzleImages([...patientPhotos, ...generalPhotos]);
}

export function getRandomPuzzleImageFromPool(
  images: PuzzleImage[],
): PuzzleImage {
  const pool = images.length > 0 ? images : MOCK_PUZZLE_IMAGES;
  return pool[Math.floor(Math.random() * pool.length)];
}

function shufflePuzzleImages(images: PuzzleImage[]): PuzzleImage[] {
  const shuffled = [...images];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
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
