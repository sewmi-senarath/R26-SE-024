import { getPersonalizedGameContent } from "@/src/api/gameContentApi";
import { getGameContent } from "@/src/constants/gameContent";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { usePersonalizedGameContent } from "../usePersonalizedGameContent";

jest.mock("@/src/api/gameContentApi", () => ({
  getPersonalizedGameContent: jest.fn(),
}));

jest.mock("@/src/constants/gameContent", () => ({
  getGameContent: jest.fn(),
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

describe("usePersonalizedGameContent replay refresh", () => {
  const mockGetContent = jest.mocked(getPersonalizedGameContent);
  const mockGetFallback = jest.mocked(getGameContent);

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetFallback.mockImplementation((gameId, difficulty) => ({
      marker: `fallback-${gameId}-${difficulty}`,
    }) as never);
  });

  it("loads a new round and ignores a late response from the previous round", async () => {
    const firstRound = deferred<any>();
    const secondRound = deferred<any>();
    mockGetContent
      .mockReturnValueOnce(firstRound.promise)
      .mockReturnValueOnce(secondRound.promise);

    const { result } = await renderHook(() =>
      usePersonalizedGameContent<any>("word_puzzle", "easy", "patient-1"),
    );

    await waitFor(() => expect(mockGetContent).toHaveBeenCalledTimes(1));

    await act(() => {
      result.current.refresh("medium");
    });

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(mockGetContent).toHaveBeenCalledTimes(2));
    expect(mockGetContent).toHaveBeenLastCalledWith(
      "word_puzzle",
      "patient-1",
      "medium",
    );

    await act(async () => {
      secondRound.resolve({
        config: { marker: "new-round" },
        personalized: true,
      });
      await secondRound.promise;
    });

    await waitFor(() => expect(result.current.config.marker).toBe("new-round"));
    expect(result.current.difficulty).toBe("medium");
    expect(result.current.loading).toBe(false);

    await act(async () => {
      firstRound.resolve({
        config: { marker: "old-round" },
        personalized: true,
      });
      await firstRound.promise;
    });

    expect(result.current.config.marker).toBe("new-round");
  });
});
