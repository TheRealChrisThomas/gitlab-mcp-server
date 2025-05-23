#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import fetch from "node-fetch";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  GitLabForkSchema,
  GitLabReferenceSchema,
  GitLabRepositorySchema,
  GitLabIssueSchema,
  GitLabMergeRequestSchema,
  GitLabContentSchema,
  GitLabCreateUpdateFileResponseSchema,
  GitLabSearchResponseSchema,
  GitLabGroupSearchResponseSchema,
  GitLabTreeSchema,
  GitLabCommitSchema,
  CreateRepositoryOptionsSchema,
  CreateIssueOptionsSchema,
  CreateMergeRequestOptionsSchema,
  CreateBranchOptionsSchema,
  CreateOrUpdateFileSchema,
  SearchRepositoriesSchema,
  SearchGroupsSchema,
  CreateRepositorySchema,
  GetFileContentsSchema,
  PushFilesSchema,
  CreateIssueSchema,
  CreateMergeRequestSchema,
  ForkRepositorySchema,
  CreateBranchSchema,
  CreateLabelSchema,
  UpdateLabelSchema,
  DeleteLabelSchema,
  ListLabelsSchema,
  CreateMilestoneSchema,
  UpdateMilestoneSchema,
  DeleteMilestoneSchema,
  ListMilestonesSchema,
  ListGroupMilestonesSchema,
  CreateGroupMilestoneSchema,
  UpdateGroupMilestoneSchema,
  DeleteGroupMilestoneSchema,
  type GitLabFork,
  type GitLabReference,
  type GitLabRepository,
  type GitLabIssue,
  type GitLabMergeRequest,
  type GitLabContent,
  type GitLabCreateUpdateFileResponse,
  type GitLabSearchResponse,
  type GitLabGroupSearchResponse,
  type GitLabTree,
  type GitLabCommit,
  type GitLabLabelResponse,
  type GitLabMilestoneResponse,
  type GitLabGroupMilestoneResponse,
  type FileOperation,
  GitLabLabelSchema,
  GitLabMilestoneSchema,
  GitLabGroupMilestoneSchema,
  GitLabGroupSchema
} from "./schemas.js";

const server = new Server(
  {
    name: "gitlab-mcp-server",
    version: "1.0.0"
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

const GITLAB_PERSONAL_ACCESS_TOKEN = process.env.GITLAB_PERSONAL_ACCESS_TOKEN;
const GITLAB_API_URL = process.env.GITLAB_API_URL || "https://gitlab.com/api/v4";

if (!GITLAB_PERSONAL_ACCESS_TOKEN) {
  console.error("GITLAB_PERSONAL_ACCESS_TOKEN environment variable is not set");
  process.exit(1);
}

async function forkProject(projectId: string, namespace?: string): Promise<GitLabFork> {
  const url = `${GITLAB_API_URL}/projects/${encodeURIComponent(projectId)}/fork`;
  const queryParams = namespace ? `?namespace=${encodeURIComponent(namespace)}` : "";

  const response = await fetch(url + queryParams, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GITLAB_PERSONAL_ACCESS_TOKEN}`,
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`GitLab API error: ${response.statusText}`);
  }

  return GitLabForkSchema.parse(await response.json());
}

async function createBranch(projectId: string, options: z.infer<typeof CreateBranchOptionsSchema>): Promise<GitLabReference> {
  const response = await fetch(`${GITLAB_API_URL}/projects/${encodeURIComponent(projectId)}/repository/branches`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GITLAB_PERSONAL_ACCESS_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      branch: options.name,
      ref: options.ref
    })
  });

  if (!response.ok) {
    throw new Error(`GitLab API error: ${response.statusText}`);
  }

  return GitLabReferenceSchema.parse(await response.json());
}

async function getFileContents(projectId: string, filePath: string, ref?: string): Promise<GitLabContent> {
  const encodedPath = encodeURIComponent(filePath);
  let url = `${GITLAB_API_URL}/projects/${encodeURIComponent(projectId)}/repository/files/${encodedPath}`;
  if (ref) {
    url += `?ref=${encodeURIComponent(ref)}`;
  } else {
    url += "?ref=HEAD";
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${GITLAB_PERSONAL_ACCESS_TOKEN}`
    }
  });

  if (!response.ok) {
    throw new Error(`GitLab API error: ${response.statusText}`);
  }

  const data = GitLabContentSchema.parse(await response.json());

  if (!Array.isArray(data) && data.content) {
    data.content = Buffer.from(data.content, "base64").toString("utf8");
  }

  return data;
}

