export type LayoutPoint = { x: number; y: number };

export function buildPuzzleSlotPositions(
  origin: LayoutPoint | null,
  pieceCount: number,
  gridSize: number,
  cellSize: number,
): LayoutPoint[] {
  if (!origin) return [];

  return Array.from({ length: pieceCount }, (_, index) => ({
    x: origin.x + (index % gridSize) * cellSize,
    y: origin.y + Math.floor(index / gridSize) * cellSize,
  }));
}

export function buildPuzzleTrayPositions(
  origin: LayoutPoint | null,
  pieceCount: number,
  gridSize: number,
  cellSize: number,
  pieceScale: number,
  padding: number,
  labelHeight: number,
  gap: number,
): LayoutPoint[] {
  if (!origin) return [];

  return Array.from({ length: pieceCount }, (_, index) => {
    const col = index % gridSize;
    const row = Math.floor(index / gridSize);
    return {
      x: origin.x + padding + col * (cellSize * pieceScale + gap),
      y: origin.y + labelHeight + padding + row * (cellSize * pieceScale + gap),
    };
  });
}
