import { getFileContents, createOrUpdateFile, createCommit } from "../../src/api/files.js";
import { loadFixture, createGitLabError } from "../utils/test-helpers.js";

// Mock the GitLab client
jest.mock("../../src/utils/gitlab-client.js", () => ({
  gitlabGet: jest.fn(),
  gitlabPost: jest.fn(),
  gitlabPut: jest.fn(),
  encodeProjectId: jest.fn((id: string) => encodeURIComponent(id)),
  encodeFilePath: jest.fn((path: string) => encodeURIComponent(path))
}));

import { gitlabGet, gitlabPost, gitlabPut } from "../../src/utils/gitlab-client.js";

const mockGitlabGet = gitlabGet as jest.MockedFunction<typeof gitlabGet>;
const mockGitlabPost = gitlabPost as jest.MockedFunction<typeof gitlabPost>;
const mockGitlabPut = gitlabPut as jest.MockedFunction<typeof gitlabPut>;

describe("Files API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getFileContents", () => {
    it("should fetch and parse file contents successfully", async () => {
      const fixtureData = loadFixture("files/get-file-contents-success.json");
      mockGitlabGet.mockResolvedValue(fixtureData);

      const result = await getFileContents("39430079", "README.md");

      expect(mockGitlabGet).toHaveBeenCalledWith("/projects/39430079/repository/files/README.md?ref=HEAD");
      expect(result).toHaveProperty("file_name", "README.md");
      expect(result).toHaveProperty("file_path", "README.md");
      expect(result).toHaveProperty("size", 1024);
      expect(result).toHaveProperty("encoding", "base64");
      // Content should be decoded from base64
      if (!Array.isArray(result)) {
        expect(result.content).toBe("# MyProject\n\nThis is a sample README file.");
      }
    });

    it("should fetch file contents with specific ref", async () => {
      const fixtureData = loadFixture("files/get-file-contents-success.json");
      mockGitlabGet.mockResolvedValue(fixtureData);

      await getFileContents("39430079", "README.md", "develop");

      expect(mockGitlabGet).toHaveBeenCalledWith("/projects/39430079/repository/files/README.md?ref=develop");
    });

    it("should fetch directory contents successfully", async () => {
      const fixtureData = loadFixture("files/get-directory-contents-success.json");
      mockGitlabGet.mockResolvedValue(fixtureData);

      const result = await getFileContents("39430079", "src");

      expect(Array.isArray(result)).toBe(true);
      if (Array.isArray(result)) {
        expect(result).toHaveLength(3);
        expect(result[0]).toHaveProperty("name", "src");
        expect(result[0]).toHaveProperty("type", "tree");
        expect(result[1]).toHaveProperty("name", "README.md");
        expect(result[1]).toHaveProperty("type", "blob");
      }
    });

    it("should validate required parameters", async () => {
      await expect(getFileContents("", "README.md")).rejects.toThrow("Project ID is required");

      await expect(getFileContents("39430079", "")).rejects.toThrow("File path is required");

      await expect(getFileContents("39430079", "   ")).rejects.toThrow("File path is required");
    });

    it("should handle file not found errors", async () => {
      const error = createGitLabError(404, "File not found");
      mockGitlabGet.mockRejectedValue(error);

      await expect(getFileContents("39430079", "nonexistent.txt")).rejects.toThrow("File not found");
    });

    it("should handle permission errors", async () => {
      const error = createGitLabError(403, "Forbidden");
      mockGitlabGet.mockRejectedValue(error);

      await expect(getFileContents("39430079", "secret.txt")).rejects.toThrow("Forbidden");
    });

    it("should validate response schema", async () => {
      mockGitlabGet.mockResolvedValue({ invalid: "data" });

      await expect(getFileContents("39430079", "README.md")).rejects.toThrow();
    });
  });

  describe("createOrUpdateFile", () => {
    it("should create new file successfully", async () => {
      const fixtureData = loadFixture("files/create-update-file-success.json");

      // Mock getFileContents to throw 404 (file doesn't exist)
      mockGitlabGet.mockRejectedValue(createGitLabError(404, "File not found"));
      mockGitlabPost.mockResolvedValue(fixtureData);

      const result = await createOrUpdateFile(
        "39430079",
        "src/new-file.ts",
        "export const hello = () => console.log('Hello World');",
        "Add new TypeScript file",
        "main"
      );

      expect(mockGitlabPost).toHaveBeenCalledWith("/projects/39430079/repository/files/src%2Fnew-file.ts", {
        branch: "main",
        content: "export const hello = () => console.log('Hello World');",
        commit_message: "Add new TypeScript file"
      });
      expect(result).toHaveProperty("file_path", "src/new-file.ts");
      expect(result).toHaveProperty("branch", "main");
      expect(result).toHaveProperty("commit_id", "abc123def456789");
    });

    it("should update existing file successfully", async () => {
      const getFileFixture = loadFixture("files/get-file-contents-success.json");
      const updateFileFixture = loadFixture("files/create-update-file-success.json");

      // Mock getFileContents to return existing file
      mockGitlabGet.mockResolvedValue(getFileFixture);
      mockGitlabPut.mockResolvedValue(updateFileFixture);

      const result = await createOrUpdateFile(
        "39430079",
        "README.md",
        "# Updated README\n\nThis is an updated README file.",
        "Update README file",
        "main"
      );

      expect(mockGitlabPut).toHaveBeenCalledWith("/projects/39430079/repository/files/README.md", {
        branch: "main",
        content: "# Updated README\n\nThis is an updated README file.",
        commit_message: "Update README file"
      });
      expect(result).toHaveProperty("file_path", "src/new-file.ts");
      expect(result).toHaveProperty("commit_id", "abc123def456789");
    });

    it("should handle file creation with previous path (rename)", async () => {
      const fixtureData = loadFixture("files/create-update-file-success.json");

      mockGitlabGet.mockRejectedValue(createGitLabError(404, "File not found"));
      mockGitlabPost.mockResolvedValue(fixtureData);

      await createOrUpdateFile(
        "39430079",
        "src/renamed-file.ts",
        "export const hello = () => console.log('Hello World');",
        "Rename file",
        "main",
        "src/old-file.ts"
      );

      expect(mockGitlabPost).toHaveBeenCalledWith("/projects/39430079/repository/files/src%2Frenamed-file.ts", {
        branch: "main",
        content: "export const hello = () => console.log('Hello World');",
        commit_message: "Rename file",
        previous_path: "src/old-file.ts"
      });
    });

    it("should validate required parameters", async () => {
      await expect(createOrUpdateFile("", "file.txt", "content", "message", "main")).rejects.toThrow("Project ID is required");

      await expect(createOrUpdateFile("39430079", "", "content", "message", "main")).rejects.toThrow("File path is required");

      await expect(createOrUpdateFile("39430079", "file.txt", "", "message", "main")).rejects.toThrow("File content is required");

      await expect(createOrUpdateFile("39430079", "file.txt", "content", "", "main")).rejects.toThrow(
        "Commit message is required"
      );

      await expect(createOrUpdateFile("39430079", "file.txt", "content", "message", "")).rejects.toThrow("Branch is required");
    });

    it("should handle creation errors", async () => {
      const error = createGitLabError(400, "Invalid file path");
      mockGitlabGet.mockRejectedValue(createGitLabError(404, "File not found"));
      mockGitlabPost.mockRejectedValue(error);

      await expect(createOrUpdateFile("39430079", "invalid/path", "content", "message", "main")).rejects.toThrow(
        "Invalid file path"
      );
    });

    it("should validate response schema", async () => {
      mockGitlabGet.mockRejectedValue(createGitLabError(404, "File not found"));
      mockGitlabPost.mockResolvedValue({ invalid: "data" });

      await expect(createOrUpdateFile("39430079", "file.txt", "content", "message", "main")).rejects.toThrow();
    });
  });

  describe("createCommit", () => {
    it("should create commit with multiple file actions successfully", async () => {
      const fixtureData = loadFixture("files/create-commit-success.json");
      mockGitlabPost.mockResolvedValue(fixtureData);

      const actions = [
        { path: "src/file1.ts", content: "export const file1 = 'content';" },
        { path: "src/file2.ts", content: "export const file2 = 'content';" }
      ];

      const result = await createCommit("39430079", "Add multiple new files", "main", actions);

      expect(mockGitlabPost).toHaveBeenCalledWith("/projects/39430079/repository/commits", {
        branch: "main",
        commit_message: "Add multiple new files",
        actions: [
          {
            action: "create",
            file_path: "src/file1.ts",
            content: "export const file1 = 'content';"
          },
          {
            action: "create",
            file_path: "src/file2.ts",
            content: "export const file2 = 'content';"
          }
        ]
      });
      expect(result).toHaveProperty("id", "abc123def456789");
      expect(result).toHaveProperty("title", "Add multiple new files");
      expect(result).toHaveProperty("author_name", "John Doe");
    });

    it("should validate required parameters", async () => {
      const actions = [{ path: "file.txt", content: "content" }];

      await expect(createCommit("", "message", "main", actions)).rejects.toThrow("Project ID is required");

      await expect(createCommit("39430079", "", "main", actions)).rejects.toThrow("Commit message is required");

      await expect(createCommit("39430079", "message", "", actions)).rejects.toThrow("Branch is required");

      await expect(createCommit("39430079", "message", "main", [])).rejects.toThrow("At least one file action is required");
    });

    it("should handle commit creation errors", async () => {
      const error = createGitLabError(400, "Invalid branch");
      mockGitlabPost.mockRejectedValue(error);

      const actions = [{ path: "file.txt", content: "content" }];

      await expect(createCommit("39430079", "message", "invalid-branch", actions)).rejects.toThrow("Invalid branch");
    });

    it("should validate response schema", async () => {
      mockGitlabPost.mockResolvedValue({ invalid: "data" });

      const actions = [{ path: "file.txt", content: "content" }];

      await expect(createCommit("39430079", "message", "main", actions)).rejects.toThrow();
    });
  });
});
