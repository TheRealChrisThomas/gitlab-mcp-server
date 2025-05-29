<div align="center">
  <img src="./mcp-logo.png" width="200" alt="MCP Logo">
</div>

# GitLab MCP Server

MCP Server for the GitLab API, enabling project management, file operations, and more. Forked from https://github.com/modelcontextprotocol

## Installation

### NPX (Recommended)

```bash
npx @therealchristhomas/gitlab-mcp-server
```

### Global Installation

```bash
npm install -g @therealchristhomas/gitlab-mcp-server
gitlab-mcp
```

## Features

- **Automatic Branch Creation**: When creating/updating files or pushing changes, branches are automatically created if they don't exist
- **Comprehensive Error Handling**: Clear error messages for common issues
- **Git History Preservation**: Operations maintain proper Git history without force pushing
- **Batch Operations**: Support for both single-file and multi-file operations
- **Project Workflow Management**: Label and milestone management for better project organization
- **Repository Management**: Search, create, and fork GitLab projects
- **File Operations**: Create, update, and retrieve file contents
- **Branch Management**: Create branches and manage repository structure
- **Issue Management**: Create, list, update, search, and comment on issues
- **Merge Request Management**: List, update, merge, and comment on merge requests
- **Label Management**: Create, update, and delete project labels
- **Project Milestones**: Create, update, and delete project-level milestones
- **Group Milestones**: Create, update, and delete group-level milestones that span multiple projects

## Group Milestones vs Project Milestones

This server supports both **project milestones** and **group milestones**:

### Project Milestones

- Scoped to a single project
- Use tools: `list_milestones`, `create_milestone`, `update_milestone`, `delete_milestone`
- Example: Track features for `my-webapp` project

### Group Milestones

- Span multiple projects within a group
- Use tools: `list_group_milestones`, `create_group_milestone`, `update_group_milestone`, `delete_group_milestone`
- Support advanced filtering with `include_ancestors`, `include_descendants`
- Example: Track a release across `my-webapp`, `my-api`, and `my-admin`

## Group Milestone Examples

### List Group Milestones

```json
{
  "group_id": "my-organization",
  "state": "active",
  "include_descendants": true
}
```

### Create Group Milestone

```json
{
  "group_id": "my-organization",
  "title": "Q1 2025 Release",
  "description": "Major feature release including new tools and performance improvements",
  "due_date": "2025-03-31",
  "start_date": "2025-01-01"
}
```

### Advanced Group Milestone Search

```json
{
  "group_id": "my-organization/core",
  "search": "release",
  "include_ancestors": true,
  "updated_after": "2024-01-01T00:00:00Z"
}
```

