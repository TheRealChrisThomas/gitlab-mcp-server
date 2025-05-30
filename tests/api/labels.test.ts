import { listLabels, createLabel, updateLabel, deleteLabel } from "../../src/api/labels.js";
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

describe("Labels API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("listLabels", () => {
    it("should fetch and parse labels successfully", async () => {
      const fixtureData = loadFixture("labels/list-labels-success.json");
      mockGitlabGet.mockResolvedValue(fixtureData);

      const result = await listLabels("39430079");

      expect(mockGitlabGet).toHaveBeenCalledWith("/projects/39430079/labels", expect.any(URLSearchParams));
      expect(result).toHaveLength(3);
      expect(result[0]).toHaveProperty("id", 1001);
      expect(result[0]).toHaveProperty("name", "bug");
      expect(result[0]).toHaveProperty("color", "#d73a4a");
      expect(result[0]).toHaveProperty("description", "Something isn't working");
      expect(result[1]).toHaveProperty("name", "enhancement");
      expect(result[2]).toHaveProperty("name", "documentation");
    });

    it("should handle pagination parameters", async () => {
      const fixtureData = loadFixture("labels/list-labels-success.json");
      mockGitlabGet.mockResolvedValue(fixtureData);

      await listLabels("39430079", 2, 50);

      expect(mockGitlabGet).toHaveBeenCalledWith("/projects/39430079/labels", expect.any(URLSearchParams));
    });

    it("should handle empty results", async () => {
      mockGitlabGet.mockResolvedValue([]);

      const result = await listLabels("39430079");

      expect(result).toEqual([]);
    });

    it("should validate project ID input", async () => {
      await expect(listLabels("")).rejects.toThrow("Project ID is required");
      await expect(listLabels("   ")).rejects.toThrow("Project ID is required");
    });

    it("should validate pagination parameters", async () => {
      await expect(listLabels("39430079", 0)).rejects.toThrow("Page number must be 1 or greater");
      await expect(listLabels("39430079", 1, 0)).rejects.toThrow("Per page must be between 1 and 100");
      await expect(listLabels("39430079", 1, 101)).rejects.toThrow("Per page must be between 1 and 100");
    });

    it("should handle GitLab API errors", async () => {
      const error = createGitLabError(403, "Forbidden");
      mockGitlabGet.mockRejectedValue(error);

      await expect(listLabels("39430079")).rejects.toThrow("Forbidden");
    });

    it("should validate response schema", async () => {
      mockGitlabGet.mockResolvedValue([{ invalid: "data" }]);

      await expect(listLabels("39430079")).rejects.toThrow();
    });
  });

  describe("createLabel", () => {
    it("should create label with required fields", async () => {
      const fixtureData = loadFixture("labels/create-label-success.json");
      mockGitlabPost.mockResolvedValue(fixtureData);

      const result = await createLabel("39430079", "high-priority", "#ff4444");

      expect(mockGitlabPost).toHaveBeenCalledWith("/projects/39430079/labels", {
        name: "high-priority",
        color: "#ff4444",
        description: undefined,
        priority: undefined
      });
      expect(result).toHaveProperty("id", 1004);
      expect(result).toHaveProperty("name", "high-priority");
      expect(result).toHaveProperty("color", "#ff4444");
    });

    it("should create label with all optional fields", async () => {
      const fixtureData = loadFixture("labels/create-label-success.json");
      mockGitlabPost.mockResolvedValue(fixtureData);

      await createLabel("39430079", "high-priority", "#ff4444", "High priority issues", 1);

      expect(mockGitlabPost).toHaveBeenCalledWith("/projects/39430079/labels", {
        name: "high-priority",
        color: "#ff4444",
        description: "High priority issues",
        priority: 1
      });
    });

    it("should validate required fields", async () => {
      await expect(createLabel("", "test", "#ff0000")).rejects.toThrow("Project ID is required");

      await expect(createLabel("39430079", "", "#ff0000")).rejects.toThrow("Label name is required");

      await expect(createLabel("39430079", "test", "")).rejects.toThrow("Label color is required");
    });

    it("should validate color format", async () => {
      await expect(createLabel("39430079", "test", "red")).rejects.toThrow(
        "Label color must be a valid hex color (e.g., #ff0000)"
      );

      await expect(createLabel("39430079", "test", "#gg0000")).rejects.toThrow(
        "Label color must be a valid hex color (e.g., #ff0000)"
      );

      await expect(createLabel("39430079", "test", "#ff00")).rejects.toThrow(
        "Label color must be a valid hex color (e.g., #ff0000)"
      );
    });

    it("should handle creation errors", async () => {
      const error = createGitLabError(400, "Label name has already been taken");
      mockGitlabPost.mockRejectedValue(error);

      await expect(createLabel("39430079", "existing-label", "#ff0000")).rejects.toThrow("Label name has already been taken");
    });

    it("should validate response schema", async () => {
      mockGitlabPost.mockResolvedValue({ invalid: "label data" });

      await expect(createLabel("39430079", "test", "#ff0000")).rejects.toThrow();
    });
  });

  describe("updateLabel", () => {
    it("should update label successfully", async () => {
      const fixtureData = loadFixture("labels/create-label-success.json");
      const updatedData = { ...fixtureData, name: "critical-priority", color: "#cc0000" };
      mockGitlabPut.mockResolvedValue(updatedData);

      const result = await updateLabel("39430079", "high-priority", {
        new_name: "critical-priority",
        color: "#cc0000"
      });

      expect(mockGitlabPut).toHaveBeenCalledWith("/projects/39430079/labels/high-priority", {
        new_name: "critical-priority",
        color: "#cc0000",
        description: undefined,
        priority: undefined
      });
      expect(result).toHaveProperty("name", "critical-priority");
      expect(result).toHaveProperty("color", "#cc0000");
    });

    it("should update label with all options", async () => {
      const fixtureData = loadFixture("labels/create-label-success.json");
      mockGitlabPut.mockResolvedValue(fixtureData);

      await updateLabel("39430079", "high-priority", {
        new_name: "urgent",
        color: "#ff0000",
        description: "Urgent issues requiring immediate attention",
        priority: 0
      });

      expect(mockGitlabPut).toHaveBeenCalledWith("/projects/39430079/labels/high-priority", {
        new_name: "urgent",
        color: "#ff0000",
        description: "Urgent issues requiring immediate attention",
        priority: 0
      });
    });

    it("should validate required parameters", async () => {
      await expect(updateLabel("", "test", { new_name: "updated" })).rejects.toThrow("Project ID is required");

      await expect(updateLabel("39430079", "", { new_name: "updated" })).rejects.toThrow("Label name is required");
    });

    it("should validate color format in updates", async () => {
      await expect(updateLabel("39430079", "test", { color: "invalid" })).rejects.toThrow(
        "Label color must be a valid hex color (e.g., #ff0000)"
      );
    });

    it("should handle update errors", async () => {
      const error = createGitLabError(404, "Label not found");
      mockGitlabPut.mockRejectedValue(error);

      await expect(updateLabel("39430079", "nonexistent", { new_name: "test" })).rejects.toThrow("Label not found");
    });
  });

  describe("deleteLabel", () => {
    it("should delete label successfully", async () => {
      mockGitlabDelete.mockResolvedValue(undefined);

      await deleteLabel("39430079", "high-priority");

      expect(mockGitlabDelete).toHaveBeenCalledWith("/projects/39430079/labels/high-priority");
    });

    it("should handle labels with special characters", async () => {
      mockGitlabDelete.mockResolvedValue(undefined);

      await deleteLabel("39430079", "bug/critical");

      expect(mockGitlabDelete).toHaveBeenCalledWith("/projects/39430079/labels/bug%2Fcritical");
    });

    it("should validate required parameters", async () => {
      await expect(deleteLabel("", "test")).rejects.toThrow("Project ID is required");

      await expect(deleteLabel("39430079", "")).rejects.toThrow("Label name is required");
    });

    it("should handle deletion errors", async () => {
      const error = createGitLabError(404, "Label not found");
      mockGitlabDelete.mockRejectedValue(error);

      await expect(deleteLabel("39430079", "nonexistent")).rejects.toThrow("Label not found");
    });

    it("should handle insufficient permissions", async () => {
      const error = createGitLabError(403, "Insufficient permissions to delete label");
      mockGitlabDelete.mockRejectedValue(error);

      await expect(deleteLabel("39430079", "test")).rejects.toThrow("Insufficient permissions to delete label");
    });
  });
});
