import { authFetch } from "@/src/api/authApi";
import { getPersonalizedGameContent } from "../gameContentApi";

jest.mock("@/src/api/authApi", () => ({
  authFetch: jest.fn(),
}));

describe("getPersonalizedGameContent", () => {
  it("uses a unique URL for every round so completed content is not restored from cache", async () => {
    const mockAuthFetch = jest.mocked(authFetch);
    mockAuthFetch.mockResolvedValue({
      success: true,
      data: { config: { marker: "round" }, personalized: true },
    });

    await getPersonalizedGameContent<any>("word_puzzle", "patient-1", "easy");
    await getPersonalizedGameContent<any>("word_puzzle", "patient-1", "easy");

    const firstUrl = mockAuthFetch.mock.calls[0][0];
    const secondUrl = mockAuthFetch.mock.calls[1][0];

    expect(firstUrl).toContain(
      "/cognitive/games/content/word_puzzle/patient-1/easy?round=",
    );
    expect(secondUrl).not.toBe(firstUrl);
  });
});
