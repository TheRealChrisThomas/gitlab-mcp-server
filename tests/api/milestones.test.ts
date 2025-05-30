import { listMilestones, createMilestone, updateMilestone, deleteMilestone } from "../../src/api/milestones.js";
import { loadFixture, createGitLabError } from "../utils/test-helpers.js";

// Mock the GitLab client
jest.mock("../../src/utils/gitlab-client.js", () => ({
  gitlabGet: jest.fn(),
  gitlabPost: jest.fn(),
  gitlabPut: jest.fn(),
  gitlabDelete: jest.fn(),
  encodeProjectId: jest.fn((id: string) => encodeURIComponent(id)),
  buildSearchParams: jest.fn((params: any) => new URLSearchParams(params))
}));

import { gitlabGet, gitlabPost, gitlabPut, gitlabDelete } from "../../src/utils/gitlab-client.js";

const mockGitlabGet = gitlabGet as jest.MockedFunction<typeof gitlabGet>;
const mockGitlabPost = gitlabPost as jest.MockedFunction<typeof gitlabPost>;
const mockGitlabPut = gitlabPut as jest.MockedFunction<typeof gitlabPut>;
const mockGitlabDelete = gitlabDelete as jest.MockedFunction<typeof gitlabDelete>;

describe("Milestones API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("listMilestones", () => {
    it("should fetch and parse milestones successfully", async () => {
      const fixtureData = loadFixture("milestones/list-milestones-success.json");
      mockGitlabGet.mockResolvedValue(fixtureData);

      const result = await listMilestones("39430079");

      expect(mockGitlabGet).toHaveBeenCalledWith("/projects/39430079/milestones", expect.any(URLSearchParams));
      expect(result).toHaveLength(3);
      expect(result[0]).toHaveProperty("id", 2001);
      expect(result[0]).toHaveProperty("title", "v1.0 Release");
      expect(result[0]).toHaveProperty("state", "active");
      expect(result[0]).toHaveProperty("due_date", "2024-03-01");
      expect(result[1]).toHaveProperty("state", "closed");
      expect(result[2]).toHaveProperty("due_date", null);
    });

    it("should handle state filtering", async () => {
      const fixtureData = loadFixture("milestones/list-milestones-success.json");
      mockGitlabGet.mockResolvedValue(fixtureData);

      await listMilestones("39430079", "active");

      expect(mockGitlabGet).toHaveBeenCalledWith("/projects/39430079/milestones", expect.any(URLSearchParams));
    });

    it("should handle pagination parameters", async () => {
      const fixtureData = loadFixture("milestones/list-milestones-success.json");
      mockGitlabGet.mockResolvedValue(fixtureData);

      await listMilestones("39430079", undefined, 2, 50);

      expect(mockGitlabGet).toHaveBeenCalledWith("/projects/39430079/milestones", expect.any(URLSearchParams));
    });

    it("should handle empty results", async () => {
      mockGitlabGet.mockResolvedValue([]);

      const result = await listMilestones("39430079");

      expect(result).toEqual([]);
    });

    it("should validate project ID input", async () => {
      await expect(listMilestones("")).rejects.toThrow("Project ID is required");
      await expect(listMilestones("   ")).rejects.toThrow("Project ID is required");
    });

    it("should validate pagination parameters", async () => {
      await expect(listMilestones("39430079", "active", 0)).rejects.toThrow("Page number must be 1 or greater");
      await expect(listMilestones("39430079", "active", 1, 0)).rejects.toThrow("Per page must be between 1 and 100");
      await expect(listMilestones("39430079", "active", 1, 101)).rejects.toThrow("Per page must be between 1 and 100");
    });

    it("should handle GitLab API errors", async () => {
      const error = createGitLabError(403, "Forbidden");
      mockGitlabGet.mockRejectedValue(error);

      await expect(listMilestones("39430079")).rejects.toThrow("Forbidden");
    });

    it("should validate response schema", async () => {
      mockGitlabGet.mockResolvedValue([{ invalid: "data" }]);

      await expect(listMilestones("39430079")).rejects.toThrow();
    });
  });

  describe("createMilestone", () => {
    it("should create milestone with required fields only", async () => {
      const fixtureData = loadFixture("milestones/create-milestone-success.json");
      mockGitlabPost.mockResolvedValue(fixtureData);

      const result = await createMilestone("39430079", "v2.0 Planning");

      expect(mockGitlabPost).toHaveBeenCalledWith("/projects/39430079/milestones", {
        title: "v2.0 Planning",
        description: undefined,
        due_date: undefined,
        start_date: undefined
      });
      expect(result).toHaveProperty("id", 2004);
      expect(result).toHaveProperty("title", "v2.0 Planning");
      expect(result).toHaveProperty("state", "active");
    });

    it("should create milestone with all optional fields", async () => {
      const fixtureData = loadFixture("milestones/create-milestone-success.json");
      mockGitlabPost.mockResolvedValue(fixtureData);

      await createMilestone("39430079", "v2.0 Planning", "Planning phase for version 2.0", "2024-06-30", "2024-02-20");

      expect(mockGitlabPost).toHaveBeenCalledWith("/projects/39430079/milestones", {
        title: "v2.0 Planning",
        description: "Planning phase for version 2.0",
        due_date: "2024-06-30",
        start_date: "2024-02-20"
      });
    });

    it("should validate required fields", async () => {
      await expect(createMilestone("", "Test Milestone")).rejects.toThrow("Project ID is required");

      await expect(createMilestone("39430079", "")).rejects.toThrow("Milestone title is required");

      await expect(createMilestone("39430079", "   ")).rejects.toThrow("Milestone title is required");
    });

    it("should handle creation errors", async () => {
      const error = createGitLabError(400, "Title has already been taken");
      mockGitlabPost.mockRejectedValue(error);

      await expect(createMilestone("39430079", "existing-milestone")).rejects.toThrow("Title has already been taken");
    });

    it("should validate response schema", async () => {
      mockGitlabPost.mockResolvedValue({ invalid: "milestone data" });

      await expect(createMilestone("39430079", "test")).rejects.toThrow();
    });
  });

  describe("updateMilestone", () => {
    it("should update milestone successfully", async () => {
      const fixtureData = loadFixture("milestones/create-milestone-success.json");
      const updatedData = { ...fixtureData, title: "v2.0 Development", state: "closed" };
      mockGitlabPut.mockResolvedValue(updatedData);

      const result = await updateMilestone("39430079", 2004, {
        title: "v2.0 Development",
        state_event: "close"
      });

      expect(mockGitlabPut).toHaveBeenCalledWith("/projects/39430079/milestones/2004", {
        title: "v2.0 Development",
        state_event: "close"
      });
      expect(result).toHaveProperty("title", "v2.0 Development");
      expect(result).toHaveProperty("state", "closed");
    });

    it("should update milestone with all options", async () => {
      const fixtureData = loadFixture("milestones/create-milestone-success.json");
      mockGitlabPut.mockResolvedValue(fixtureData);

      await updateMilestone("39430079", 2004, {
        title: "Updated Title",
        description: "Updated description",
        due_date: "2024-12-31",
        start_date: "2024-06-01",
        state_event: "activate"
      });

      expect(mockGitlabPut).toHaveBeenCalledWith("/projects/39430079/milestones/2004", {
        title: "Updated Title",
        description: "Updated description",
        due_date: "2024-12-31",
        start_date: "2024-06-01",
        state_event: "activate"
      });
    });

    it("should validate required parameters", async () => {
      await expect(updateMilestone("", 2004, { title: "Test" })).rejects.toThrow("Project ID is required");

      await expect(updateMilestone("39430079", 0, { title: "Test" })).rejects.toThrow("Valid milestone ID is required");
    });

    it("should handle update errors", async () => {
      const error = createGitLabError(404, "Milestone not found");
      mockGitlabPut.mockRejectedValue(error);

      await expect(updateMilestone("39430079", 9999, { title: "Test" })).rejects.toThrow("Milestone not found");
    });

    it("should validate response schema", async () => {
      mockGitlabPut.mockResolvedValue({ invalid: "data" });

      await expect(updateMilestone("39430079", 2004, { title: "Test" })).rejects.toThrow();
    });
  });

  describe("deleteMilestone", () => {
    it("should delete milestone successfully", async () => {
      mockGitlabDelete.mockResolvedValue(undefined);

      await deleteMilestone("39430079", 2004);

      expect(mockGitlabDelete).toHaveBeenCalledWith("/projects/39430079/milestones/2004");
    });

    it("should validate required parameters", async () => {
      await expect(deleteMilestone("", 2004)).rejects.toThrow("Project ID is required");

      await expect(deleteMilestone("39430079", 0)).rejects.toThrow("Valid milestone ID is required");
    });

    it("should handle deletion errors", async () => {
      const error = createGitLabError(404, "Milestone not found");
      mockGitlabDelete.mockRejectedValue(error);

      await expect(deleteMilestone("39430079", 9999)).rejects.toThrow("Milestone not found");
    });

    it("should handle insufficient permissions", async () => {
      const error = createGitLabError(403, "Insufficient permissions to delete milestone");
      mockGitlabDelete.mockRejectedValue(error);

      await expect(deleteMilestone("39430079", 2004)).rejects.toThrow("Insufficient permissions to delete milestone");
    });

    it("should handle milestones with issues", async () => {
      const error = createGitLabError(400, "Cannot delete milestone with issues");
      mockGitlabDelete.mockRejectedValue(error);

      await expect(deleteMilestone("39430079", 2004)).rejects.toThrow("Cannot delete milestone with issues");
    });
  });
});
