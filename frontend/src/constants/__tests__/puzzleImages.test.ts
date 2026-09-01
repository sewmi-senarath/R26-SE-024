import {
  getRandomPuzzleImageFromPool,
  PuzzleImage,
} from "../puzzleImages";

describe("getRandomPuzzleImageFromPool", () => {
  it("does not immediately reuse the previous puzzle image when another is available", () => {
    const images: PuzzleImage[] = [
      { id: "previous", label: "Previous", source: 1, category: "general" },
      { id: "fresh", label: "Fresh", source: 2, category: "general" },
    ];

    expect(getRandomPuzzleImageFromPool(images, "previous").id).toBe("fresh");
  });
});
