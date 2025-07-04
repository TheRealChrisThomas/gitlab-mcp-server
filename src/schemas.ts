import { z } from "zod";

// Base schemas for common types
export const GitLabAuthorSchema = z.object({
  name: z.string(),
  email: z.string(),
  date: z.string()
});

// Repository related schemas
export const GitLabOwnerSchema = z.object({
  username: z.string(), // Changed from login to match GitLab API
  id: z.number(),
  avatar_url: z.string(),
  web_url: z.string(), // Changed from html_url to match GitLab API
  name: z.string(), // Added as GitLab includes full name
  state: z.string() // Added as GitLab includes user state
});

export const GitLabRepositorySchema = z
  .object({
    id: z.number()
  })
  .passthrough(); // Allow all other fields to flow through

// File content schemas
export const GitLabFileContentSchema = z
  .object({
    file_name: z.string(),
    file_path: z.string(),
    content: z.string()
  })
  .passthrough(); // Allow all other fields to flow through

export const GitLabDirectoryContentSchema = z
  .object({
    name: z.string(),
    path: z.string()
  })
  .passthrough(); // Allow all other fields to flow through

export const GitLabContentSchema = z.union([GitLabFileContentSchema, z.array(GitLabDirectoryContentSchema)]);

// Operation schemas
export const FileOperationSchema = z.object({
  path: z.string(),
  content: z.string()
});

// Tree and commit schemas
export const GitLabTreeEntrySchema = z.object({
  id: z.string(), // Changed from sha to match GitLab API
  name: z.string(),
  type: z.enum(["blob", "tree"]),
  path: z.string(),
  mode: z.string()
});

export const GitLabTreeSchema = z.object({
  id: z.string(), // Changed from sha to match GitLab API
  tree: z.array(GitLabTreeEntrySchema)
});

export const GitLabCommitSchema = z.object({
  id: z.string(), // Changed from sha to match GitLab API
  short_id: z.string(), // Added to match GitLab API
  title: z.string(), // Changed from message to match GitLab API
  author_name: z.string(),
  author_email: z.string(),
  authored_date: z.string(),
  committer_name: z.string(),
  committer_email: z.string(),
  committed_date: z.string(),
  web_url: z.string(), // Changed from html_url to match GitLab API
  parent_ids: z.array(z.string()) // Changed from parents to match GitLab API
});

// Reference schema
export const GitLabReferenceSchema = z.object({
  name: z.string(), // Changed from ref to match GitLab API
  commit: z.object({
    id: z.string(), // Changed from sha to match GitLab API
    web_url: z.string() // Changed from url to match GitLab API
  })
});

// Input schemas for operations
export const CreateRepositoryOptionsSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  visibility: z.enum(["private", "internal", "public"]).optional(), // Changed from private to match GitLab API
  initialize_with_readme: z.boolean().optional() // Changed from auto_init to match GitLab API
});

export const CreateIssueOptionsSchema = z.object({
  title: z.string(),
  description: z.string().optional(), // Changed from body to match GitLab API
  assignee_ids: z.array(z.number()).optional(), // Changed from assignees to match GitLab API
  milestone_id: z.number().optional(), // Changed from milestone to match GitLab API
  labels: z.array(z.string()).optional()
});

export const CreateMergeRequestOptionsSchema = z.object({
  // Changed from CreatePullRequestOptionsSchema
  title: z.string(),
  description: z.string().optional(), // Changed from body to match GitLab API
  source_branch: z.string(), // Changed from head to match GitLab API
  target_branch: z.string(), // Changed from base to match GitLab API
  allow_collaboration: z.boolean().optional(), // Changed from maintainer_can_modify to match GitLab API
  draft: z.boolean().optional()
});

export const CreateBranchOptionsSchema = z.object({
  name: z.string(), // Changed from ref to match GitLab API
  ref: z.string() // The source branch/commit for the new branch
});

// Response schemas for operations
export const GitLabCreateUpdateFileResponseSchema = z.object({
  file_path: z.string(),
  branch: z.string(),
  commit_id: z.string(), // Changed from sha to match GitLab API
  content: GitLabFileContentSchema.optional()
});

export const GitLabSearchResponseSchema = z.object({
  count: z.number(), // Changed from total_count to match GitLab API
  items: z.array(GitLabRepositorySchema)
});

// Group related schemas
export const GitLabGroupSchema = z
  .object({
    id: z.number()
  })
  .passthrough(); // Allow all other fields to flow through

