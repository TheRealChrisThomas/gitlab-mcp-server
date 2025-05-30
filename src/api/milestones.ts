import { z } from "zod";
import { gitlabGet, gitlabPost, gitlabPut, gitlabDelete, encodeProjectId, buildSearchParams } from "../utils/gitlab-client.js";
import type { GitLabMilestoneResponse } from "../types/index.js";
import { GitLabMilestoneSchema } from "../types/index.js";

export async function listMilestones(
  projectId: string,
  state?: "active" | "closed",
  page: number = 1,
  perPage: number = 20
): Promise<GitLabMilestoneResponse[]> {
  if (!projectId?.trim()) {
    throw new Error("Project ID is required");
  }
  if (page < 1) {
    throw new Error("Page number must be 1 or greater");
  }
  if (perPage < 1 || perPage > 100) {
    throw new Error("Per page must be between 1 and 100");
  }

  const endpoint = `/projects/${encodeProjectId(projectId)}/milestones`;
  const params = buildSearchParams({
    ...(state && { state }),
    page: page.toString(),
    per_page: perPage.toString()
  });

  const milestones = await gitlabGet<GitLabMilestoneResponse[]>(endpoint, params);
  return z.array(GitLabMilestoneSchema).parse(milestones);
}

export async function createMilestone(
  projectId: string,
  title: string,
  description?: string,
  dueDate?: string,
  startDate?: string
): Promise<GitLabMilestoneResponse> {
  if (!projectId?.trim()) {
    throw new Error("Project ID is required");
  }
  if (!title?.trim()) {
    throw new Error("Milestone title is required");
  }

  const endpoint = `/projects/${encodeProjectId(projectId)}/milestones`;

  const milestone = await gitlabPost<GitLabMilestoneResponse>(endpoint, {
    title,
    description,
    due_date: dueDate,
    start_date: startDate
  });

  return GitLabMilestoneSchema.parse(milestone);
}

export async function updateMilestone(
  projectId: string,
  milestoneId: number,
  options: {
    title?: string;
    description?: string;
    due_date?: string;
    start_date?: string;
    state_event?: "close" | "activate";
  }
): Promise<GitLabMilestoneResponse> {
  if (!projectId?.trim()) {
    throw new Error("Project ID is required");
  }
  if (!milestoneId || milestoneId < 1) {
    throw new Error("Valid milestone ID is required");
  }

  const endpoint = `/projects/${encodeProjectId(projectId)}/milestones/${milestoneId}`;

  const milestone = await gitlabPut<GitLabMilestoneResponse>(endpoint, options);
  return GitLabMilestoneSchema.parse(milestone);
}

export async function deleteMilestone(projectId: string, milestoneId: number): Promise<void> {
  if (!projectId?.trim()) {
    throw new Error("Project ID is required");
  }
  if (!milestoneId || milestoneId < 1) {
    throw new Error("Valid milestone ID is required");
  }

  const endpoint = `/projects/${encodeProjectId(projectId)}/milestones/${milestoneId}`;
  await gitlabDelete(endpoint);
}
