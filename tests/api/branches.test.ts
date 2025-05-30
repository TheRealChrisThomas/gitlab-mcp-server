import { createBranch } from "../../src/api/branches.js";
import { loadFixture, createGitLabError } from "../utils/test-helpers.js";

// Mock the GitLab client
jest.mock("../../src/utils/gitlab-client.js", () => ({
  gitlabPost: jest.fn(),
  encodeProjectId: jest.fn((id: string) => encodeURIComponent(id))
}));

import { gitlabPost } from "../../src/utils/gitlab-client.js";

const mockGitlabPost = gitlabPost as jest.MockedFunction<typeof gitlabPost>;

describe("Branches API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createBranch", () => {
    it("should create branch successfully", async () => {
      const fixtureData = loadFixture("branches/create-branch-success.json");
      mockGitlabPost.mockResolvedValue(fixtureData);

      const result = await createBranch("39430079", {
        name: "feature/new-feature",
        ref: "main"
      });

      expect(mockGitlabPost).toHaveBeenCalledWith("/projects/39430079/repository/branches", {
        branch: "feature/new-feature",
        ref: "main"
      });
      expect(result).toHaveProperty("name", "feature/new-feature");
      expect(result).toHaveProperty("commit");
      expect(result.commit).toHaveProperty("id", "abc123def456789");
      expect(result.commit).toHaveProperty("web_url", "http://example.com/group/project/-/commit/abc123def456789");
    });

    it("should create branch from specific commit", async () => {
      const fixtureData = loadFixture("branches/create-branch-success.json");
      mockGitlabPost.mockResolvedValue(fixtureData);

      await createBranch("39430079", {
        name: "hotfix/urgent-fix",
        ref: "abc123def456"
      });

      expect(mockGitlabPost).toHaveBeenCalledWith("/projects/39430079/repository/branches", {
        branch: "hotfix/urgent-fix",
        ref: "abc123def456"
      });
    });

    it("should validate required parameters", async () => {
      await expect(createBranch("", { name: "test", ref: "main" })).rejects.toThrow("Project ID is required");

      await expect(createBranch("39430079", { name: "", ref: "main" })).rejects.toThrow("Branch name is required");

      await expect(createBranch("39430079", { name: "test", ref: "" })).rejects.toThrow("Source reference is required");

      await expect(createBranch("39430079", { name: "   ", ref: "main" })).rejects.toThrow("Branch name is required");

      await expect(createBranch("39430079", { name: "test", ref: "   " })).rejects.toThrow("Source reference is required");
    });

    it("should handle branch creation errors", async () => {
      const error = createGitLabError(400, "Branch already exists");
      mockGitlabPost.mockRejectedValue(error);

      await expect(createBranch("39430079", { name: "existing-branch", ref: "main" })).rejects.toThrow("Branch already exists");
    });

    it("should handle invalid source reference", async () => {
      const error = createGitLabError(404, "Source reference not found");
      mockGitlabPost.mockRejectedValue(error);

      await expect(createBranch("39430079", { name: "test", ref: "nonexistent" })).rejects.toThrow("Source reference not found");
    });

    it("should handle permission errors", async () => {
      const error = createGitLabError(403, "Insufficient permissions to create branch");
      mockGitlabPost.mockRejectedValue(error);

      await expect(createBranch("39430079", { name: "test", ref: "main" })).rejects.toThrow(
        "Insufficient permissions to create branch"
      );
    });

    it("should handle invalid branch names", async () => {
      const error = createGitLabError(400, "Invalid branch name");
      mockGitlabPost.mockRejectedValue(error);

      await expect(createBranch("39430079", { name: "invalid..name", ref: "main" })).rejects.toThrow("Invalid branch name");
    });

    it("should validate response schema", async () => {
      mockGitlabPost.mockResolvedValue({ invalid: "data" });

      await expect(createBranch("39430079", { name: "test", ref: "main" })).rejects.toThrow();
    });
  });
});
