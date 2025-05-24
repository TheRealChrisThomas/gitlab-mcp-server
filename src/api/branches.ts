import { gitlabPost, encodeProjectId } from "../utils/gitlab-client.js";
import type { GitLabReference, CreateBranchOptions } from "../types/index.js";
import { GitLabReferenceSchema } from "../types/index.js";

export async function createBranch(projectId: string, options: CreateBranchOptions): Promise<GitLabReference> {
  const endpoint = `/projects/${encodeProjectId(projectId)}/repository/branches`;

  const branch = await gitlabPost<GitLabReference>(endpoint, {
    branch: options.name,
    ref: options.ref
  });

  return GitLabReferenceSchema.parse(branch);
}
