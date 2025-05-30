import { z } from "zod";
import { gitlabGet, gitlabPost, gitlabPut, encodeProjectId, buildSearchParams } from "../utils/gitlab-client.js";
import type { GitLabIssue, GitLabComment, CreateIssueOptions } from "../types/index.js";
import { GitLabIssueSchema, GitLabCommentSchema } from "../types/index.js";

export async function listIssues(
  projectId: string,
  options: {
    state?: "opened" | "closed" | "all";
    labels?: string;
    milestone?: string;
    assignee_id?: number;
    author_id?: number;
    search?: string;
    created_after?: string;
    created_before?: string;
    updated_after?: string;
    updated_before?: string;
    sort?: string;
    order_by?: "asc" | "desc";
    page?: number;
    per_page?: number;
    with_labels_details?: boolean;
  } = {}
): Promise<GitLabIssue[]> {
  if (!projectId?.trim()) {
    throw new Error("Project ID is required");
  }

  const endpoint = `/projects/${encodeProjectId(projectId)}/issues`;
  const params = buildSearchParams(options);

  const issues = await gitlabGet<GitLabIssue[]>(endpoint, params);
  return z.array(GitLabIssueSchema).parse(issues);
}

export async function createIssue(projectId: string, options: CreateIssueOptions): Promise<GitLabIssue> {
  if (!projectId?.trim()) {
    throw new Error("Project ID is required");
  }
  if (!options?.title?.trim()) {
    throw new Error("Issue title is required");
  }

  const endpoint = `/projects/${encodeProjectId(projectId)}/issues`;

  const issue = await gitlabPost<GitLabIssue>(endpoint, {
    title: options.title,
    description: options.description,
    assignee_ids: options.assignee_ids,
    milestone_id: options.milestone_id,
    labels: options.labels?.join(",")
  });

  return GitLabIssueSchema.parse(issue);
}

export async function updateIssue(
  projectId: string,
  issueIid: number,
  options: {
    title?: string;
    description?: string;
    state_event?: "close" | "reopen";
    labels?: string[];
    assignee_ids?: number[];
    milestone_id?: number;
  }
): Promise<GitLabIssue> {
  if (!projectId?.trim()) {
    throw new Error("Project ID is required");
  }
  if (!issueIid || issueIid < 1) {
    throw new Error("Valid issue IID is required");
  }

  const endpoint = `/projects/${encodeProjectId(projectId)}/issues/${issueIid}`;

  const issue = await gitlabPut<GitLabIssue>(endpoint, {
    ...options,
    labels: options.labels?.join(",")
  });

  return GitLabIssueSchema.parse(issue);
}

export async function searchIssues(
  projectId: string,
  searchTerm: string,
  options: {
    state?: "opened" | "closed" | "all";
    labels?: string;
    page?: number;
    per_page?: number;
  } = {}
): Promise<GitLabIssue[]> {
  if (!searchTerm?.trim()) {
    throw new Error("Search term is required");
  }

  return listIssues(projectId, {
    search: searchTerm,
    ...options
  });
}

export async function addIssueComment(projectId: string, issueIid: number, body: string): Promise<GitLabComment> {
  if (!projectId?.trim()) {
    throw new Error("Project ID is required");
  }
  if (!issueIid || issueIid < 1) {
    throw new Error("Valid issue IID is required");
  }
  if (!body?.trim()) {
    throw new Error("Comment body is required");
  }

  const endpoint = `/projects/${encodeProjectId(projectId)}/issues/${issueIid}/notes`;

  const comment = await gitlabPost<GitLabComment>(endpoint, { body });
  return GitLabCommentSchema.parse(comment);
}
