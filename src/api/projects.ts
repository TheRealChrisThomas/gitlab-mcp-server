import { z } from "zod";
import { gitlabGet, gitlabPost, encodeProjectId, buildSearchParams } from "../utils/gitlab-client.js";
import type { GitLabRepository, GitLabSearchResponse, GitLabFork, CreateRepositoryOptions } from "../types/index.js";
import { GitLabRepositorySchema, GitLabSearchResponseSchema, GitLabForkSchema } from "../types/index.js";
import type { CreateRepositoryOptionsSchema } from "../schemas.js";

export async function searchProjects(query: string, page: number = 1, perPage: number = 20): Promise<GitLabSearchResponse> {
  const params = buildSearchParams({
    search: query,
    page: page.toString(),
    per_page: perPage.toString()
  });

  const projects = await gitlabGet<GitLabRepository[]>("/projects", params);

  return GitLabSearchResponseSchema.parse({
    count: projects.length, // GitLab doesn't always provide total in headers
    items: projects
  });
}

export async function createRepository(options: CreateRepositoryOptions): Promise<GitLabRepository> {
  const repository = await gitlabPost<GitLabRepository>("/projects", {
    name: options.name,
    description: options.description,
    visibility: options.visibility,
    initialize_with_readme: options.initialize_with_readme
  });

  return GitLabRepositorySchema.parse(repository);
}

export async function forkProject(projectId: string, namespace?: string): Promise<GitLabFork> {
  const endpoint = `/projects/${encodeProjectId(projectId)}/fork`;
  const body = namespace ? { namespace } : undefined;

  const fork = await gitlabPost<GitLabFork>(endpoint, body);
  return GitLabForkSchema.parse(fork);
}
