import { z } from "zod";
import { gitlabGet, gitlabPost, encodeProjectId, buildSearchParams } from "../utils/gitlab-client.js";
import type { GitLabRepository, GitLabSearchResponse, GitLabFork, CreateRepositoryOptions } from "../types/index.js";
import { GitLabRepositorySchema, GitLabSearchResponseSchema, GitLabForkSchema } from "../types/index.js";
import type { CreateRepositoryOptionsSchema } from "../schemas.js";

export async function searchProjects(query: string, page: number = 1, perPage: number = 20): Promise<GitLabSearchResponse> {
  if (!query?.trim()) {
    throw new Error("Search query is required");
  }
  if (page < 1) {
    throw new Error("Page number must be 1 or greater");
  }
  if (perPage < 1 || perPage > 100) {
    throw new Error("Per page must be between 1 and 100");
  }

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
  if (!options?.name?.trim()) {
    throw new Error("Repository name is required");
  }

  const repository = await gitlabPost<GitLabRepository>("/projects", {
    name: options.name,
    description: options.description,
    visibility: options.visibility,
    initialize_with_readme: options.initialize_with_readme
  });

  return GitLabRepositorySchema.parse(repository);
}

export async function forkProject(projectId: string, namespace?: string): Promise<GitLabFork> {
  if (!projectId?.trim()) {
    throw new Error("Project ID is required");
  }

  const endpoint = `/projects/${encodeProjectId(projectId)}/fork`;
  const body = namespace ? { namespace } : undefined;

  const fork = await gitlabPost<GitLabFork>(endpoint, body);
  return GitLabForkSchema.parse(fork);
}