Based on the [GitLab Group Milestones API](https://docs.gitlab.com/api/group_milestones/), group milestones are ideal for coordinating releases and features across multiple projects in your organization.

## Practical Workflow: Finding Groups and Creating Milestones

Here's a typical workflow for working with group milestones:

### 1. Search for Groups

First, find the group you want to work with:

```json
{
  "search": "my-organization",
  "owned": true
}
```

### 2. List Existing Group Milestones

Check what milestones already exist:

```json
{
  "group_id": "my-organization",
  "state": "active"
}
```

### 3. Create a Group Milestone

Create a milestone that spans multiple projects:

```json
{
  "group_id": "my-organization",
  "title": "Q1 2025 Release",
  "description": "Cross-project release including webapp, API, and admin features",
  "due_date": "2025-03-31"
}
```

This workflow is especially useful for large organizations with multiple related projects under the same group.

## Tools

1. `create_or_update_file`

   - Create or update a single file in a project
   - Inputs:
     - `project_id` (string): Project ID or URL-encoded path
     - `file_path` (string): Path where to create/update the file
     - `content` (string): Content of the file
     - `commit_message` (string): Commit message
     - `branch` (string): Branch to create/update the file in
     - `previous_path` (optional string): Path of the file to move/rename
   - Returns: File content and commit details

2. `push_files`

   - Push multiple files in a single commit
   - Inputs:
     - `project_id` (string): Project ID or URL-encoded path
     - `branch` (string): Branch to push to
     - `files` (array): Files to push, each with `file_path` and `content`
     - `commit_message` (string): Commit message
   - Returns: Updated branch reference

3. `search_repositories`

   - Search for GitLab projects
   - Inputs:
     - `search` (string): Search query
     - `page` (optional number): Page number for pagination
     - `per_page` (optional number): Results per page (default 20)
   - Returns: Project search results

4. `search_groups`

   - Search for GitLab groups
   - Inputs:
     - `search` (string): Search query for groups
     - `page` (optional number): Page number for pagination
     - `per_page` (optional number): Results per page (default 20)
     - `owned` (optional boolean): Limit by groups owned by the current user
     - `min_access_level` (optional number): Minimum access level (10=Guest, 20=Reporter, 30=Developer, 40=Maintainer, 50=Owner)
   - Returns: Group search results

5. `create_repository`

   - Create a new GitLab project
   - Inputs:
     - `name` (string): Project name
     - `description` (optional string): Project description
     - `visibility` (optional string): 'private', 'internal', or 'public'
     - `initialize_with_readme` (optional boolean): Initialize with README
   - Returns: Created project details

6. `get_file_contents`

   - Get contents of a file or directory
   - Inputs:
     - `project_id` (string): Project ID or URL-encoded path
     - `file_path` (string): Path to file/directory
     - `ref` (optional string): Branch/tag/commit to get contents from
   - Returns: File/directory contents

7. `create_issue`

   - Create a new issue
   - Inputs:
     - `project_id` (string): Project ID or URL-encoded path
     - `title` (string): Issue title
     - `description` (optional string): Issue description
     - `assignee_ids` (optional number[]): User IDs to assign
     - `labels` (optional string[]): Labels to add
     - `milestone_id` (optional number): Milestone ID
   - Returns: Created issue details

8. `create_merge_request`

   - Create a new merge request
   - Inputs:
     - `project_id` (string): Project ID or URL-encoded path
     - `title` (string): MR title
     - `description` (optional string): MR description
     - `source_branch` (string): Branch containing changes
     - `target_branch` (string): Branch to merge into
     - `draft` (optional boolean): Create as draft MR
     - `allow_collaboration` (optional boolean): Allow commits from upstream members
   - Returns: Created merge request details

9. `fork_repository`

   - Fork a project
   - Inputs:
     - `project_id` (string): Project ID or URL-encoded path
     - `namespace` (optional string): Namespace to fork to
   - Returns: Forked project details

10. `create_branch`

    - Create a new branch
    - Inputs:
      - `project_id` (string): Project ID or URL-encoded path
      - `branch` (string): Name for new branch
      - `ref` (optional string): Source branch/commit for new branch
    - Returns: Created branch reference

11. `list_labels`

    - List all labels in a project
    - Inputs:
      - `project_id` (string): Project ID or URL-encoded path
      - `page` (optional number): Page number for pagination
      - `per_page` (optional number): Results per page (default 20)
    - Returns: Array of label objects

12. `create_label`

    - Create a new label
    - Inputs:
      - `project_id` (string): Project ID or URL-encoded path
      - `name` (string): Label name
      - `color` (string): Label color (hex code)
      - `description` (optional string): Label description
      - `priority` (optional number): Label priority
    - Returns: Created label details

13. `update_label`

    - Update an existing label
    - Inputs:
      - `project_id` (string): Project ID or URL-encoded path
      - `name` (string): Current label name
      - `new_name` (optional string): New label name
      - `color` (optional string): New label color
      - `description` (optional string): New label description
      - `priority` (optional number): New label priority
    - Returns: Updated label details

14. `delete_label`

    - Delete a label
    - Inputs:
      - `project_id` (string): Project ID or URL-encoded path
      - `name` (string): Label name to delete
    - Returns: Success confirmation

15. `list_milestones`

    - List all milestones in a project
    - Inputs:
      - `project_id` (string): Project ID or URL-encoded path
      - `state` (optional string): 'active' or 'closed'
      - `page` (optional number): Page number for pagination
      - `per_page` (optional number): Results per page (default 20)
    - Returns: Array of milestone objects

16. `create_milestone`

    - Create a new milestone
    - Inputs:
      - `project_id` (string): Project ID or URL-encoded path
      - `title` (string): Milestone title
      - `description` (optional string): Milestone description
      - `due_date` (optional string): Due date (YYYY-MM-DD)
      - `start_date` (optional string): Start date (YYYY-MM-DD)
    - Returns: Created milestone details

17. `update_milestone`

    - Update an existing milestone
    - Inputs:
      - `project_id` (string): Project ID or URL-encoded path
      - `milestone_id` (number): Milestone ID
      - `title` (optional string): New title
      - `description` (optional string): New description
      - `due_date` (optional string): New due date
      - `start_date` (optional string): New start date
      - `state_event` (optional string): 'close' or 'activate'
    - Returns: Updated milestone details

18. `delete_milestone`

    - Delete a milestone
    - Inputs:
      - `project_id` (string): Project ID or URL-encoded path
      - `milestone_id` (number): Milestone ID to delete
    - Returns: Success confirmation

19. `list_group_milestones`

    - List all milestones in a GitLab group
    - Inputs:
      - `group_id` (string): Group ID or URL-encoded path
      - `state` (optional string): 'active' or 'closed'
      - `title` (optional string): Filter by milestone title (case-sensitive)
      - `search` (optional string): Search in title or description
      - `search_title` (optional string): Search in title only
      - `include_ancestors` (optional boolean): Include parent group milestones
      - `include_descendants` (optional boolean): Include subgroup milestones
      - `updated_before` (optional string): Filter by update date (ISO 8601)
      - `updated_after` (optional string): Filter by update date (ISO 8601)
      - `containing_date` (optional string): Milestones containing given date
      - `start_date` (optional string): Filter where due_date >= start_date
      - `end_date` (optional string): Filter where start_date <= end_date
      - `page` (optional number): Page number for pagination
      - `per_page` (optional number): Results per page (default 20)
    - Returns: Array of group milestone objects

20. `create_group_milestone`

    - Create a new milestone in a GitLab group
    - Inputs:
      - `group_id` (string): Group ID or URL-encoded path
      - `title` (string): Milestone title
      - `description` (optional string): Milestone description
      - `due_date` (optional string): Due date (YYYY-MM-DD)
      - `start_date` (optional string): Start date (YYYY-MM-DD)
    - Returns: Created group milestone details

21. `update_group_milestone`

    - Update an existing milestone in a GitLab group
    - Inputs:
      - `group_id` (string): Group ID or URL-encoded path
      - `milestone_id` (number): Milestone ID
      - `title` (optional string): New title
      - `description` (optional string): New description
      - `due_date` (optional string): New due date
      - `start_date` (optional string): New start date
      - `state_event` (optional string): 'close' or 'activate'
    - Returns: Updated group milestone details

22. `delete_group_milestone`

    - Delete a milestone from a GitLab group
    - Inputs:
      - `group_id` (string): Group ID or URL-encoded path
      - `milestone_id` (number): Milestone ID to delete
    - Returns: Success confirmation

23. `list_issues`

    - List all issues in a GitLab project
    - Inputs:
      - `project_id` (string): Project ID or URL-encoded path
      - `state` (optional string): 'opened', 'closed', or 'all'
      - `labels` (optional string): Comma-separated list of label names
      - `milestone` (optional string): Milestone title
      - `assignee_id` (optional number): User ID of assignee
      - `author_id` (optional number): User ID of author
      - `search` (optional string): Search against title and description
      - `created_after` (optional string): Return issues created after date (ISO 8601)
      - `created_before` (optional string): Return issues created before date (ISO 8601)
      - `updated_after` (optional string): Return issues updated after date (ISO 8601)
      - `updated_before` (optional string): Return issues updated before date (ISO 8601)
      - `sort` (optional string): Sort issues by various criteria
      - `order_by` (optional string): 'asc' or 'desc'
      - `page` (optional number): Page number for pagination
      - `per_page` (optional number): Results per page (default 20)
    - Returns: Array of issue objects

24. `update_issue`

    - Update an existing issue in a GitLab project
    - Inputs:
      - `project_id` (string): Project ID or URL-encoded path
      - `issue_iid` (number): Issue internal ID
      - `title` (optional string): New issue title
      - `description` (optional string): New issue description
      - `state_event` (optional string): 'close' or 'reopen'
      - `labels` (optional string[]): Array of label names
      - `assignee_ids` (optional number[]): Array of user IDs to assign
      - `milestone_id` (optional number): Milestone ID to assign
    - Returns: Updated issue details

25. `search_issues`

    - Search for issues in a GitLab project
    - Inputs:
      - `project_id` (string): Project ID or URL-encoded path
      - `search` (string): Search term for title and description
      - `state` (optional string): 'opened', 'closed', or 'all'
      - `labels` (optional string): Comma-separated list of label names
      - `page` (optional number): Page number for pagination
      - `per_page` (optional number): Results per page (default 20)
    - Returns: Array of matching issue objects

26. `add_issue_comment`

    - Add a comment to an issue in a GitLab project
    - Inputs:
      - `project_id` (string): Project ID or URL-encoded path
      - `issue_iid` (number): Issue internal ID
      - `body` (string): Content of the comment
    - Returns: Created comment details

27. `list_merge_requests`

    - List all merge requests in a GitLab project
    - Inputs:
      - `project_id` (string): Project ID or URL-encoded path
      - `state` (optional string): 'opened', 'closed', 'locked', 'merged', or 'all'
      - `target_branch` (optional string): Filter by target branch
      - `source_branch` (optional string): Filter by source branch
      - `labels` (optional string): Comma-separated list of label names
      - `milestone` (optional string): Milestone title
      - `assignee_id` (optional number): User ID of assignee
      - `author_id` (optional number): User ID of author
      - `search` (optional string): Search against title and description
      - `created_after` (optional string): Return MRs created after date (ISO 8601)
      - `created_before` (optional string): Return MRs created before date (ISO 8601)
      - `updated_after` (optional string): Return MRs updated after date (ISO 8601)
      - `updated_before` (optional string): Return MRs updated before date (ISO 8601)
      - `sort` (optional string): Sort merge requests
      - `order_by` (optional string): 'asc' or 'desc'
      - `page` (optional number): Page number for pagination
      - `per_page` (optional number): Results per page (default 20)
    - Returns: Array of merge request objects

28. `update_merge_request`

    - Update an existing merge request in a GitLab project
    - Inputs:
      - `project_id` (string): Project ID or URL-encoded path
      - `merge_request_iid` (number): Merge request internal ID
      - `title` (optional string): New merge request title
      - `description` (optional string): New merge request description
      - `state_event` (optional string): 'close' or 'reopen'
      - `target_branch` (optional string): New target branch
      - `labels` (optional string[]): Array of label names
      - `assignee_ids` (optional number[]): Array of user IDs to assign
      - `milestone_id` (optional number): Milestone ID to assign
      - `remove_source_branch` (optional boolean): Remove source branch when merged
    - Returns: Updated merge request details

29. `merge_merge_request`

    - Merge a merge request in a GitLab project
    - Inputs:
      - `project_id` (string): Project ID or URL-encoded path
      - `merge_request_iid` (number): Merge request internal ID
      - `merge_commit_message` (optional string): Custom merge commit message
      - `should_remove_source_branch` (optional boolean): Remove source branch after merge
      - `merge_when_pipeline_succeeds` (optional boolean): Merge when pipeline succeeds
      - `sha` (optional string): SHA that must match the source branch HEAD
    - Returns: Merged merge request details

30. `add_merge_request_comment`

    - Add a comment to a merge request in a GitLab project
    - Inputs:
      - `project_id` (string): Project ID or URL-encoded path
      - `merge_request_iid` (number): Merge request internal ID
      - `body` (string): Content of the comment
    - Returns: Created comment details

## Setup

### Personal Access Token

[Create a GitLab Personal Access Token](https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html) with appropriate permissions:

- Go to User Settings > Access Tokens in GitLab
- Select the required scopes:
  - `api` for full API access
  - `read_api` for read-only access
  - `read_repository` and `write_repository` for repository operations
- Create the token and save it securely

### Usage with Claude Desktop

Add the following to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "gitlab": {
      "command": "npx",
      "args": ["-y", "@therealchristhomas/gitlab-mcp-server"],
      "env": {
        "GITLAB_PERSONAL_ACCESS_TOKEN": "<YOUR_TOKEN>",
        "GITLAB_API_URL": "https://gitlab.com/api/v4"
      }
    }
  }
}
```

### Usage with Cursor

Add the following to your Cursor MCP configuration:

```json
{
  "mcpServers": {
    "gitlab": {
      "command": "npx",
      "args": ["-y", "@therealchristhomas/gitlab-mcp-server"],
      "env": {
        "GITLAB_PERSONAL_ACCESS_TOKEN": "<YOUR_TOKEN>",
        "GITLAB_API_URL": "https://gitlab.com/api/v4"
      }
    }
  }
}
```

**Note**: Replace `<YOUR_TOKEN>` with your actual GitLab Personal Access Token.

## Environment Variables

- `GITLAB_PERSONAL_ACCESS_TOKEN`: Your GitLab personal access token (required)
- `GITLAB_API_URL`: Base URL for GitLab API (optional, defaults to `https://gitlab.com/api/v4`)

For self-hosted GitLab instances, update the `GITLAB_API_URL` to point to your instance:

```
"GITLAB_API_URL": "https://your-gitlab-instance.com/api/v4"
```

## Development

### Build

```bash
npm run build
```

### Development Mode

```bash
npm run dev
```

### Watch Mode

```bash
npm run watch
```

## License

This MCP server is licensed under the MIT License. This means you are free to use, modify, and distribute the software, subject to the terms and conditions of the MIT License. For more details, please see the LICENSE file in the project repository.
