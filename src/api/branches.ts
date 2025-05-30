import { gitlabPost, encodeProjectId } from "../utils/gitlab-client.js";
import type { GitLabReference, CreateBranchOptions } from "../types/index.js";
import { GitLabReferenceSchema } from "../types/index.js";

export async function createBranch(projectId: string, options: CreateBranchOptions): Promise<GitLabReference> {
  if (!projectId?.trim()) {
    throw new Error("Project ID is required");
  }
  if (!options.name?.trim()) {
    throw new Error("Branch name is required");
  }
  if (!options.ref?.trim()) {
    throw new Error("Source reference is required");
  }

  const endpoint = `/projects/${encodeProjectId(projectId)}/repository/branches`;

  const branch = await gitlabPost<GitLabReference>(endpoint, {
    branch: options.name,
    ref: options.ref
  });

  return GitLabReferenceSchema.parse(branch);
}