export const GitLabGroupSearchResponseSchema = z.object({
  count: z.number(),
  items: z.array(GitLabGroupSchema)
});

// Fork related schemas
export const GitLabForkParentSchema = z.object({
  name: z.string(),
  path_with_namespace: z.string(), // Changed from full_name to match GitLab API
  owner: z.object({
    username: z.string(), // Changed from login to match GitLab API
    id: z.number(),
    avatar_url: z.string()
  }),
  web_url: z.string() // Changed from html_url to match GitLab API
});

export const GitLabForkSchema = GitLabRepositorySchema.extend({
  forked_from_project: GitLabForkParentSchema // Changed from parent to match GitLab API
});

// Issue related schemas
export const GitLabLabelSchema = z
  .object({
    id: z.number()
  })
  .passthrough(); // Allow all other fields to flow through

export const GitLabUserSchema = z
  .object({
    id: z.number()
  })
  .passthrough(); // Allow all other fields to flow through

export const GitLabMilestoneSchema = z
  .object({
    id: z.number(),
    project_id: z.number().optional() // Make project_id optional since it might not always be present
  })
  .passthrough(); // Allow all other fields to flow through

// Group milestone schema (similar to project milestone but with group_id)
export const GitLabGroupMilestoneSchema = z
  .object({
    id: z.number()
  })
  .passthrough(); // Allow all other fields to flow through

export const GitLabIssueSchema = z
  .object({
    id: z.number(),
    description: z.string().nullable(), // Allow null description
    labels: z.array(z.string()).optional().default([]), // GitLab returns array of strings for labels, not objects
    milestone: z.any().nullable().optional() // Make milestone completely flexible since project_id is sometimes missing
  })
  .passthrough(); // Allow all other fields to flow through for LLM processing

// Merge Request related schemas (equivalent to Pull Request)
export const GitLabMergeRequestDiffRefSchema = z.object({
  base_sha: z.string(),
  head_sha: z.string(),
  start_sha: z.string()
});

export const GitLabMergeRequestSchema = z
  .object({
    id: z.number()
  })
  .passthrough(); // Allow all other fields to flow through for LLM processing

// API Operation Parameter Schemas
const ProjectParamsSchema = z.object({
  project_id: z.string().describe("Project ID or URL-encoded path") // Changed from owner/repo to match GitLab API
});

export const CreateOrUpdateFileSchema = ProjectParamsSchema.extend({
  file_path: z.string().describe("Path where to create/update the file"),
  content: z.string().describe("Content of the file"),
  commit_message: z.string().describe("Commit message"),
  branch: z.string().describe("Branch to create/update the file in"),
  previous_path: z.string().optional().describe("Path of the file to move/rename")
});

export const SearchRepositoriesSchema = z.object({
  search: z.string().describe("Search query"), // Changed from query to match GitLab API
  page: z.number().optional().describe("Page number for pagination (default: 1)"),
  per_page: z.number().optional().describe("Number of results per page (default: 20)")
});

export const SearchGroupsSchema = z.object({
  search: z.string().describe("Search query for groups"),
  page: z.number().optional().describe("Page number for pagination (default: 1)"),
  per_page: z.number().optional().describe("Number of results per page (default: 20)"),
  owned: z.boolean().optional().describe("Limit by groups owned by the current user"),
  min_access_level: z
    .number()
    .optional()
    .describe("Limit by minimum access level (10=Guest, 20=Reporter, 30=Developer, 40=Maintainer, 50=Owner)")
});

export const CreateRepositorySchema = z.object({
  name: z.string().describe("Repository name"),
  description: z.string().optional().describe("Repository description"),
  visibility: z.enum(["private", "internal", "public"]).optional().describe("Repository visibility level"),
  initialize_with_readme: z.boolean().optional().describe("Initialize with README.md")
});

export const GetFileContentsSchema = ProjectParamsSchema.extend({
  file_path: z.string().describe("Path to the file or directory"),
  ref: z.string().optional().describe("Branch/tag/commit to get contents from")
});

export const PushFilesSchema = ProjectParamsSchema.extend({
  branch: z.string().describe("Branch to push to"),
  files: z
    .array(
      z.object({
        file_path: z.string().describe("Path where to create the file"),
        content: z.string().describe("Content of the file")
      })
    )
    .describe("Array of files to push"),
  commit_message: z.string().describe("Commit message")
});

