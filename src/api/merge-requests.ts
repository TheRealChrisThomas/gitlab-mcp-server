import { z } from "zod";
import { gitlabGet, gitlabPost, gitlabPut, encodeProjectId, buildSearchParams } from "../utils/gitlab-client.js";
import type { GitLabMergeRequest, GitLabComment, CreateMergeRequestOptions } from "../types/index.js";
import { GitLabMergeRequestSchema, GitLabCommentSchema } from "../types/index.js";

export async function listMergeRequests(
  projectId: string,
  options: {
    state?: "opened" | "closed" | "locked" | "merged" | "all";
    target_branch?: string;
    source_branch?: string;
    labels?: string;
    milestone?: string;
    assignee_id?: number;
    author_id?: number;
    search?: string;
    created_after?: string;
    created_before?: string;
    updated_after?: string;
    updated_before?: string;
    sort?: "created_at" | "updated_at" | "title";
    order_by?: "asc" | "desc";
    page?: number;
    per_page?: number;
  } = {}
): Promise<GitLabMergeRequest[]> {
  const endpoint = `/projects/${encodeProjectId(projectId)}/merge_requests`;
  const params = buildSearchParams(options);

  const mergeRequests = await gitlabGet<GitLabMergeRequest[]>(endpoint, params);
  return z.array(GitLabMergeRequestSchema).parse(mergeRequests);
}

export async function createMergeRequest(projectId: string, options: CreateMergeRequestOptions): Promise<GitLabMergeRequest> {
  const endpoint = `/projects/${encodeProjectId(projectId)}/merge_requests`;

  const mergeRequest = await gitlabPost<GitLabMergeRequest>(endpoint, {
    title: options.title,
    description: options.description,
    source_branch: options.source_branch,
    target_branch: options.target_branch,
    allow_collaboration: options.allow_collaboration,
    draft: options.draft
  });

  return GitLabMergeRequestSchema.parse(mergeRequest);
}

export async function updateMergeRequest(
  projectId: string,
  mergeRequestIid: number,
  options: {
    title?: string;
    description?: string;
    state_event?: "close" | "reopen";
    target_branch?: string;
    labels?: string[];
    assignee_ids?: number[];
    milestone_id?: number;
    remove_source_branch?: boolean;
  }
): Promise<GitLabMergeRequest> {
  const endpoint = `/projects/${encodeProjectId(projectId)}/merge_requests/${mergeRequestIid}`;

  const mergeRequest = await gitlabPut<GitLabMergeRequest>(endpoint, {
    ...options,
    labels: options.labels?.join(",")
  });

  return GitLabMergeRequestSchema.parse(mergeRequest);
}

export async function mergeMergeRequest(
  projectId: string,
  mergeRequestIid: number,
  options: {
    merge_commit_message?: string;
    should_remove_source_branch?: boolean;
    merge_when_pipeline_succeeds?: boolean;
    sha?: string;
  } = {}
): Promise<GitLabMergeRequest> {
  const endpoint = `/projects/${encodeProjectId(projectId)}/merge_requests/${mergeRequestIid}/merge`;

  const mergeRequest = await gitlabPut<GitLabMergeRequest>(endpoint, options);
  return GitLabMergeRequestSchema.parse(mergeRequest);
}

export async function addMergeRequestComment(projectId: string, mergeRequestIid: number, body: string): Promise<GitLabComment> {
  const endpoint = `/projects/${encodeProjectId(projectId)}/merge_requests/${mergeRequestIid}/notes`;

  const comment = await gitlabPost<GitLabComment>(endpoint, { body });
  return GitLabCommentSchema.parse(comment);
}
