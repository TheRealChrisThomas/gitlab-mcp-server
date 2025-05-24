import { z } from "zod";
import { gitlabGet, gitlabPost, gitlabPut, gitlabDelete, buildSearchParams } from "../utils/gitlab-client.js";
import type { GitLabGroupMilestoneResponse } from "../types/index.js";
import { GitLabGroupMilestoneSchema } from "../types/index.js";

export async function listGroupMilestones(
  groupId: string,
  options: {
    state?: "active" | "closed";
    title?: string;
    search?: string;
    search_title?: string;
    include_ancestors?: boolean;
    include_descendants?: boolean;
    updated_before?: string;
    updated_after?: string;
    containing_date?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
    per_page?: number;
  } = {}
): Promise<GitLabGroupMilestoneResponse[]> {
  const endpoint = `/groups/${encodeURIComponent(groupId)}/milestones`;
  const params = buildSearchParams(options);

  const milestones = await gitlabGet<GitLabGroupMilestoneResponse[]>(endpoint, params);
  return z.array(GitLabGroupMilestoneSchema).parse(milestones);
}

export async function createGroupMilestone(
  groupId: string,
  title: string,
  description?: string,
  dueDate?: string,
  startDate?: string
): Promise<GitLabGroupMilestoneResponse> {
  const endpoint = `/groups/${encodeURIComponent(groupId)}/milestones`;

  const milestone = await gitlabPost<GitLabGroupMilestoneResponse>(endpoint, {
    title,
    description,
    due_date: dueDate,
    start_date: startDate
  });

  return GitLabGroupMilestoneSchema.parse(milestone);
}

export async function updateGroupMilestone(
  groupId: string,
  milestoneId: number,
  options: {
    title?: string;
    description?: string;
    due_date?: string;
    start_date?: string;
    state_event?: "close" | "activate";
  }
): Promise<GitLabGroupMilestoneResponse> {
  const endpoint = `/groups/${encodeURIComponent(groupId)}/milestones/${milestoneId}`;

  const milestone = await gitlabPut<GitLabGroupMilestoneResponse>(endpoint, options);
  return GitLabGroupMilestoneSchema.parse(milestone);
}

export async function deleteGroupMilestone(groupId: string, milestoneId: number): Promise<void> {
  const endpoint = `/groups/${encodeURIComponent(groupId)}/milestones/${milestoneId}`;
  await gitlabDelete(endpoint);
}
