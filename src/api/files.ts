import { gitlabGet, gitlabPost, gitlabPut, encodeProjectId, encodeFilePath } from "../utils/gitlab-client.js";
import type { GitLabContent, GitLabCreateUpdateFileResponse, GitLabCommit, FileOperation } from "../types/index.js";
import { GitLabContentSchema, GitLabCreateUpdateFileResponseSchema, GitLabCommitSchema } from "../types/index.js";

export async function getFileContents(projectId: string, filePath: string, ref?: string): Promise<GitLabContent> {
  const encodedPath = encodeFilePath(filePath);
  const endpoint = `/projects/${encodeProjectId(projectId)}/repository/files/${encodedPath}`;
  const refParam = ref || "HEAD";

  const data = await gitlabGet<GitLabContent>(`${endpoint}?ref=${encodeURIComponent(refParam)}`);
  const parsedData = GitLabContentSchema.parse(data);

  // Decode base64 content if it's a file
  if (!Array.isArray(parsedData) && parsedData.content) {
    parsedData.content = Buffer.from(parsedData.content, "base64").toString("utf8");
  }

  return parsedData;
}

export async function createOrUpdateFile(
  projectId: string,
  filePath: string,
  content: string,
  commitMessage: string,
  branch: string,
  previousPath?: string
): Promise<GitLabCreateUpdateFileResponse> {
  const encodedPath = encodeFilePath(filePath);
  const endpoint = `/projects/${encodeProjectId(projectId)}/repository/files/${encodedPath}`;

  const body = {
    branch,
    content,
    commit_message: commitMessage,
    ...(previousPath ? { previous_path: previousPath } : {})
  };

  // Check if file exists to determine method
  let method: "POST" | "PUT" = "POST";
  try {
    await getFileContents(projectId, filePath, branch);
    method = "PUT";
  } catch (error) {
    // File doesn't exist, use POST
  }

  const response =
    method === "POST"
      ? await gitlabPost<GitLabCreateUpdateFileResponse>(endpoint, body)
      : await gitlabPut<GitLabCreateUpdateFileResponse>(endpoint, body);

  return GitLabCreateUpdateFileResponseSchema.parse(response);
}

export async function createCommit(
  projectId: string,
  message: string,
  branch: string,
  actions: FileOperation[]
): Promise<GitLabCommit> {
  const endpoint = `/projects/${encodeProjectId(projectId)}/repository/commits`;

  const commit = await gitlabPost<GitLabCommit>(endpoint, {
    branch,
    commit_message: message,
    actions: actions.map((action) => ({
      action: "create",
      file_path: action.path,
      content: action.content
    }))
  });

  return GitLabCommitSchema.parse(commit);
}
