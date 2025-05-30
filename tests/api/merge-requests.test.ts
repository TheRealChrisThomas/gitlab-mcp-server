import {
  listMergeRequests,
  createMergeRequest,
  updateMergeRequest,
  mergeMergeRequest,
  addMergeRequestComment
} from "../../src/api/merge-requests.js";
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

describe("Merge Requests API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("listMergeRequests", () => {
    it("should fetch and parse merge requests successfully", async () => {
      const fixtureData = loadFixture("merge-requests/list-merge-requests-success.json");
      mockGitlabGet.mockResolvedValue(fixtureData);

      const result = await listMergeRequests("39430079");

      expect(mockGitlabGet).toHaveBeenCalledWith("/projects/39430079/merge_requests", expect.any(URLSearchParams));
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty("id", 2001);
      expect(result[0]).toHaveProperty("title", "Fix authentication issue");
      expect(result[0]).toHaveProperty("state", "opened");
      expect(result[1]).toHaveProperty("state", "merged");
    });

    it("should handle filtering by state", async () => {
      const fixtureData = loadFixture("merge-requests/list-merge-requests-success.json");
      mockGitlabGet.mockResolvedValue(fixtureData);

      await listMergeRequests("39430079", { state: "opened" });

      expect(mockGitlabGet).toHaveBeenCalledWith("/projects/39430079/merge_requests", expect.any(URLSearchParams));
    });

    it("should handle multiple filter options", async () => {
      const fixtureData = loadFixture("merge-requests/list-merge-requests-success.json");
      mockGitlabGet.mockResolvedValue(fixtureData);

      await listMergeRequests("39430079", {
        state: "opened",
        target_branch: "main",
        author_id: 101,
        page: 2,
        per_page: 50
      });

      expect(mockGitlabGet).toHaveBeenCalledWith("/projects/39430079/merge_requests", expect.any(URLSearchParams));
    });

    it("should handle empty results", async () => {
      mockGitlabGet.mockResolvedValue([]);

      const result = await listMergeRequests("39430079");

      expect(result).toEqual([]);
    });

    it("should validate project ID input", async () => {
      await expect(listMergeRequests("")).rejects.toThrow("Project ID is required");
      await expect(listMergeRequests("   ")).rejects.toThrow("Project ID is required");
    });

    it("should handle GitLab API errors", async () => {
      const error = createGitLabError(403, "Forbidden");
      mockGitlabGet.mockRejectedValue(error);

      await expect(listMergeRequests("39430079")).rejects.toThrow("Forbidden");
    });

    it("should validate response schema", async () => {
      mockGitlabGet.mockResolvedValue([{ invalid: "data" }]);

      await expect(listMergeRequests("39430079")).rejects.toThrow();
    });
  });

  describe("createMergeRequest", () => {
    it("should create merge request with required fields", async () => {
      const fixtureData = loadFixture("merge-requests/create-merge-request-success.json");
      mockGitlabPost.mockResolvedValue(fixtureData);

      const result = await createMergeRequest("39430079", {
        title: "Add new feature",
        source_branch: "feature/new-feature",
        target_branch: "main"
      });

      expect(mockGitlabPost).toHaveBeenCalledWith("/projects/39430079/merge_requests", {
        title: "Add new feature",
        description: undefined,
        source_branch: "feature/new-feature",
        target_branch: "main",
        allow_collaboration: undefined,
        draft: undefined
      });
      expect(result).toHaveProperty("id", 2001);
      expect(result).toHaveProperty("title", "Add new feature");
      expect(result).toHaveProperty("state", "opened");
    });

    it("should create merge request with all optional fields", async () => {
      const fixtureData = loadFixture("merge-requests/create-merge-request-success.json");
      mockGitlabPost.mockResolvedValue(fixtureData);

      await createMergeRequest("39430079", {
        title: "Feature: Add user dashboard",
        description: "Implements a new user dashboard with analytics and activity feed.",
        source_branch: "feature/user-dashboard",
        target_branch: "develop",
        allow_collaboration: true,
        draft: false
      });

      expect(mockGitlabPost).toHaveBeenCalledWith("/projects/39430079/merge_requests", {
        title: "Feature: Add user dashboard",
        description: "Implements a new user dashboard with analytics and activity feed.",
        source_branch: "feature/user-dashboard",
        target_branch: "develop",
        allow_collaboration: true,
        draft: false
      });
    });

    it("should validate required fields", async () => {
      await expect(createMergeRequest("", { title: "Test", source_branch: "feature", target_branch: "main" })).rejects.toThrow(
        "Project ID is required"
      );

      await expect(
        createMergeRequest("39430079", { title: "", source_branch: "feature", target_branch: "main" })
      ).rejects.toThrow("Merge request title is required");

      await expect(createMergeRequest("39430079", { title: "Test", source_branch: "", target_branch: "main" })).rejects.toThrow(
        "Source branch is required"
      );

      await expect(
        createMergeRequest("39430079", { title: "Test", source_branch: "feature", target_branch: "" })
      ).rejects.toThrow("Target branch is required");
    });

    it("should handle creation errors", async () => {
      const error = createGitLabError(400, "Source branch does not exist");
      mockGitlabPost.mockRejectedValue(error);

      await expect(
        createMergeRequest("39430079", {
          title: "Test MR",
          source_branch: "nonexistent",
          target_branch: "main"
        })
      ).rejects.toThrow("Source branch does not exist");
    });
  });

  describe("updateMergeRequest", () => {
    it("should update merge request successfully", async () => {
      const fixtureData = loadFixture("merge-requests/create-merge-request-success.json");
      // Modify fixture to show updated state
      const updatedData = { ...fixtureData, title: "Updated: Add user dashboard" };
      mockGitlabPut.mockResolvedValue(updatedData);

      const result = await updateMergeRequest("39430079", 3, {
        title: "Updated: Add user dashboard"
      });

      expect(mockGitlabPut).toHaveBeenCalledWith("/projects/39430079/merge_requests/3", {
        title: "Updated: Add user dashboard",
        labels: undefined
      });
      expect(result).toHaveProperty("title", "Updated: Add user dashboard");
    });

    it("should handle label updates", async () => {
      const fixtureData = loadFixture("merge-requests/create-merge-request-success.json");
      mockGitlabPut.mockResolvedValue(fixtureData);

      await updateMergeRequest("39430079", 3, {
        labels: ["enhancement", "frontend"]
      });

      expect(mockGitlabPut).toHaveBeenCalledWith("/projects/39430079/merge_requests/3", {
        labels: "enhancement,frontend"
      });
    });

    it("should validate required parameters", async () => {
      await expect(updateMergeRequest("", 3, { title: "Test" })).rejects.toThrow("Project ID is required");

      await expect(updateMergeRequest("39430079", 0, { title: "Test" })).rejects.toThrow("Valid merge request IID is required");
    });

    it("should handle update errors", async () => {
      const error = createGitLabError(404, "Merge request not found");
      mockGitlabPut.mockRejectedValue(error);

      await expect(updateMergeRequest("39430079", 999, { title: "Test" })).rejects.toThrow("Merge request not found");
    });
  });

  describe("mergeMergeRequest", () => {
    it("should merge merge request successfully", async () => {
      const fixtureData = loadFixture("merge-requests/list-merge-requests-success.json");
      const mergedData = { ...fixtureData[1] }; // Use the already merged MR from fixture
      mockGitlabPut.mockResolvedValue(mergedData);

      const result = await mergeMergeRequest("39430079", 2);

      expect(mockGitlabPut).toHaveBeenCalledWith("/projects/39430079/merge_requests/2/merge", {});
      expect(result).toHaveProperty("state", "merged");
    });

    it("should merge with custom options", async () => {
      const fixtureData = loadFixture("merge-requests/list-merge-requests-success.json");
      mockGitlabPut.mockResolvedValue(fixtureData[1]);

      await mergeMergeRequest("39430079", 2, {
        merge_commit_message: "Custom merge message",
        should_remove_source_branch: true,
        merge_when_pipeline_succeeds: false
      });

      expect(mockGitlabPut).toHaveBeenCalledWith("/projects/39430079/merge_requests/2/merge", {
        merge_commit_message: "Custom merge message",
        should_remove_source_branch: true,
        merge_when_pipeline_succeeds: false
      });
    });

    it("should validate required parameters", async () => {
      await expect(mergeMergeRequest("", 2)).rejects.toThrow("Project ID is required");

      await expect(mergeMergeRequest("39430079", 0)).rejects.toThrow("Valid merge request IID is required");
    });
  });

  describe("addMergeRequestComment", () => {
    it("should add comment successfully", async () => {
      const fixtureData = loadFixture("merge-requests/add-comment-success.json");
      mockGitlabPost.mockResolvedValue(fixtureData);

      const result = await addMergeRequestComment("39430079", 1, "This merge request looks good to me. LGTM!");

      expect(mockGitlabPost).toHaveBeenCalledWith("/projects/39430079/merge_requests/1/notes", {
        body: "This merge request looks good to me. LGTM!"
      });
      expect(result).toHaveProperty("id", 987655);
      expect(result).toHaveProperty("body", "This merge request looks good to me. LGTM!");
      expect(result).toHaveProperty("noteable_type", "MergeRequest");
    });

    it("should validate required parameters", async () => {
      await expect(addMergeRequestComment("", 1, "Test comment")).rejects.toThrow("Project ID is required");

      await expect(addMergeRequestComment("39430079", 0, "Test comment")).rejects.toThrow("Valid merge request IID is required");

      await expect(addMergeRequestComment("39430079", 1, "")).rejects.toThrow("Comment body is required");
    });

    it("should handle comment creation errors", async () => {
      const error = createGitLabError(403, "Insufficient permissions");
      mockGitlabPost.mockRejectedValue(error);

      await expect(addMergeRequestComment("39430079", 1, "Test comment")).rejects.toThrow("Insufficient permissions");
    });

    it("should validate comment response schema", async () => {
      mockGitlabPost.mockResolvedValue({ invalid: "comment data" });

      await expect(addMergeRequestComment("39430079", 1, "Test comment")).rejects.toThrow();
    });
  });
});