export const CreateIssueSchema = ProjectParamsSchema.extend({
  title: z.string().describe("Issue title"),
  description: z.string().optional().describe("Issue description"),
  assignee_ids: z.array(z.number()).optional().describe("Array of user IDs to assign"),
  labels: z.array(z.string()).optional().describe("Array of label names"),
  milestone_id: z.number().optional().describe("Milestone ID to assign")
});

export const CreateMergeRequestSchema = ProjectParamsSchema.extend({
  title: z.string().describe("Merge request title"),
  description: z.string().optional().describe("Merge request description"),
  source_branch: z.string().describe("Branch containing changes"),
  target_branch: z.string().describe("Branch to merge into"),
  draft: z.boolean().optional().describe("Create as draft merge request"),
  allow_collaboration: z.boolean().optional().describe("Allow commits from upstream members")
});

export const ForkRepositorySchema = ProjectParamsSchema.extend({
  namespace: z.string().optional().describe("Namespace to fork to (full path)")
});

export const CreateBranchSchema = ProjectParamsSchema.extend({
  branch: z.string().describe("Name for the new branch"),
  ref: z.string().optional().describe("Source branch/commit for new branch")
});

// Label management schemas
export const CreateLabelSchema = z.object({
  project_id: z.string(),
  name: z.string(),
  color: z.string(),
  description: z.string().optional(),
  priority: z.number().optional()
});

export const UpdateLabelSchema = z.object({
  project_id: z.string(),
  name: z.string(), // Current name (identifier)
  new_name: z.string().optional(),
  color: z.string().optional(),
  description: z.string().optional(),
  priority: z.number().optional()
});

export const DeleteLabelSchema = z.object({
  project_id: z.string(),
  name: z.string()
});

export const ListLabelsSchema = z.object({
  project_id: z.string(),
  page: z.number().optional(),
  per_page: z.number().optional()
});

// Milestone management schemas
export const CreateMilestoneSchema = z.object({
  project_id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  due_date: z.string().optional(),
  start_date: z.string().optional()
});

export const UpdateMilestoneSchema = z.object({
  project_id: z.string(),
  milestone_id: z.number(),
  title: z.string().optional(),
  description: z.string().optional(),
  due_date: z.string().optional(),
  start_date: z.string().optional(),
  state_event: z.enum(["close", "activate"]).optional()
});

export const DeleteMilestoneSchema = z.object({
  project_id: z.string(),
  milestone_id: z.number()
});

export const ListMilestonesSchema = z.object({
  project_id: z.string(),
  state: z.enum(["active", "closed"]).optional(),
  page: z.number().optional(),
  per_page: z.number().optional()
});

// Group milestone management schemas
export const ListGroupMilestonesSchema = z.object({
  group_id: z.string().describe("Group ID or URL-encoded path"),
  state: z.enum(["active", "closed"]).optional().describe("Return only active or closed milestones"),
  title: z.string().optional().describe("Return only milestones with the given title (case-sensitive)"),
  search: z.string().optional().describe("Return only milestones with title or description matching the string"),
  search_title: z.string().optional().describe("Return only milestones with title matching the string"),
  include_ancestors: z.boolean().optional().describe("Include milestones for all parent groups"),
  include_descendants: z.boolean().optional().describe("Include milestones for group and its descendants"),
  updated_before: z.string().optional().describe("Return only milestones updated before the given datetime (ISO 8601)"),
  updated_after: z.string().optional().describe("Return only milestones updated after the given datetime (ISO 8601)"),
  containing_date: z.string().optional().describe("Return only milestones containing the given date"),
  start_date: z.string().optional().describe("Return only milestones where due_date >= start_date"),
  end_date: z.string().optional().describe("Return only milestones where start_date <= end_date"),
  page: z.number().optional().describe("Page number for pagination (default: 1)"),
  per_page: z.number().optional().describe("Number of results per page (default: 20)")
});

export const CreateGroupMilestoneSchema = z.object({
  group_id: z.string().describe("Group ID or URL-encoded path"),
  title: z.string().describe("The title of the milestone"),
  description: z.string().optional().describe("The description of the milestone"),
  due_date: z.string().optional().describe("The due date of the milestone (YYYY-MM-DD)"),
  start_date: z.string().optional().describe("The start date of the milestone (YYYY-MM-DD)")
});

