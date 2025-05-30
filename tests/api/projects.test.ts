import { searchProjects, createRepository, forkProject } from "../../src/api/projects.js";
import { loadFixture, createGitLabError } from "../utils/test-helpers.js";

// Mock the GitLab client
jest.mock("../../src/utils/gitlab-client.js", () => ({
  gitlabGet: jest.fn(),
  gitlabPost: jest.fn(),
  encodeProjectId: jest.fn((id: string) => encodeURIComponent(id)),
  buildSearchParams: jest.fn((params: any) => new URLSearchParams(params))
}));

import { gitlabGet, gitlabPost } from "../../src/utils/gitlab-client.js";

const mockGitlabGet = gitlabGet as jest.MockedFunction<typeof gitlabGet>;
const mockGitlabPost = gitlabPost as jest.MockedFunction<typeof gitlabPost>;

describe("Projects API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("searchProjects", () => {
    it("should search and parse projects successfully", async () => {
      const fixtureData = loadFixture("projects/search-projects-success.json");
      mockGitlabGet.mockResolvedValue(fixtureData);

      const result = await searchProjects("test");

      expect(mockGitlabGet).toHaveBeenCalledWith("/projects", expect.any(URLSearchParams));
      expect(result).toHaveProperty("count", 2);
      expect(result).toHaveProperty("items");
      expect(result.items).toHaveLength(2);
      expect(result.items[0]).toHaveProperty("id", 39430079);
      expect(result.items[0]).toHaveProperty("name", "Sample Project");
      expect(result.items[0]).toHaveProperty("visibility", "private");
      expect(result.items[1]).toHaveProperty("fork", true);
    });

    it("should handle pagination parameters", async () => {
      const fixtureData = loadFixture("projects/search-projects-success.json");
      mockGitlabGet.mockResolvedValue(fixtureData);

      await searchProjects("test", 2, 50);

      expect(mockGitlabGet).toHaveBeenCalledWith("/projects", expect.any(URLSearchParams));
    });

    it("should handle empty search results", async () => {
      mockGitlabGet.mockResolvedValue([]);

      const result = await searchProjects("nonexistent");

      expect(result).toHaveProperty("count", 0);
      expect(result).toHaveProperty("items", []);
    });

    it("should validate search query input", async () => {
      await expect(searchProjects("")).rejects.toThrow("Search query is required");
      await expect(searchProjects("   ")).rejects.toThrow("Search query is required");
    });

    it("should validate pagination parameters", async () => {
      await expect(searchProjects("test", 0)).rejects.toThrow("Page number must be 1 or greater");
      await expect(searchProjects("test", 1, 0)).rejects.toThrow("Per page must be between 1 and 100");
      await expect(searchProjects("test", 1, 101)).rejects.toThrow("Per page must be between 1 and 100");
    });

    it("should handle GitLab API errors", async () => {
      const error = createGitLabError(403, "Forbidden");
      mockGitlabGet.mockRejectedValue(error);

      await expect(searchProjects("test")).rejects.toThrow("Forbidden");
    });

    it("should validate response schema", async () => {
      mockGitlabGet.mockResolvedValue([{ invalid: "data" }]);

      await expect(searchProjects("test")).rejects.toThrow();
    });
  });

  describe("createRepository", () => {
    it("should create repository with required fields only", async () => {
      const fixtureData = loadFixture("projects/create-project-success.json");
      mockGitlabPost.mockResolvedValue(fixtureData);

      const result = await createRepository({
        name: "example-api-project",
        description: undefined,
        visibility: undefined,
        initialize_with_readme: undefined
      });
      expect(result).toHaveProperty("id", 50002);
      expect(result).toHaveProperty("name", "example-api-project");
      expect(result).toHaveProperty("visibility", "private");
    });

    it("should create repository with all optional fields", async () => {
      const fixtureData = loadFixture("projects/create-project-success.json");
      mockGitlabPost.mockResolvedValue(fixtureData);

      const result = await createRepository({
        name: "example-api-project",
        description: "An example project created via API",
        visibility: "private",
        initialize_with_readme: true
      });
      expect(result).toHaveProperty("description", "An example project created via API");
    });

    it("should validate repository name input", async () => {
      await expect(createRepository({ name: "" })).rejects.toThrow("Repository name is required");
      await expect(createRepository({ name: "   " })).rejects.toThrow("Repository name is required");
    });

    it("should handle creation errors", async () => {
      const error = createGitLabError(400, "Name has already been taken");
      mockGitlabPost.mockRejectedValue(error);

      await expect(createRepository({ name: "existing-project" })).rejects.toThrow("Name has already been taken");
    });

    it("should validate response schema", async () => {
      mockGitlabPost.mockResolvedValue({ invalid: "repository data" });

      await expect(createRepository({ name: "test" })).rejects.toThrow();
    });
  });

  describe("forkProject", () => {
    it("should fork project successfully", async () => {
      const fixtureData = loadFixture("projects/fork-project-success.json");
      mockGitlabPost.mockResolvedValue(fixtureData);

      const result = await forkProject("39430079");

      expect(mockGitlabPost).toHaveBeenCalledWith("/projects/39430079/fork", undefined);
      expect(result).toHaveProperty("id", 50001);
      expect(result).toHaveProperty("path_with_namespace", "forkowner/example-project");
    });

    it("should fork project with namespace", async () => {
      const fixtureData = loadFixture("projects/fork-project-success.json");
      mockGitlabPost.mockResolvedValue(fixtureData);

      await forkProject("39430079", "my-namespace");

      expect(mockGitlabPost).toHaveBeenCalledWith("/projects/39430079/fork", {
        namespace: "my-namespace"
      });
    });

    it("should validate project ID input", async () => {
      await expect(forkProject("")).rejects.toThrow("Project ID is required");
      await expect(forkProject("   ")).rejects.toThrow("Project ID is required");
    });

    it("should handle fork errors", async () => {
      const error = createGitLabError(404, "Project not found");
      mockGitlabPost.mockRejectedValue(error);

      await expect(forkProject("999999")).rejects.toThrow("Project not found");
    });

    it("should handle insufficient permissions", async () => {
      const error = createGitLabError(403, "Insufficient permissions to fork");
      mockGitlabPost.mockRejectedValue(error);

      await expect(forkProject("39430079")).rejects.toThrow("Insufficient permissions to fork");
    });

    it("should validate response schema", async () => {
      mockGitlabPost.mockResolvedValue({ invalid: "fork data" });

      await expect(forkProject("39430079")).rejects.toThrow();
    });
  });
});
