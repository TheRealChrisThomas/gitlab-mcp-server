import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { zodToJsonSchema } from "zod-to-json-schema";
import { z } from "zod";

// Import all API functions
import * as api from "./api/index.js";

// Import schema definitions for request validation
import {
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
  ListIssuesSchema,
  UpdateIssueSchema,
  SearchIssuesSchema,
  AddIssueCommentSchema,
  ListMergeRequestsSchema,
  UpdateMergeRequestSchema,
  MergeMergeRequestSchema,
  AddMergeRequestCommentSchema
} from "./schemas.js";

const server = new Server(
  {
    name: "gitlab-mcp-server",
    version: "1.2.0"
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

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
      },
      {
        name: "list_issues",
        description: "List all issues in a GitLab project",
        inputSchema: zodToJsonSchema(ListIssuesSchema)
      },
      {
        name: "update_issue",
        description: "Update an existing issue in a GitLab project",
        inputSchema: zodToJsonSchema(UpdateIssueSchema)
      },
      {
        name: "search_issues",
        description: "Search for issues in a GitLab project",
        inputSchema: zodToJsonSchema(SearchIssuesSchema)
      },
      {
        name: "add_issue_comment",
        description: "Add a comment to an issue in a GitLab project",
        inputSchema: zodToJsonSchema(AddIssueCommentSchema)
      },
      {
        name: "list_merge_requests",
        description: "List all merge requests in a GitLab project",
        inputSchema: zodToJsonSchema(ListMergeRequestsSchema)
      },
      {
        name: "update_merge_request",
        description: "Update an existing merge request in a GitLab project",
        inputSchema: zodToJsonSchema(UpdateMergeRequestSchema)
      },
      {
        name: "merge_merge_request",
        description: "Merge a merge request in a GitLab project",
        inputSchema: zodToJsonSchema(MergeMergeRequestSchema)
      },
      {
        name: "add_merge_request_comment",
        description: "Add a comment to a merge request in a GitLab project",
        inputSchema: zodToJsonSchema(AddMergeRequestCommentSchema)
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
        const fork = await api.forkProject(args.project_id, args.namespace);
        return { content: [{ type: "text", text: JSON.stringify(fork, null, 2) }] };
      }

      case "create_branch": {
        const args = CreateBranchSchema.parse(request.params.arguments);
        const ref = args.ref || "HEAD";
        const branch = await api.createBranch(args.project_id, {
          name: args.branch,
          ref
        });
        return { content: [{ type: "text", text: JSON.stringify(branch, null, 2) }] };
      }

      case "search_repositories": {
        const args = SearchRepositoriesSchema.parse(request.params.arguments);
        const results = await api.searchProjects(args.search, args.page, args.per_page);
        return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
      }

      case "search_groups": {
        const args = SearchGroupsSchema.parse(request.params.arguments);
        const results = await api.searchGroups(args.search, args.page, args.per_page, args.owned, args.min_access_level);
        return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
      }

      case "create_repository": {
        const args = CreateRepositorySchema.parse(request.params.arguments);
        const repository = await api.createRepository(args);
        return { content: [{ type: "text", text: JSON.stringify(repository, null, 2) }] };
      }

      case "get_file_contents": {
        const args = GetFileContentsSchema.parse(request.params.arguments);
        const contents = await api.getFileContents(args.project_id, args.file_path, args.ref);
        return { content: [{ type: "text", text: JSON.stringify(contents, null, 2) }] };
      }

      case "create_or_update_file": {
        const args = CreateOrUpdateFileSchema.parse(request.params.arguments);
        const result = await api.createOrUpdateFile(
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
        const result = await api.createCommit(
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
        const issue = await api.createIssue(project_id, options);
        return { content: [{ type: "text", text: JSON.stringify(issue, null, 2) }] };
      }

      case "create_merge_request": {
        const args = CreateMergeRequestSchema.parse(request.params.arguments);
        const { project_id, ...options } = args;
        const mergeRequest = await api.createMergeRequest(project_id, options);
        return { content: [{ type: "text", text: JSON.stringify(mergeRequest, null, 2) }] };
      }

      // Label tools
      case "list_labels": {
        const args = ListLabelsSchema.parse(request.params.arguments);
        const labels = await api.listLabels(args.project_id, args.page, args.per_page);
        return { content: [{ type: "text", text: JSON.stringify(labels, null, 2) }] };
      }

      case "create_label": {
        const args = CreateLabelSchema.parse(request.params.arguments);
        const label = await api.createLabel(args.project_id, args.name, args.color, args.description, args.priority);
        return { content: [{ type: "text", text: JSON.stringify(label, null, 2) }] };
      }

      case "update_label": {
        const args = UpdateLabelSchema.parse(request.params.arguments);
        const { project_id, name, ...options } = args;
        const label = await api.updateLabel(project_id, name, options);
        return { content: [{ type: "text", text: JSON.stringify(label, null, 2) }] };
      }

      case "delete_label": {
        const args = DeleteLabelSchema.parse(request.params.arguments);
        await api.deleteLabel(args.project_id, args.name);
        return { content: [{ type: "text", text: JSON.stringify({ success: true }, null, 2) }] };
      }

      // Milestone tools
      case "list_milestones": {
        const args = ListMilestonesSchema.parse(request.params.arguments);
        const milestones = await api.listMilestones(args.project_id, args.state, args.page, args.per_page);
        return { content: [{ type: "text", text: JSON.stringify(milestones, null, 2) }] };
      }

      case "create_milestone": {
        const args = CreateMilestoneSchema.parse(request.params.arguments);
        const milestone = await api.createMilestone(
          args.project_id,
          args.title,
          args.description,
          args.due_date,
          args.start_date
        );
        return { content: [{ type: "text", text: JSON.stringify(milestone, null, 2) }] };
      }

      case "update_milestone": {
        const args = UpdateMilestoneSchema.parse(request.params.arguments);
        const { project_id, milestone_id, ...options } = args;
        const milestone = await api.updateMilestone(project_id, milestone_id, options);
        return { content: [{ type: "text", text: JSON.stringify(milestone, null, 2) }] };
      }

      case "delete_milestone": {
        const args = DeleteMilestoneSchema.parse(request.params.arguments);
        await api.deleteMilestone(args.project_id, args.milestone_id);
        return { content: [{ type: "text", text: JSON.stringify({ success: true }, null, 2) }] };
      }

      // Group milestone tools
      case "list_group_milestones": {
        const args = ListGroupMilestonesSchema.parse(request.params.arguments);
        const { group_id, ...options } = args;
        const milestones = await api.listGroupMilestones(group_id, options);
        return { content: [{ type: "text", text: JSON.stringify(milestones, null, 2) }] };
      }

      case "create_group_milestone": {
        const args = CreateGroupMilestoneSchema.parse(request.params.arguments);
        const milestone = await api.createGroupMilestone(
          args.group_id,
          args.title,
          args.description,
          args.due_date,
          args.start_date
        );
        return { content: [{ type: "text", text: JSON.stringify(milestone, null, 2) }] };
      }

      case "update_group_milestone": {
        const args = UpdateGroupMilestoneSchema.parse(request.params.arguments);
        const { group_id, milestone_id, ...options } = args;
        const milestone = await api.updateGroupMilestone(group_id, milestone_id, options);
        return { content: [{ type: "text", text: JSON.stringify(milestone, null, 2) }] };
      }

      case "delete_group_milestone": {
        const args = DeleteGroupMilestoneSchema.parse(request.params.arguments);
        await api.deleteGroupMilestone(args.group_id, args.milestone_id);
        return { content: [{ type: "text", text: JSON.stringify({ success: true }, null, 2) }] };
      }

      // Issue tools
      case "list_issues": {
        const args = ListIssuesSchema.parse(request.params.arguments);
        const { project_id, ...options } = args;
        const issues = await api.listIssues(project_id, options);
        return { content: [{ type: "text", text: JSON.stringify(issues, null, 2) }] };
      }

      case "update_issue": {
        const args = UpdateIssueSchema.parse(request.params.arguments);
        const { project_id, issue_iid, ...options } = args;
        const issue = await api.updateIssue(project_id, issue_iid, options);
        return { content: [{ type: "text", text: JSON.stringify(issue, null, 2) }] };
      }

      case "search_issues": {
        const args = SearchIssuesSchema.parse(request.params.arguments);
        const { project_id, search, ...options } = args;
        const issues = await api.searchIssues(project_id, search, options);
        return { content: [{ type: "text", text: JSON.stringify(issues, null, 2) }] };
      }

      case "add_issue_comment": {
        const args = AddIssueCommentSchema.parse(request.params.arguments);
        const comment = await api.addIssueComment(args.project_id, args.issue_iid, args.body);
        return { content: [{ type: "text", text: JSON.stringify(comment, null, 2) }] };
      }

      case "list_merge_requests": {
        const args = ListMergeRequestsSchema.parse(request.params.arguments);
        const { project_id, ...options } = args;
        const mergeRequests = await api.listMergeRequests(project_id, options);
        return { content: [{ type: "text", text: JSON.stringify(mergeRequests, null, 2) }] };
      }

      case "update_merge_request": {
        const args = UpdateMergeRequestSchema.parse(request.params.arguments);
        const { project_id, merge_request_iid, ...options } = args;
        const mergeRequest = await api.updateMergeRequest(project_id, merge_request_iid, options);
        return { content: [{ type: "text", text: JSON.stringify(mergeRequest, null, 2) }] };
      }

      case "merge_merge_request": {
        const args = MergeMergeRequestSchema.parse(request.params.arguments);
        const { project_id, merge_request_iid, ...options } = args;
        const mergeRequest = await api.mergeMergeRequest(project_id, merge_request_iid, options);
        return { content: [{ type: "text", text: JSON.stringify(mergeRequest, null, 2) }] };
      }

      case "add_merge_request_comment": {
        const args = AddMergeRequestCommentSchema.parse(request.params.arguments);
        const comment = await api.addMergeRequestComment(args.project_id, args.merge_request_iid, args.body);
        return { content: [{ type: "text", text: JSON.stringify(comment, null, 2) }] };
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

export async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
