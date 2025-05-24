import { gitlabGet, buildSearchParams } from "../utils/gitlab-client.js";
import type { GitLabGroupSearchResponse } from "../types/index.js";
import { GitLabGroupSearchResponseSchema } from "../types/index.js";

export async function searchGroups(
  query: string,
  page: number = 1,
  perPage: number = 20,
  owned?: boolean,
  minAccessLevel?: number
): Promise<GitLabGroupSearchResponse> {
  const params = buildSearchParams({
    search: query,
    page: page.toString(),
    per_page: perPage.toString(),
    ...(owned !== undefined && { owned: owned.toString() }),
    ...(minAccessLevel !== undefined && { min_access_level: minAccessLevel.toString() })
  });

  const groups = await gitlabGet<any[]>("/groups", params);

  return GitLabGroupSearchResponseSchema.parse({
    count: groups.length,
    items: groups
  });
}