export const UpdateGroupMilestoneSchema = z.object({
  group_id: z.string().describe("Group ID or URL-encoded path"),
  milestone_id: z.number().describe("The ID of the group milestone"),
  title: z.string().optional().describe("The title of the milestone"),
  description: z.string().optional().describe("The description of the milestone"),
  due_date: z.string().optional().describe("The due date of the milestone (YYYY-MM-DD)"),
  start_date: z.string().optional().describe("The start date of the milestone (YYYY-MM-DD)"),
  state_event: z.enum(["close", "activate"]).optional().describe("The state event of the milestone")
});

export const DeleteGroupMilestoneSchema = z.object({
  group_id: z.string().describe("Group ID or URL-encoded path"),
  milestone_id: z.number().describe("The ID of the group milestone")
});

// Issue management schemas
export const ListIssuesSchema = z.object({
  project_id: z.string().describe("Project ID or URL-encoded path"),
  state: z.enum(["opened", "closed", "all"]).optional().describe("Filter issues by state"),
  labels: z.string().optional().describe("Comma-separated list of label names"),
  milestone: z.string().optional().describe("Milestone title"),
  assignee_id: z.number().optional().describe("User ID of assignee"),
  author_id: z.number().optional().describe("User ID of author"),
  search: z.string().optional().describe("Search against title and description"),
  created_after: z.string().optional().describe("Return issues created after date (ISO 8601)"),
  created_before: z.string().optional().describe("Return issues created before date (ISO 8601)"),
  updated_after: z.string().optional().describe("Return issues updated after date (ISO 8601)"),
  updated_before: z.string().optional().describe("Return issues updated before date (ISO 8601)"),
  sort: z
    .enum([
      "created_at",
      "updated_at",
      "priority",
      "due_date",
      "relative_position",
      "label_priority",
      "milestone_due",
      "popularity",
      "weight"
    ])
    .optional()
    .describe("Sort issues"),
  order_by: z.enum(["asc", "desc"]).optional().describe("Sort order"),
  page: z
    .number()
    .optional()
    .describe(
      "Page number for pagination. ONLY specify this if you need a specific page - by default ALL issues are fetched automatically"
    ),
  per_page: z.number().optional().describe("Number of results per page (default: 20)"),
  with_labels_details: z.boolean().optional().describe("If true, returns more details for each label. Default is false.")
});

export const UpdateIssueSchema = z.object({
  project_id: z.string().describe("Project ID or URL-encoded path"),
  issue_iid: z.number().describe("Issue internal ID"),
  title: z.string().optional().describe("New issue title"),
  description: z.string().optional().describe("New issue description"),
  state_event: z.enum(["close", "reopen"]).optional().describe("Change issue state"),
  labels: z.array(z.string()).optional().describe("Array of label names"),
  assignee_ids: z.array(z.number()).optional().describe("Array of user IDs to assign"),
  milestone_id: z.number().optional().describe("Milestone ID to assign")
});

export const SearchIssuesSchema = z.object({
  project_id: z.string().describe("Project ID or URL-encoded path"),
  search: z.string().describe("Search term for title and description"),
  state: z.enum(["opened", "closed", "all"]).optional().describe("Filter issues by state"),
  labels: z.string().optional().describe("Comma-separated list of label names"),
  page: z.number().optional().describe("Page number for pagination (default: 1)"),
  per_page: z.number().optional().describe("Number of results per page (default: 20)")
});

export const AddIssueCommentSchema = z.object({
  project_id: z.string().describe("Project ID or URL-encoded path"),
  issue_iid: z.number().describe("Issue internal ID"),
  body: z.string().describe("Content of the comment")
});

// Merge request management schemas
export const ListMergeRequestsSchema = z.object({
  project_id: z.string().describe("Project ID or URL-encoded path"),
  state: z.enum(["opened", "closed", "locked", "merged", "all"]).optional().describe("Filter merge requests by state"),
  target_branch: z.string().optional().describe("Filter by target branch"),
  source_branch: z.string().optional().describe("Filter by source branch"),
  labels: z.string().optional().describe("Comma-separated list of label names"),
  milestone: z.string().optional().describe("Milestone title"),
  assignee_id: z.number().optional().describe("User ID of assignee"),
  author_id: z.number().optional().describe("User ID of author"),
  search: z.string().optional().describe("Search against title and description"),
  created_after: z.string().optional().describe("Return MRs created after date (ISO 8601)"),
  created_before: z.string().optional().describe("Return MRs created before date (ISO 8601)"),
  updated_after: z.string().optional().describe("Return MRs updated after date (ISO 8601)"),
  updated_before: z.string().optional().describe("Return MRs updated before date (ISO 8601)"),
  sort: z.enum(["created_at", "updated_at", "title"]).optional().describe("Sort merge requests"),
  order_by: z.enum(["asc", "desc"]).optional().describe("Sort order"),
  page: z.number().optional().describe("Page number for pagination (default: 1)"),
  per_page: z.number().optional().describe("Number of results per page (default: 20)")
});

