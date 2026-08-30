import { GameId } from "@/src/types/games.types";

export type Review = {
  gameId: GameId;
  sessions: number;
  bestScore: string;
  lastPlayed: string;
  review: string;
};
