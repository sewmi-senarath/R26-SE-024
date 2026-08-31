import {
  buildPuzzleSlotPositions,
  buildPuzzleTrayPositions,
} from "../photoPuzzleLayout";

describe("photo puzzle local layout coordinates", () => {
  it("builds board slots relative to the shared scroll-content parent", () => {
    expect(buildPuzzleSlotPositions({ x: 14, y: 90 }, 4, 2, 50)).toEqual([
      { x: 14, y: 90 },
      { x: 64, y: 90 },
      { x: 14, y: 140 },
      { x: 64, y: 140 },
    ]);
  });

  it("builds tray starts in that same local coordinate system", () => {
    expect(
      buildPuzzleTrayPositions({ x: 14, y: 220 }, 4, 2, 50, 0.9, 10, 24, 1),
    ).toEqual([
      { x: 24, y: 254 },
      { x: 70, y: 254 },
      { x: 24, y: 300 },
      { x: 70, y: 300 },
    ]);
  });

  it("does not expose positions before both content frames are measured", () => {
    expect(buildPuzzleSlotPositions(null, 16, 4, 80)).toEqual([]);
    expect(buildPuzzleTrayPositions(null, 16, 4, 80, 0.9, 10, 24, 1)).toEqual([]);
  });
});