export const UpdateMergeRequestSchema = z.object({
  project_id: z.string().describe("Project ID or URL-encoded path"),
  merge_request_iid: z.number().describe("Merge request internal ID"),
  title: z.string().optional().describe("New merge request title"),
  description: z.string().optional().describe("New merge request description"),
  state_event: z.enum(["close", "reopen"]).optional().describe("Change merge request state"),
  target_branch: z.string().optional().describe("New target branch"),
  labels: z.array(z.string()).optional().describe("Array of label names"),
  assignee_ids: z.array(z.number()).optional().describe("Array of user IDs to assign"),
  milestone_id: z.number().optional().describe("Milestone ID to assign"),
  remove_source_branch: z.boolean().optional().describe("Remove source branch when merged")
});

export const MergeMergeRequestSchema = z.object({
  project_id: z.string().describe("Project ID or URL-encoded path"),
  merge_request_iid: z.number().describe("Merge request internal ID"),
  merge_commit_message: z.string().optional().describe("Custom merge commit message"),
  should_remove_source_branch: z.boolean().optional().describe("Remove source branch after merge"),
  merge_when_pipeline_succeeds: z.boolean().optional().describe("Merge when pipeline succeeds"),
  sha: z.string().optional().describe("SHA that must match the source branch HEAD")
});

export const AddMergeRequestCommentSchema = z.object({
  project_id: z.string().describe("Project ID or URL-encoded path"),
  merge_request_iid: z.number().describe("Merge request internal ID"),
  body: z.string().describe("Content of the comment")
});

// Comment response schema
export const GitLabCommentSchema = z
  .object({
    id: z.number()
  })
  .passthrough(); // Allow all other fields to flow through for LLM processing

// Export types
export type GitLabAuthor = z.infer<typeof GitLabAuthorSchema>;
export type GitLabFork = z.infer<typeof GitLabForkSchema>;
export type GitLabIssue = z.infer<typeof GitLabIssueSchema>;
export type GitLabMergeRequest = z.infer<typeof GitLabMergeRequestSchema>;
export type GitLabRepository = z.infer<typeof GitLabRepositorySchema>;
export type GitLabFileContent = z.infer<typeof GitLabFileContentSchema>;
export type GitLabDirectoryContent = z.infer<typeof GitLabDirectoryContentSchema>;
export type GitLabContent = z.infer<typeof GitLabContentSchema>;
export type FileOperation = z.infer<typeof FileOperationSchema>;
export type GitLabTree = z.infer<typeof GitLabTreeSchema>;
export type GitLabCommit = z.infer<typeof GitLabCommitSchema>;
export type GitLabReference = z.infer<typeof GitLabReferenceSchema>;
export type CreateRepositoryOptions = z.infer<typeof CreateRepositoryOptionsSchema>;
export type CreateIssueOptions = z.infer<typeof CreateIssueOptionsSchema>;
export type CreateMergeRequestOptions = z.infer<typeof CreateMergeRequestOptionsSchema>;
export type CreateBranchOptions = z.infer<typeof CreateBranchOptionsSchema>;
export type GitLabCreateUpdateFileResponse = z.infer<typeof GitLabCreateUpdateFileResponseSchema>;
export type GitLabSearchResponse = z.infer<typeof GitLabSearchResponseSchema>;
export type GitLabLabelResponse = z.infer<typeof GitLabLabelSchema>;
export type GitLabMilestoneResponse = z.infer<typeof GitLabMilestoneSchema>;
export type GitLabGroupMilestoneResponse = z.infer<typeof GitLabGroupMilestoneSchema>;
export type GitLabGroup = z.infer<typeof GitLabGroupSchema>;
export type GitLabGroupSearchResponse = z.infer<typeof GitLabGroupSearchResponseSchema>;
export type GitLabComment = z.infer<typeof GitLabCommentSchema>;