async function createIssue(projectId: string, options: z.infer<typeof CreateIssueOptionsSchema>): Promise<GitLabIssue> {
  const response = await fetch(`${GITLAB_API_URL}/projects/${encodeURIComponent(projectId)}/issues`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GITLAB_PERSONAL_ACCESS_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      title: options.title,
      description: options.description,
      assignee_ids: options.assignee_ids,
      milestone_id: options.milestone_id,
      labels: options.labels?.join(",")
    })
  });

  if (!response.ok) {
    throw new Error(`GitLab API error: ${response.statusText}`);
  }

  return GitLabIssueSchema.parse(await response.json());
}

async function createMergeRequest(
  projectId: string,
  options: z.infer<typeof CreateMergeRequestOptionsSchema>
): Promise<GitLabMergeRequest> {
  const response = await fetch(`${GITLAB_API_URL}/projects/${encodeURIComponent(projectId)}/merge_requests`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GITLAB_PERSONAL_ACCESS_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      title: options.title,
      description: options.description,
      source_branch: options.source_branch,
      target_branch: options.target_branch,
      allow_collaboration: options.allow_collaboration,
      draft: options.draft
    })
  });

  if (!response.ok) {
    throw new Error(`GitLab API error: ${response.statusText}`);
  }

  return GitLabMergeRequestSchema.parse(await response.json());
}

async function createOrUpdateFile(
  projectId: string,
  filePath: string,
  content: string,
  commitMessage: string,
  branch: string,
  previousPath?: string
): Promise<GitLabCreateUpdateFileResponse> {
  const encodedPath = encodeURIComponent(filePath);
  const url = `${GITLAB_API_URL}/projects/${encodeURIComponent(projectId)}/repository/files/${encodedPath}`;

  const body = {
    branch,
    content,
    commit_message: commitMessage,
    ...(previousPath ? { previous_path: previousPath } : {})
  };

  // Check if file exists
  let method = "POST";
  try {
    await getFileContents(projectId, filePath, branch);
    method = "PUT";
  } catch (error) {
    // File doesn't exist, use POST
  }

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${GITLAB_PERSONAL_ACCESS_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`GitLab API error: ${response.statusText}`);
  }

  return GitLabCreateUpdateFileResponseSchema.parse(await response.json());
}

async function createTree(projectId: string, files: FileOperation[], ref?: string): Promise<GitLabTree> {
  const response = await fetch(`${GITLAB_API_URL}/projects/${encodeURIComponent(projectId)}/repository/tree`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GITLAB_PERSONAL_ACCESS_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      files: files.map((file) => ({
        file_path: file.path,
        content: file.content
      })),
      ...(ref ? { ref } : {})
    })
  });

  if (!response.ok) {
    throw new Error(`GitLab API error: ${response.statusText}`);
  }

  return GitLabTreeSchema.parse(await response.json());
}

async function createCommit(projectId: string, message: string, branch: string, actions: FileOperation[]): Promise<GitLabCommit> {
  const response = await fetch(`${GITLAB_API_URL}/projects/${encodeURIComponent(projectId)}/repository/commits`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GITLAB_PERSONAL_ACCESS_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      branch,
      commit_message: message,
      actions: actions.map((action) => ({
        action: "create",
        file_path: action.path,
        content: action.content
      }))
    })
  });

  if (!response.ok) {
    throw new Error(`GitLab API error: ${response.statusText}`);
  }

  return GitLabCommitSchema.parse(await response.json());
}

async function searchProjects(query: string, page: number = 1, perPage: number = 20): Promise<GitLabSearchResponse> {
  const url = new URL(`${GITLAB_API_URL}/projects`);
  url.searchParams.append("search", query);
  url.searchParams.append("page", page.toString());
  url.searchParams.append("per_page", perPage.toString());

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${GITLAB_PERSONAL_ACCESS_TOKEN}`
    }
  });

  if (!response.ok) {
    throw new Error(`GitLab API error: ${response.statusText}`);
  }

  const projects = await response.json();
  return GitLabSearchResponseSchema.parse({
    count: parseInt(response.headers.get("X-Total") || "0"),
    items: projects
  });
}

async function searchGroups(
  query: string,
  page: number = 1,
  perPage: number = 20,
  owned?: boolean,
  minAccessLevel?: number
): Promise<GitLabGroupSearchResponse> {
  const url = new URL(`${GITLAB_API_URL}/groups`);
  url.searchParams.append("search", query);
  url.searchParams.append("page", page.toString());
  url.searchParams.append("per_page", perPage.toString());

  if (owned !== undefined) {
    url.searchParams.append("owned", owned.toString());
  }

  if (minAccessLevel !== undefined) {
    url.searchParams.append("min_access_level", minAccessLevel.toString());
  }

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${GITLAB_PERSONAL_ACCESS_TOKEN}`
    }
  });

  if (!response.ok) {
    throw new Error(`GitLab API error: ${response.statusText}`);
  }

  const groups = await response.json();
  return GitLabGroupSearchResponseSchema.parse({
    count: parseInt(response.headers.get("X-Total") || "0"),
    items: groups
  });
}

