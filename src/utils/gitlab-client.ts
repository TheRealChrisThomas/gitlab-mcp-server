import fetch from "node-fetch";
import { GITLAB_API_URL, DEFAULT_HEADERS, AUTH_HEADERS } from "./constants.js";

export class GitLabApiError extends Error {
  constructor(message: string, public status?: number, public details?: any) {
    super(`GitLab API error: ${message}`);
    this.name = "GitLabApiError";
  }
}

interface GitLabResponse<T> {
  data: T;
  headers: {
    "x-next-page"?: string;
    "x-prev-page"?: string;
    "x-total"?: string;
    "x-total-pages"?: string;
    "x-per-page"?: string;
    "x-page"?: string;
    link?: string;
  };
}

export async function gitlabGetWithHeaders<T>(endpoint: string, searchParams?: URLSearchParams): Promise<GitLabResponse<T>> {
  const url = new URL(`${GITLAB_API_URL}${endpoint}`);
  if (searchParams) {
    url.search = searchParams.toString();
  }

  const response = await fetch(url.toString(), {
    headers: AUTH_HEADERS
  });

  if (!response.ok) {
    let errorDetails;
    try {
      errorDetails = await response.json();
    } catch {
      // If response body isn't JSON, ignore
    }
    throw new GitLabApiError(response.statusText, response.status, errorDetails);
  }

  const data = (await response.json()) as T;
  const headers = {
    "x-next-page": response.headers.get("x-next-page") || undefined,
    "x-prev-page": response.headers.get("x-prev-page") || undefined,
    "x-total": response.headers.get("x-total") || undefined,
    "x-total-pages": response.headers.get("x-total-pages") || undefined,
    "x-per-page": response.headers.get("x-per-page") || undefined,
    "x-page": response.headers.get("x-page") || undefined,
    link: response.headers.get("link") || undefined
  };

  return { data, headers };
}

export async function gitlabGet<T>(endpoint: string, searchParams?: URLSearchParams): Promise<T> {
  const response = await gitlabGetWithHeaders<T>(endpoint, searchParams);
  return response.data;
}

export async function gitlabPost<T>(endpoint: string, body?: object): Promise<T> {
  const response = await fetch(`${GITLAB_API_URL}${endpoint}`, {
    method: "POST",
    headers: DEFAULT_HEADERS,
    body: body ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    let errorDetails;
    try {
      errorDetails = await response.json();
    } catch {
      // If response body isn't JSON, ignore
    }
    throw new GitLabApiError(response.statusText, response.status, errorDetails);
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
    let errorDetails;
    try {
      errorDetails = await response.json();
    } catch {
      // If response body isn't JSON, ignore
    }
    throw new GitLabApiError(response.statusText, response.status, errorDetails);
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
