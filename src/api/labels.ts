import { z } from "zod";
import { gitlabGet, gitlabPost, gitlabPut, gitlabDelete, encodeProjectId, buildSearchParams } from "../utils/gitlab-client.js";
import type { GitLabLabelResponse } from "../types/index.js";
import { GitLabLabelSchema } from "../types/index.js";

export async function listLabels(projectId: string, page: number = 1, perPage: number = 20): Promise<GitLabLabelResponse[]> {
  const endpoint = `/projects/${encodeProjectId(projectId)}/labels`;
  const params = buildSearchParams({
    page: page.toString(),
    per_page: perPage.toString()
  });

  const labels = await gitlabGet<GitLabLabelResponse[]>(endpoint, params);
  return z.array(GitLabLabelSchema).parse(labels);
}

export async function createLabel(
  projectId: string,
  name: string,
  color: string,
  description?: string,
  priority?: number
): Promise<GitLabLabelResponse> {
  const endpoint = `/projects/${encodeProjectId(projectId)}/labels`;

  const label = await gitlabPost<GitLabLabelResponse>(endpoint, {
    name,
    color,
    description,
    priority
  });

  return GitLabLabelSchema.parse(label);
}

export async function updateLabel(
  projectId: string,
  name: string,
  options: {
    new_name?: string;
    color?: string;
    description?: string;
    priority?: number;
  }
): Promise<GitLabLabelResponse> {
  const encodedName = encodeURIComponent(name);
  const endpoint = `/projects/${encodeProjectId(projectId)}/labels/${encodedName}`;

  const label = await gitlabPut<GitLabLabelResponse>(endpoint, {
    new_name: options.new_name,
    color: options.color,
    description: options.description,
    priority: options.priority
  });

  return GitLabLabelSchema.parse(label);
}

export async function deleteLabel(projectId: string, name: string): Promise<void> {
  const encodedName = encodeURIComponent(name);
  const endpoint = `/projects/${encodeProjectId(projectId)}/labels/${encodedName}`;

  await gitlabDelete(endpoint);
}