async function createRepository(options: z.infer<typeof CreateRepositoryOptionsSchema>): Promise<GitLabRepository> {
  const response = await fetch(`${GITLAB_API_URL}/projects`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GITLAB_PERSONAL_ACCESS_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name: options.name,
      description: options.description,
      visibility: options.visibility,
      initialize_with_readme: options.initialize_with_readme
    })
  });

  if (!response.ok) {
    throw new Error(`GitLab API error: ${response.statusText}`);
  }

  return GitLabRepositorySchema.parse(await response.json());
}

// Label management functions
async function listLabels(projectId: string, page: number = 1, perPage: number = 20): Promise<GitLabLabelResponse[]> {
  const url = new URL(`${GITLAB_API_URL}/projects/${encodeURIComponent(projectId)}/labels`);
  url.searchParams.append("page", page.toString());
  url.searchParams.append("per_page", perPage.toString());

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${GITLAB_PERSONAL_ACCESS_TOKEN}`
    }
  });

  if (!response.ok) {
    throw new Error(`GitLab API error: ${response.statusText}`);
  }

  return z.array(GitLabLabelSchema).parse(await response.json());
}

async function createLabel(
  projectId: string,
  name: string,
  color: string,
  description?: string,
  priority?: number
): Promise<GitLabLabelResponse> {
  const response = await fetch(`${GITLAB_API_URL}/projects/${encodeURIComponent(projectId)}/labels`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GITLAB_PERSONAL_ACCESS_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name,
      color,
      description,
      priority
    })
  });

  if (!response.ok) {
    throw new Error(`GitLab API error: ${response.statusText}`);
  }

  return GitLabLabelSchema.parse(await response.json());
}

async function updateLabel(
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
  const response = await fetch(`${GITLAB_API_URL}/projects/${encodeURIComponent(projectId)}/labels/${encodedName}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${GITLAB_PERSONAL_ACCESS_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      new_name: options.new_name,
      color: options.color,
      description: options.description,
      priority: options.priority
    })
  });

  if (!response.ok) {
    throw new Error(`GitLab API error: ${response.statusText}`);
  }

  return GitLabLabelSchema.parse(await response.json());
}

async function deleteLabel(projectId: string, name: string): Promise<void> {
  const encodedName = encodeURIComponent(name);
  const response = await fetch(`${GITLAB_API_URL}/projects/${encodeURIComponent(projectId)}/labels/${encodedName}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${GITLAB_PERSONAL_ACCESS_TOKEN}`
    }
  });

  if (!response.ok) {
    throw new Error(`GitLab API error: ${response.statusText}`);
  }
}

// Milestone management functions
async function listMilestones(
  projectId: string,
  state?: "active" | "closed",
  page: number = 1,
  perPage: number = 20
): Promise<GitLabMilestoneResponse[]> {
  const url = new URL(`${GITLAB_API_URL}/projects/${encodeURIComponent(projectId)}/milestones`);

  if (state) {
    url.searchParams.append("state", state);
  }

  url.searchParams.append("page", page.toString());
  url.searchParams.append("per_page", perPage.toString());

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${GITLAB_PERSONAL_ACCESS_TOKEN}`
    }
  });

  if (!response.ok) {
    throw new Error(`GitLab API error: ${response.statusText}`);
  }

  return z.array(GitLabMilestoneSchema).parse(await response.json());
}

async function createMilestone(
  projectId: string,
  title: string,
  description?: string,
  dueDate?: string,
  startDate?: string
): Promise<GitLabMilestoneResponse> {
  const response = await fetch(`${GITLAB_API_URL}/projects/${encodeURIComponent(projectId)}/milestones`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GITLAB_PERSONAL_ACCESS_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      title,
      description,
      due_date: dueDate,
      start_date: startDate
    })
  });

  if (!response.ok) {
    throw new Error(`GitLab API error: ${response.statusText}`);
  }

  return GitLabMilestoneSchema.parse(await response.json());
}

async function updateMilestone(
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
  const response = await fetch(`${GITLAB_API_URL}/projects/${encodeURIComponent(projectId)}/milestones/${milestoneId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${GITLAB_PERSONAL_ACCESS_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(options)
  });

  if (!response.ok) {
    throw new Error(`GitLab API error: ${response.statusText}`);
  }

  return GitLabMilestoneSchema.parse(await response.json());
}

