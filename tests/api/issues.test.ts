import { listIssues, createIssue, updateIssue, searchIssues, addIssueComment } from "../../src/api/issues.js";
import { loadFixture, createGitLabError } from "../utils/test-helpers.js";

// Mock the GitLab client
jest.mock("../../src/utils/gitlab-client.js", () => ({
  gitlabGet: jest.fn(),
  gitlabPost: jest.fn(),
  gitlabPut: jest.fn(),
  encodeProjectId: jest.fn((id: string) => encodeURIComponent(id)),
  buildSearchParams: jest.fn((params: any) => new URLSearchParams(params))
}));

import { gitlabGet, gitlabPost, gitlabPut } from "../../src/utils/gitlab-client.js";

const mockGitlabGet = gitlabGet as jest.MockedFunction<typeof gitlabGet>;
const mockGitlabPost = gitlabPost as jest.MockedFunction<typeof gitlabPost>;
const mockGitlabPut = gitlabPut as jest.MockedFunction<typeof gitlabPut>;

describe("Issues API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("listIssues", () => {
    it("should fetch and parse issues successfully", async () => {
      const fixtureData = loadFixture("issues/list-issues-success.json");
      mockGitlabGet.mockResolvedValue(fixtureData);

      const result = await listIssues("39430079");

      expect(mockGitlabGet).toHaveBeenCalledWith("/projects/39430079/issues", expect.any(URLSearchParams));
      expect(result).toHaveLength(4);
      expect(result[0]).toHaveProperty("id", 1);
      expect(result[0]).toHaveProperty("title", "Fix login bug");
      expect(result[0]).toHaveProperty("state", "opened");
      expect(result[1]).toHaveProperty("state", "closed");

      // Test project milestone (has project_id)
      expect(result[0].milestone).toHaveProperty("project_id", 39430079);

      // Test group milestones (no project_id)
      expect(result[2].milestone).not.toHaveProperty("project_id");
      expect((result[2].milestone as any)?.web_url).toContain("/groups/");
      expect(result[3].milestone).not.toHaveProperty("project_id");
      expect((result[3].milestone as any)?.web_url).toContain("/groups/");

      // Test null descriptions
      expect(result[1]).toHaveProperty("description", null);
      expect(result[3]).toHaveProperty("description", null);
    });

    it("should handle filtering by state", async () => {
      const fixtureData = loadFixture("issues/list-issues-success.json");
      mockGitlabGet.mockResolvedValue(fixtureData);

      await listIssues("39430079", { state: "opened" });

      expect(mockGitlabGet).toHaveBeenCalledWith("/projects/39430079/issues", expect.any(URLSearchParams));
    });

    it("should handle multiple filter options", async () => {
      const fixtureData = loadFixture("issues/list-issues-success.json");
      mockGitlabGet.mockResolvedValue(fixtureData);

      await listIssues("39430079", {
        state: "opened",
        labels: "bug,high-priority",
        assignee_id: 789,
        page: 2,
        per_page: 50
      });

      expect(mockGitlabGet).toHaveBeenCalledWith("/projects/39430079/issues", expect.any(URLSearchParams));
    });

    it("should handle empty results", async () => {
      mockGitlabGet.mockResolvedValue([]);

      const result = await listIssues("39430079");

      expect(result).toEqual([]);
    });

    it("should handle GitLab API errors", async () => {
      const error = createGitLabError(404, "404 Project Not Found");
      mockGitlabGet.mockRejectedValue(error);

      await expect(listIssues("39430079")).rejects.toThrow("404 Project Not Found");
    });

    it("should validate response schema", async () => {
      // Test with invalid data that should fail Zod validation
      mockGitlabGet.mockResolvedValue([{ invalid: "data" }]);

      await expect(listIssues("39430079")).rejects.toThrow();
    });

    it("should validate project ID input", async () => {
      await expect(listIssues("")).rejects.toThrow("Project ID is required");
      await expect(listIssues("   ")).rejects.toThrow("Project ID is required");
    });
  });

  describe("createIssue", () => {
    it("should create issue with required fields only", async () => {
      const fixtureData = loadFixture("issues/create-issue-success.json");
      mockGitlabPost.mockResolvedValue(fixtureData);

      const result = await createIssue("39430079", {
        title: "New bug report from API",
        description: undefined,
        assignee_ids: undefined,
        milestone_id: undefined,
        labels: undefined
      });
      expect(result).toHaveProperty("id", 3);
      expect(result).toHaveProperty("title", "New bug report from API");
      expect(result).toHaveProperty("state", "opened");
    });

    it("should create issue with all optional fields", async () => {
      const fixtureData = loadFixture("issues/create-issue-success.json");
      mockGitlabPost.mockResolvedValue(fixtureData);

      const result = await createIssue("39430079", {
        title: "New bug report from API",
        description: "Detailed description of the bug found in the application",
        assignee_ids: [789],
        milestone_id: 1001,
        labels: ["bug", "api"]
      });
      expect(result).toHaveProperty("labels", ["bug", "api"]);
    });

    it("should handle creation errors", async () => {
      const error = createGitLabError(400, "Title is required");
      mockGitlabPost.mockRejectedValue(error);

      await expect(createIssue("39430079", { title: "" })).rejects.toThrow("Issue title is required");
    });

    it("should validate project ID and title input", async () => {
      await expect(createIssue("", { title: "Test" })).rejects.toThrow("Project ID is required");
      await expect(createIssue("   ", { title: "Test" })).rejects.toThrow("Project ID is required");
      await expect(createIssue("39430079", { title: "" })).rejects.toThrow("Issue title is required");
      await expect(createIssue("39430079", { title: "   " })).rejects.toThrow("Issue title is required");
    });
  });

  describe("updateIssue", () => {
    it("should update issue successfully", async () => {
      const fixtureData = loadFixture("issues/create-issue-success.json");
      // Modify fixture to show updated state
      const updatedData = { ...fixtureData, title: "Updated Title", state: "closed" };
      mockGitlabPut.mockResolvedValue(updatedData);

      const result = await updateIssue("39430079", 3, {
        title: "Updated Title",
        state_event: "close"
      });

      expect(mockGitlabPut).toHaveBeenCalledWith("/projects/39430079/issues/3", {
        title: "Updated Title",
        state_event: "close",
        labels: undefined
      });
      expect(result).toHaveProperty("title", "Updated Title");
    });

    it("should handle label updates", async () => {
      const fixtureData = loadFixture("issues/create-issue-success.json");
      mockGitlabPut.mockResolvedValue(fixtureData);

      await updateIssue("39430079", 3, {
        labels: ["updated", "labels"]
      });

      expect(mockGitlabPut).toHaveBeenCalledWith("/projects/39430079/issues/3", {
        labels: "updated,labels"
      });
    });

    it("should handle update errors", async () => {
      const error = createGitLabError(404, "Issue not found");
      mockGitlabPut.mockRejectedValue(error);

      await expect(updateIssue("39430079", 999, { title: "New Title" })).rejects.toThrow("Issue not found");
    });

    it("should validate project ID and issue IID input", async () => {
      await expect(updateIssue("", 1, { title: "Test" })).rejects.toThrow("Project ID is required");
      await expect(updateIssue("   ", 1, { title: "Test" })).rejects.toThrow("Project ID is required");
      await expect(updateIssue("39430079", 0, { title: "Test" })).rejects.toThrow("Valid issue IID is required");
      await expect(updateIssue("39430079", -1, { title: "Test" })).rejects.toThrow("Valid issue IID is required");
    });
  });

  describe("searchIssues", () => {
    it("should search issues with term", async () => {
      const fixtureData = loadFixture("issues/list-issues-success.json");
      mockGitlabGet.mockResolvedValue(fixtureData);

      const result = await searchIssues("39430079", "bug fix");

      expect(mockGitlabGet).toHaveBeenCalledWith("/projects/39430079/issues", expect.any(URLSearchParams));
      expect(result).toHaveLength(4);
    });

    it("should search with additional filters", async () => {
      const fixtureData = loadFixture("issues/list-issues-success.json");
      mockGitlabGet.mockResolvedValue(fixtureData);

      await searchIssues("39430079", "bug", {
        state: "opened",
        labels: "high-priority"
      });

      expect(mockGitlabGet).toHaveBeenCalledWith("/projects/39430079/issues", expect.any(URLSearchParams));
    });

    it("should validate search term input", async () => {
      await expect(searchIssues("39430079", "")).rejects.toThrow("Search term is required");
      await expect(searchIssues("39430079", "   ")).rejects.toThrow("Search term is required");
    });
  });

  describe("addIssueComment", () => {
    it("should add comment successfully", async () => {
      const fixtureData = loadFixture("issues/add-comment-success.json");
      mockGitlabPost.mockResolvedValue(fixtureData);

      const result = await addIssueComment("39430079", 1, "This is a comment added via API");

      expect(mockGitlabPost).toHaveBeenCalledWith("/projects/39430079/issues/1/notes", {
        body: "This is a comment added via API"
      });
      expect(result).toHaveProperty("id", 987654);
      expect(result).toHaveProperty("body", "This is a comment added via API");
      expect(result).toHaveProperty("noteable_type", "Issue");
    });

    it("should handle comment creation errors", async () => {
      const error = createGitLabError(403, "Forbidden");
      mockGitlabPost.mockRejectedValue(error);

      await expect(addIssueComment("39430079", 1, "Test comment")).rejects.toThrow("Forbidden");
    });

    it("should validate comment response schema", async () => {
      mockGitlabPost.mockResolvedValue({ invalid: "comment data" });

      await expect(addIssueComment("39430079", 1, "Test comment")).rejects.toThrow();
    });

    it("should validate project ID, issue IID, and comment body input", async () => {
      await expect(addIssueComment("", 1, "Test comment")).rejects.toThrow("Project ID is required");
      await expect(addIssueComment("   ", 1, "Test comment")).rejects.toThrow("Project ID is required");
      await expect(addIssueComment("39430079", 0, "Test comment")).rejects.toThrow("Valid issue IID is required");
      await expect(addIssueComment("39430079", -1, "Test comment")).rejects.toThrow("Valid issue IID is required");
      await expect(addIssueComment("39430079", 1, "")).rejects.toThrow("Comment body is required");
      await expect(addIssueComment("39430079", 1, "   ")).rejects.toThrow("Comment body is required");
    });
  });
});
