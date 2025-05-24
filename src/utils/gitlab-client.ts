import fetch from "node-fetch";
import { GITLAB_API_URL, DEFAULT_HEADERS, AUTH_HEADERS } from "./constants.js";

export class GitLabApiError extends Error {
  constructor(message: string, public status?: number) {
    super(`GitLab API error: ${message}`);
    this.name = "GitLabApiError";
  }
}

export async function gitlabGet<T>(endpoint: string, searchParams?: URLSearchParams): Promise<T> {
  const url = new URL(`${GITLAB_API_URL}${endpoint}`);
  if (searchParams) {
    url.search = searchParams.toString();
  }

  const response = await fetch(url.toString(), {
    headers: AUTH_HEADERS
  });

  if (!response.ok) {
    throw new GitLabApiError(response.statusText, response.status);
  }

  return (await response.json()) as T;
}

export async function gitlabPost<T>(endpoint: string, body?: object): Promise<T> {
  const response = await fetch(`${GITLAB_API_URL}${endpoint}`, {
    method: "POST",
    headers: DEFAULT_HEADERS,
    body: body ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    throw new GitLabApiError(response.statusText, response.status);
  }

  return (await response.json()) as T;
}

export async function gitlabPut<T>(endpoint: string, body?: object): Promise<T> {
  const response = await fetch(`${GITLAB_API_URL}${endpoint}`, {
    method: "PUT",
    headers: DEFAULT_HEADERS,
    body: body ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    throw new GitLabApiError(response.statusText, response.status);
  }

  return (await response.json()) as T;
}

export async function gitlabDelete(endpoint: string): Promise<void> {
  const response = await fetch(`${GITLAB_API_URL}${endpoint}`, {
    method: "DELETE",
    headers: AUTH_HEADERS
  });

  if (!response.ok) {
    throw new GitLabApiError(response.statusText, response.status);
  }
}

export function encodeProjectId(projectId: string): string {
  return encodeURIComponent(projectId);
}

export function encodeFilePath(filePath: string): string {
  return encodeURIComponent(filePath);
}

export function buildSearchParams(options: Record<string, any>): URLSearchParams {
  const params = new URLSearchParams();

  Object.entries(options).forEach(([key, value]) => {
    if (value !== undefined) {
      params.append(key, value.toString());
    }
  });

  return params;
}