async function deleteMilestone(projectId: string, milestoneId: number): Promise<void> {
  const response = await fetch(`${GITLAB_API_URL}/projects/${encodeURIComponent(projectId)}/milestones/${milestoneId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${GITLAB_PERSONAL_ACCESS_TOKEN}`
    }
  });

  if (!response.ok) {
    throw new Error(`GitLab API error: ${response.statusText}`);
  }
}

// Group milestone management functions
async function listGroupMilestones(
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
  const url = new URL(`${GITLAB_API_URL}/groups/${encodeURIComponent(groupId)}/milestones`);

  // Add query parameters
  Object.entries(options).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.append(key, value.toString());
    }
  });

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${GITLAB_PERSONAL_ACCESS_TOKEN}`
    }
  });

  if (!response.ok) {
    throw new Error(`GitLab API error: ${response.statusText}`);
  }

  return z.array(GitLabGroupMilestoneSchema).parse(await response.json());
}

async function createGroupMilestone(
  groupId: string,
  title: string,
  description?: string,
  dueDate?: string,
  startDate?: string
): Promise<GitLabGroupMilestoneResponse> {
  const response = await fetch(`${GITLAB_API_URL}/groups/${encodeURIComponent(groupId)}/milestones`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GITLAB_PERSONAL_ACCESS_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      title,
      description,
      due_date: dueDate,
      start_date: startDate
    })
  });

  if (!response.ok) {
    throw new Error(`GitLab API error: ${response.statusText}`);
  }

  return GitLabGroupMilestoneSchema.parse(await response.json());
}

async function updateGroupMilestone(
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
  const response = await fetch(`${GITLAB_API_URL}/groups/${encodeURIComponent(groupId)}/milestones/${milestoneId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${GITLAB_PERSONAL_ACCESS_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(options)
  });

  if (!response.ok) {
    throw new Error(`GitLab API error: ${response.statusText}`);
  }

  return GitLabGroupMilestoneSchema.parse(await response.json());
}

