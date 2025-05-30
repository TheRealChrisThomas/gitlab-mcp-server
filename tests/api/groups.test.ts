import { searchGroups } from "../../src/api/groups.js";
import { loadFixture, createGitLabError } from "../utils/test-helpers.js";

// Mock the GitLab client
jest.mock("../../src/utils/gitlab-client.js", () => ({
  gitlabGet: jest.fn(),
  buildSearchParams: jest.fn((params: any) => new URLSearchParams(params))
}));

import { gitlabGet } from "../../src/utils/gitlab-client.js";

const mockGitlabGet = gitlabGet as jest.MockedFunction<typeof gitlabGet>;

describe("Groups API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("searchGroups", () => {
    it("should search and parse groups successfully", async () => {
      const fixtureData = loadFixture("groups/search-groups-success.json");
      mockGitlabGet.mockResolvedValue(fixtureData);

      const result = await searchGroups("Frontend");

      expect(mockGitlabGet).toHaveBeenCalledWith("/groups", expect.any(URLSearchParams));
      expect(result).toHaveProperty("count", 3);
      expect(result).toHaveProperty("items");
      expect(result.items).toHaveLength(3);
      expect(result.items[0]).toHaveProperty("id", 123456);
      expect(result.items[0]).toHaveProperty("name", "Frontend Team");
      expect(result.items[0]).toHaveProperty("path", "frontend-team");
      expect(result.items[0]).toHaveProperty("visibility", "private");
      expect(result.items[0]).toHaveProperty("full_path", "company/frontend-team");
      expect(result.items[1]).toHaveProperty("name", "Backend Team");
      expect(result.items[2]).toHaveProperty("name", "DevOps");
    });

    it("should handle pagination parameters", async () => {
      const fixtureData = loadFixture("groups/search-groups-success.json");
      mockGitlabGet.mockResolvedValue(fixtureData);

      await searchGroups("test", 2, 50);

      expect(mockGitlabGet).toHaveBeenCalledWith("/groups", expect.any(URLSearchParams));
    });

    it("should handle owned parameter", async () => {
      const fixtureData = loadFixture("groups/search-groups-success.json");
      mockGitlabGet.mockResolvedValue(fixtureData);

      await searchGroups("test", 1, 20, true);

      expect(mockGitlabGet).toHaveBeenCalledWith("/groups", expect.any(URLSearchParams));
    });

    it("should handle minAccessLevel parameter", async () => {
      const fixtureData = loadFixture("groups/search-groups-success.json");
      mockGitlabGet.mockResolvedValue(fixtureData);

      await searchGroups("test", 1, 20, undefined, 30);

      expect(mockGitlabGet).toHaveBeenCalledWith("/groups", expect.any(URLSearchParams));
    });

    it("should handle both owned and minAccessLevel parameters", async () => {
      const fixtureData = loadFixture("groups/search-groups-success.json");
      mockGitlabGet.mockResolvedValue(fixtureData);

      await searchGroups("test", 1, 20, true, 40);

      expect(mockGitlabGet).toHaveBeenCalledWith("/groups", expect.any(URLSearchParams));
    });

    it("should handle empty search results", async () => {
      mockGitlabGet.mockResolvedValue([]);

      const result = await searchGroups("nonexistent");

      expect(result).toHaveProperty("count", 0);
      expect(result).toHaveProperty("items", []);
    });

    it("should handle GitLab API errors", async () => {
      const error = createGitLabError(403, "Forbidden");
      mockGitlabGet.mockRejectedValue(error);

      await expect(searchGroups("test")).rejects.toThrow("Forbidden");
    });

    it("should validate response schema", async () => {
      mockGitlabGet.mockResolvedValue([{ invalid: "data" }]);

      await expect(searchGroups("test")).rejects.toThrow();
    });

    it("should handle groups with different visibility levels", async () => {
      const fixtureData = loadFixture("groups/search-groups-success.json");
      mockGitlabGet.mockResolvedValue(fixtureData);

      const result = await searchGroups("team");

      expect(result.items[0]).toHaveProperty("visibility", "private");
      expect(result.items[1]).toHaveProperty("visibility", "internal");
      expect(result.items[2]).toHaveProperty("visibility", "public");
    });

    it("should handle groups with and without parent groups", async () => {
      const fixtureData = loadFixture("groups/search-groups-success.json");
      mockGitlabGet.mockResolvedValue(fixtureData);

      const result = await searchGroups("team");

      expect(result.items[0]).toHaveProperty("parent_id", 789);
      expect(result.items[1]).toHaveProperty("parent_id", 789);
      expect(result.items[2]).toHaveProperty("parent_id", null);
    });

    it("should handle groups with and without avatar URLs", async () => {
      const fixtureData = loadFixture("groups/search-groups-success.json");
      mockGitlabGet.mockResolvedValue(fixtureData);

      const result = await searchGroups("team");

      expect(result.items[0]).toHaveProperty("avatar_url");
      expect(result.items[0].avatar_url).toContain("avatar.png");
      expect(result.items[1]).toHaveProperty("avatar_url", null);
      expect(result.items[2]).toHaveProperty("avatar_url");
    });

    it("should handle groups with and without descriptions", async () => {
      const fixtureData = loadFixture("groups/search-groups-success.json");
      mockGitlabGet.mockResolvedValue(fixtureData);

      const result = await searchGroups("team");

      expect(result.items[0]).toHaveProperty("description", "Frontend development team group");
      expect(result.items[1]).toHaveProperty("description", "Backend development team group");
      expect(result.items[2]).toHaveProperty("description", null);
    });

    it("should use default pagination when not specified", async () => {
      const fixtureData = loadFixture("groups/search-groups-success.json");
      mockGitlabGet.mockResolvedValue(fixtureData);

      await searchGroups("test");

      expect(mockGitlabGet).toHaveBeenCalledWith("/groups", expect.any(URLSearchParams));
    });
  });
});
