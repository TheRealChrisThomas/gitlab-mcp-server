import {
  listGroupMilestones,
  createGroupMilestone,
  updateGroupMilestone,
  deleteGroupMilestone
} from "../../src/api/group-milestones.js";
import { loadFixture, createGitLabError } from "../utils/test-helpers.js";

// Mock the GitLab client
jest.mock("../../src/utils/gitlab-client.js", () => ({
  gitlabGet: jest.fn(),
  gitlabPost: jest.fn(),
  gitlabPut: jest.fn(),
  gitlabDelete: jest.fn(),
  buildSearchParams: jest.fn((params: any) => new URLSearchParams(params))
}));

import { gitlabGet, gitlabPost, gitlabPut, gitlabDelete } from "../../src/utils/gitlab-client.js";

const mockGitlabGet = gitlabGet as jest.MockedFunction<typeof gitlabGet>;
const mockGitlabPost = gitlabPost as jest.MockedFunction<typeof gitlabPost>;
const mockGitlabPut = gitlabPut as jest.MockedFunction<typeof gitlabPut>;
const mockGitlabDelete = gitlabDelete as jest.MockedFunction<typeof gitlabDelete>;

describe("Group Milestones API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("listGroupMilestones", () => {
    it("should fetch and parse group milestones successfully", async () => {
      const fixtureData = loadFixture("group-milestones/list-group-milestones-success.json");
      mockGitlabGet.mockResolvedValue(fixtureData);

      const result = await listGroupMilestones("mygroup");

      expect(mockGitlabGet).toHaveBeenCalledWith("/groups/mygroup/milestones", expect.any(URLSearchParams));
      expect(result).toHaveLength(3);
      expect(result[0]).toHaveProperty("id", 3001);
      expect(result[0]).toHaveProperty("title", "Q1 2024 Goals");
      expect(result[0]).toHaveProperty("group_id", 12345);
      expect(result[0]).toHaveProperty("state", "active");
      expect(result[1]).toHaveProperty("state", "closed");
      expect(result[2]).toHaveProperty("due_date", null);
    });

    it("should handle filtering options", async () => {
      const fixtureData = loadFixture("group-milestones/list-group-milestones-success.json");
      mockGitlabGet.mockResolvedValue(fixtureData);

      await listGroupMilestones("mygroup", {
        state: "active",
        search: "Q1",
        include_ancestors: true,
        page: 2,
        per_page: 50
      });

      expect(mockGitlabGet).toHaveBeenCalledWith("/groups/mygroup/milestones", expect.any(URLSearchParams));
    });

    it("should handle empty results", async () => {
      mockGitlabGet.mockResolvedValue([]);

      const result = await listGroupMilestones("mygroup");

      expect(result).toEqual([]);
    });

    it("should validate group ID input", async () => {
      await expect(listGroupMilestones("")).rejects.toThrow("Group ID is required");
      await expect(listGroupMilestones("   ")).rejects.toThrow("Group ID is required");
    });

    it("should validate pagination parameters", async () => {
      await expect(listGroupMilestones("mygroup", { page: 0 })).rejects.toThrow("Page number must be 1 or greater");

      await expect(listGroupMilestones("mygroup", { per_page: 0 })).rejects.toThrow("Per page must be between 1 and 100");

      await expect(listGroupMilestones("mygroup", { per_page: 101 })).rejects.toThrow("Per page must be between 1 and 100");
    });

    it("should handle GitLab API errors", async () => {
      const error = createGitLabError(403, "Forbidden");
      mockGitlabGet.mockRejectedValue(error);

      await expect(listGroupMilestones("mygroup")).rejects.toThrow("Forbidden");
    });

    it("should validate response schema", async () => {
      mockGitlabGet.mockResolvedValue([{ invalid: "data" }]);

      await expect(listGroupMilestones("mygroup")).rejects.toThrow();
    });
  });

  describe("createGroupMilestone", () => {
    it("should create group milestone with required fields only", async () => {
      const fixtureData = loadFixture("group-milestones/create-group-milestone-success.json");
      mockGitlabPost.mockResolvedValue(fixtureData);

      const result = await createGroupMilestone("mygroup", "Q2 2024 Planning");

      expect(mockGitlabPost).toHaveBeenCalledWith("/groups/mygroup/milestones", {
        title: "Q2 2024 Planning",
        description: undefined,
        due_date: undefined,
        start_date: undefined
      });
      expect(result).toHaveProperty("id", 3004);
      expect(result).toHaveProperty("title", "Q2 2024 Planning");
      expect(result).toHaveProperty("group_id", 12345);
      expect(result).toHaveProperty("state", "active");
    });

    it("should create group milestone with all optional fields", async () => {
      const fixtureData = loadFixture("group-milestones/create-group-milestone-success.json");
      mockGitlabPost.mockResolvedValue(fixtureData);

      await createGroupMilestone("mygroup", "Q2 2024 Planning", "Second quarter planning", "2024-06-30", "2024-04-01");

      expect(mockGitlabPost).toHaveBeenCalledWith("/groups/mygroup/milestones", {
        title: "Q2 2024 Planning",
        description: "Second quarter planning",
        due_date: "2024-06-30",
        start_date: "2024-04-01"
      });
    });

    it("should validate required fields", async () => {
      await expect(createGroupMilestone("", "Test Milestone")).rejects.toThrow("Group ID is required");

      await expect(createGroupMilestone("mygroup", "")).rejects.toThrow("Milestone title is required");

      await expect(createGroupMilestone("mygroup", "   ")).rejects.toThrow("Milestone title is required");
    });

    it("should handle creation errors", async () => {
      const error = createGitLabError(400, "Title has already been taken");
      mockGitlabPost.mockRejectedValue(error);

      await expect(createGroupMilestone("mygroup", "existing-milestone")).rejects.toThrow("Title has already been taken");
    });

    it("should validate response schema", async () => {
      mockGitlabPost.mockResolvedValue({ invalid: "milestone data" });

      await expect(createGroupMilestone("mygroup", "test")).rejects.toThrow();
    });
  });

  describe("updateGroupMilestone", () => {
    it("should update group milestone successfully", async () => {
      const fixtureData = loadFixture("group-milestones/create-group-milestone-success.json");
      const updatedData = { ...fixtureData, title: "Q2 2024 Execution", state: "closed" };
      mockGitlabPut.mockResolvedValue(updatedData);

      const result = await updateGroupMilestone("mygroup", 3004, {
        title: "Q2 2024 Execution",
        state_event: "close"
      });

      expect(mockGitlabPut).toHaveBeenCalledWith("/groups/mygroup/milestones/3004", {
        title: "Q2 2024 Execution",
        state_event: "close"
      });
      expect(result).toHaveProperty("title", "Q2 2024 Execution");
      expect(result).toHaveProperty("state", "closed");
    });

    it("should update group milestone with all options", async () => {
      const fixtureData = loadFixture("group-milestones/create-group-milestone-success.json");
      mockGitlabPut.mockResolvedValue(fixtureData);

      await updateGroupMilestone("mygroup", 3004, {
        title: "Updated Title",
        description: "Updated description",
        due_date: "2024-12-31",
        start_date: "2024-06-01",
        state_event: "activate"
      });

      expect(mockGitlabPut).toHaveBeenCalledWith("/groups/mygroup/milestones/3004", {
        title: "Updated Title",
        description: "Updated description",
        due_date: "2024-12-31",
        start_date: "2024-06-01",
        state_event: "activate"
      });
    });

    it("should validate required parameters", async () => {
      await expect(updateGroupMilestone("", 3004, { title: "Test" })).rejects.toThrow("Group ID is required");

      await expect(updateGroupMilestone("mygroup", 0, { title: "Test" })).rejects.toThrow("Valid milestone ID is required");
    });

    it("should handle update errors", async () => {
      const error = createGitLabError(404, "Milestone not found");
      mockGitlabPut.mockRejectedValue(error);

      await expect(updateGroupMilestone("mygroup", 9999, { title: "Test" })).rejects.toThrow("Milestone not found");
    });

    it("should validate response schema", async () => {
      mockGitlabPut.mockResolvedValue({ invalid: "data" });

      await expect(updateGroupMilestone("mygroup", 3004, { title: "Test" })).rejects.toThrow();
    });
  });

  describe("deleteGroupMilestone", () => {
    it("should delete group milestone successfully", async () => {
      mockGitlabDelete.mockResolvedValue(undefined);

      await deleteGroupMilestone("mygroup", 3004);

      expect(mockGitlabDelete).toHaveBeenCalledWith("/groups/mygroup/milestones/3004");
    });

    it("should validate required parameters", async () => {
      await expect(deleteGroupMilestone("", 3004)).rejects.toThrow("Group ID is required");

      await expect(deleteGroupMilestone("mygroup", 0)).rejects.toThrow("Valid milestone ID is required");
    });

    it("should handle deletion errors", async () => {
      const error = createGitLabError(404, "Milestone not found");
      mockGitlabDelete.mockRejectedValue(error);

      await expect(deleteGroupMilestone("mygroup", 9999)).rejects.toThrow("Milestone not found");
    });

    it("should handle insufficient permissions", async () => {
      const error = createGitLabError(403, "Insufficient permissions to delete milestone");
      mockGitlabDelete.mockRejectedValue(error);

      await expect(deleteGroupMilestone("mygroup", 3004)).rejects.toThrow("Insufficient permissions to delete milestone");
    });

    it("should handle milestones with issues", async () => {
      const error = createGitLabError(400, "Cannot delete milestone with issues");
      mockGitlabDelete.mockRejectedValue(error);

      await expect(deleteGroupMilestone("mygroup", 3004)).rejects.toThrow("Cannot delete milestone with issues");
    });
  });
});