async function deleteGroupMilestone(groupId: string, milestoneId: number): Promise<void> {
  const response = await fetch(`${GITLAB_API_URL}/groups/${encodeURIComponent(groupId)}/milestones/${milestoneId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${GITLAB_PERSONAL_ACCESS_TOKEN}`
    }
  });

  if (!response.ok) {
    throw new Error(`GitLab API error: ${response.statusText}`);
  }
}

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "create_or_update_file",
        description: "Create or update a single file in a GitLab project",
        inputSchema: zodToJsonSchema(CreateOrUpdateFileSchema)
      },
      {
        name: "search_repositories",
        description: "Search for GitLab projects",
        inputSchema: zodToJsonSchema(SearchRepositoriesSchema)
      },
      {
        name: "search_groups",
        description: "Search for GitLab groups",
        inputSchema: zodToJsonSchema(SearchGroupsSchema)
      },
      {
        name: "create_repository",
        description: "Create a new GitLab project",
        inputSchema: zodToJsonSchema(CreateRepositorySchema)
      },
      {
        name: "get_file_contents",
        description: "Get the contents of a file or directory from a GitLab project",
        inputSchema: zodToJsonSchema(GetFileContentsSchema)
      },
      {
        name: "push_files",
        description: "Push multiple files to a GitLab project in a single commit",
        inputSchema: zodToJsonSchema(PushFilesSchema)
      },
      {
        name: "create_issue",
        description: "Create a new issue in a GitLab project",
        inputSchema: zodToJsonSchema(CreateIssueSchema)
      },
      {
        name: "create_merge_request",
        description: "Create a new merge request in a GitLab project",
        inputSchema: zodToJsonSchema(CreateMergeRequestSchema)
      },
      {
        name: "fork_repository",
        description: "Fork a GitLab project to your account or specified namespace",
        inputSchema: zodToJsonSchema(ForkRepositorySchema)
      },
      {
        name: "create_branch",
        description: "Create a new branch in a GitLab project",
        inputSchema: zodToJsonSchema(CreateBranchSchema)
      },
      // New tools for labels
      {
        name: "list_labels",
        description: "List all labels in a GitLab project",
        inputSchema: zodToJsonSchema(ListLabelsSchema)
      },
      {
        name: "create_label",
        description: "Create a new label in a GitLab project",
        inputSchema: zodToJsonSchema(CreateLabelSchema)
      },
      {
        name: "update_label",
        description: "Update an existing label in a GitLab project",
        inputSchema: zodToJsonSchema(UpdateLabelSchema)
      },
      {
        name: "delete_label",
        description: "Delete a label from a GitLab project",
        inputSchema: zodToJsonSchema(DeleteLabelSchema)
      },
      // New tools for milestones
      {
        name: "list_milestones",
        description: "List all milestones in a GitLab project",
        inputSchema: zodToJsonSchema(ListMilestonesSchema)
      },
      {
        name: "create_milestone",
        description: "Create a new milestone in a GitLab project",
        inputSchema: zodToJsonSchema(CreateMilestoneSchema)
      },
      {
        name: "update_milestone",
        description: "Update an existing milestone in a GitLab project",
        inputSchema: zodToJsonSchema(UpdateMilestoneSchema)
      },
      {
        name: "delete_milestone",
        description: "Delete a milestone from a GitLab project",
        inputSchema: zodToJsonSchema(DeleteMilestoneSchema)
      },
      // New tools for group milestones
      {
        name: "list_group_milestones",
        description: "List all milestones in a GitLab group",
        inputSchema: zodToJsonSchema(ListGroupMilestonesSchema)
      },
      {
        name: "create_group_milestone",
        description: "Create a new milestone in a GitLab group",
        inputSchema: zodToJsonSchema(CreateGroupMilestoneSchema)
      },
      {
        name: "update_group_milestone",
        description: "Update an existing milestone in a GitLab group",
        inputSchema: zodToJsonSchema(UpdateGroupMilestoneSchema)
      },
      {
        name: "delete_group_milestone",
        description: "Delete a milestone from a GitLab group",
        inputSchema: zodToJsonSchema(DeleteGroupMilestoneSchema)
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    if (!request.params.arguments) {
      throw new Error("Arguments are required");
    }

    switch (request.params.name) {
      case "fork_repository": {
        const args = ForkRepositorySchema.parse(request.params.arguments);
        const fork = await forkProject(args.project_id, args.namespace);
        return { content: [{ type: "text", text: JSON.stringify(fork, null, 2) }] };
      }

      case "create_branch": {
        const args = CreateBranchSchema.parse(request.params.arguments);
        let ref = args.ref;
        if (!ref) {
          ref = "HEAD";
        }

        const branch = await createBranch(args.project_id, {
          name: args.branch,
          ref
        });

        return { content: [{ type: "text", text: JSON.stringify(branch, null, 2) }] };
      }

      case "search_repositories": {
        const args = SearchRepositoriesSchema.parse(request.params.arguments);
        const results = await searchProjects(args.search, args.page, args.per_page);
        return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
      }

      case "search_groups": {
        const args = SearchGroupsSchema.parse(request.params.arguments);
        const results = await searchGroups(args.search, args.page, args.per_page, args.owned, args.min_access_level);
        return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
      }

      case "create_repository": {
        const args = CreateRepositorySchema.parse(request.params.arguments);
        const repository = await createRepository(args);
        return { content: [{ type: "text", text: JSON.stringify(repository, null, 2) }] };
      }

      case "get_file_contents": {
        const args = GetFileContentsSchema.parse(request.params.arguments);
        const contents = await getFileContents(args.project_id, args.file_path, args.ref);
        return { content: [{ type: "text", text: JSON.stringify(contents, null, 2) }] };
      }

      case "create_or_update_file": {
        const args = CreateOrUpdateFileSchema.parse(request.params.arguments);
        const result = await createOrUpdateFile(
          args.project_id,
          args.file_path,
          args.content,
          args.commit_message,
          args.branch,
          args.previous_path
        );
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "push_files": {
        const args = PushFilesSchema.parse(request.params.arguments);
        const result = await createCommit(
          args.project_id,
          args.commit_message,
          args.branch,
          args.files.map((f) => ({ path: f.file_path, content: f.content }))
        );
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "create_issue": {
        const args = CreateIssueSchema.parse(request.params.arguments);
        const { project_id, ...options } = args;
        const issue = await createIssue(project_id, options);
        return { content: [{ type: "text", text: JSON.stringify(issue, null, 2) }] };
      }

      case "create_merge_request": {
        const args = CreateMergeRequestSchema.parse(request.params.arguments);
        const { project_id, ...options } = args;
        const mergeRequest = await createMergeRequest(project_id, options);
        return { content: [{ type: "text", text: JSON.stringify(mergeRequest, null, 2) }] };
      }

      // Label tools
      case "list_labels": {
        const args = ListLabelsSchema.parse(request.params.arguments);
        const labels = await listLabels(args.project_id, args.page, args.per_page);
        return { content: [{ type: "text", text: JSON.stringify(labels, null, 2) }] };
      }

      case "create_label": {
        const args = CreateLabelSchema.parse(request.params.arguments);
        const label = await createLabel(args.project_id, args.name, args.color, args.description, args.priority);
        return { content: [{ type: "text", text: JSON.stringify(label, null, 2) }] };
      }

      case "update_label": {
        const args = UpdateLabelSchema.parse(request.params.arguments);
        const { project_id, name, ...options } = args;
        const label = await updateLabel(project_id, name, options);
        return { content: [{ type: "text", text: JSON.stringify(label, null, 2) }] };
      }

      case "delete_label": {
        const args = DeleteLabelSchema.parse(request.params.arguments);
        await deleteLabel(args.project_id, args.name);
        return { content: [{ type: "text", text: JSON.stringify({ success: true }, null, 2) }] };
      }

      // Milestone tools
      case "list_milestones": {
        const args = ListMilestonesSchema.parse(request.params.arguments);
        const milestones = await listMilestones(args.project_id, args.state, args.page, args.per_page);
        return { content: [{ type: "text", text: JSON.stringify(milestones, null, 2) }] };
      }

      case "create_milestone": {
        const args = CreateMilestoneSchema.parse(request.params.arguments);
        const milestone = await createMilestone(args.project_id, args.title, args.description, args.due_date, args.start_date);
        return { content: [{ type: "text", text: JSON.stringify(milestone, null, 2) }] };
      }

      case "update_milestone": {
        const args = UpdateMilestoneSchema.parse(request.params.arguments);
        const { project_id, milestone_id, ...options } = args;
        const milestone = await updateMilestone(project_id, milestone_id, options);
        return { content: [{ type: "text", text: JSON.stringify(milestone, null, 2) }] };
      }

      case "delete_milestone": {
        const args = DeleteMilestoneSchema.parse(request.params.arguments);
        await deleteMilestone(args.project_id, args.milestone_id);
        return { content: [{ type: "text", text: JSON.stringify({ success: true }, null, 2) }] };
      }

      // Group milestone tools
      case "list_group_milestones": {
        const args = ListGroupMilestonesSchema.parse(request.params.arguments);
        const { group_id, ...options } = args;
        const milestones = await listGroupMilestones(group_id, options);
        return { content: [{ type: "text", text: JSON.stringify(milestones, null, 2) }] };
      }

      case "create_group_milestone": {
        const args = CreateGroupMilestoneSchema.parse(request.params.arguments);
        const milestone = await createGroupMilestone(args.group_id, args.title, args.description, args.due_date, args.start_date);
        return { content: [{ type: "text", text: JSON.stringify(milestone, null, 2) }] };
      }

      case "update_group_milestone": {
        const args = UpdateGroupMilestoneSchema.parse(request.params.arguments);
        const { group_id, milestone_id, ...options } = args;
        const milestone = await updateGroupMilestone(group_id, milestone_id, options);
        return { content: [{ type: "text", text: JSON.stringify(milestone, null, 2) }] };
      }

      case "delete_group_milestone": {
        const args = DeleteGroupMilestoneSchema.parse(request.params.arguments);
        await deleteGroupMilestone(args.group_id, args.milestone_id);
        return { content: [{ type: "text", text: JSON.stringify({ success: true }, null, 2) }] };
      }

      default:
        throw new Error(`Unknown tool: ${request.params.name}`);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid arguments: ${error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")}`);
    }
    throw error;
  }
});

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("GitLab MCP Server running on stdio");
}

runServer().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
