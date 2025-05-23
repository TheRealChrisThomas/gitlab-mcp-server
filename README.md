# GitLab MCP Server

MCP Server for the GitLab API, enabling project management, file operations, and more.

## Installation

### NPX (Recommended)

```bash
npx gitlab-mcp-server
```

### Global Installation

```bash
npm install -g gitlab-mcp-server
gitlab-mcp-server
```

### Features

- **Automatic Branch Creation**: When creating/updating files or pushing changes, branches are automatically created if they don't exist
- **Comprehensive Error Handling**: Clear error messages for common issues
- **Git History Preservation**: Operations maintain proper Git history without force pushing
- **Batch Operations**: Support for both single-file and multi-file operations
- **Project Workflow Management**: Label and milestone management for better project organization
- **Repository Management**: Search, create, and fork GitLab projects
- **File Operations**: Create, update, and retrieve file contents
- **Branch Management**: Create branches and manage repository structure
- **Issue Tracking**: Create and manage issues
- **Merge Requests**: Create and manage merge requests
- **Label Management**: Create, update, and delete project labels
- **Project Milestones**: Create, update, and delete project-level milestones
- **Group Milestones**: Create, update, and delete group-level milestones that span multiple projects

## Group Milestones vs Project Milestones

This server supports both **project milestones** and **group milestones**:

### Project Milestones

- Scoped to a single project
- Use tools: `list_milestones`, `create_milestone`, `update_milestone`, `delete_milestone`
- Example: Track features for `budgetocity-webapp` project

### Group Milestones

- Span multiple projects within a group
- Use tools: `list_group_milestones`, `create_group_milestone`, `update_group_milestone`, `delete_group_milestone`
- Support advanced filtering with `include_ancestors`, `include_descendants`
- Example: Track a release across `budgetocity-webapp`, `budgetocity-api`, and `budgetocity-admin`

## Group Milestone Examples

### List Group Milestones

```json
{
  "group_id": "budgetocity",
  "state": "active",
  "include_descendants": true
}
```

### Create Group Milestone

```json
{
  "group_id": "budgetocity",
  "title": "Q1 2025 Release",
  "description": "Major feature release including new budgeting tools and performance improvements",
  "due_date": "2025-03-31",
  "start_date": "2025-01-01"
}
```

### Advanced Group Milestone Search

```json
{
  "group_id": "budgetocity/core",
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
  "search": "budgetocity",
  "owned": true
}
```

### 2. List Existing Group Milestones

Check what milestones already exist:

```json
{
  "group_id": "budgetocity",
  "state": "active"
}
```

### 3. Create a Group Milestone

Create a milestone that spans multiple projects:

```json
{
  "group_id": "budgetocity",
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

#### Docker

```json
{
  "mcpServers": {
    "gitlab": {
      "command": "docker",
      "args": ["run", "--rm", "-i", "-e", "GITLAB_PERSONAL_ACCESS_TOKEN", "-e", "GITLAB_API_URL", "mcp/gitlab"],
      "env": {
        "GITLAB_PERSONAL_ACCESS_TOKEN": "<YOUR_TOKEN>",
        "GITLAB_API_URL": "https://gitlab.com/api/v4" // Optional, for self-hosted instances
      }
    }
  }
}
```

#### NPX

```json
{
  "mcpServers": {
    "gitlab": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-gitlab"],
      "env": {
        "GITLAB_PERSONAL_ACCESS_TOKEN": "<YOUR_TOKEN>",
        "GITLAB_API_URL": "https://gitlab.com/api/v4" // Optional, for self-hosted instances
      }
    }
  }
}
```

### Usage with VS Code

For quick installation, use one of the one-click installation buttons below...

[![Install with NPX in VS Code](https://img.shields.io/badge/VS_Code-NPM-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](<https://insiders.vscode.dev/redirect/mcp/install?name=gitlab&inputs=%5B%7B%22type%22%3A%22promptString%22%2C%22id%22%3A%22gitlab_token%22%2C%22description%22%3A%22GitLab%20Personal%20Access%20Token%22%2C%22password%22%3Atrue%7D%2C%7B%22type%22%3A%22promptString%22%2C%22id%22%3A%22gitlab_url%22%2C%22description%22%3A%22GitLab%20API%20URL%20(optional%2C%20default%3A%20https%3A%2F%2Fgitlab.com%2Fapi%2Fv4)%22%2C%22default%22%3A%22https%3A%2F%2Fgitlab.com%2Fapi%2Fv4%22%7D%5D&config=%7B%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22%40modelcontextprotocol%2Fserver-gitlab%22%5D%2C%22env%22%3A%7B%22GITLAB_PERSONAL_ACCESS_TOKEN%22%3A%22%24%7Binput%3Agitlab_token%7D%22%2C%22GITLAB_API_URL%22%3A%22%24%7Binput%3Agitlab_url%7D%22%7D%7D>) [![Install with NPX in VS Code Insiders](https://img.shields.io/badge/VS_Code_Insiders-NPM-24bfa5?style=flat-square&logo=visualstudiocode&logoColor=white)](<https://insiders.vscode.dev/redirect/mcp/install?name=gitlab&inputs=%5B%7B%22type%22%3A%22promptString%22%2C%22id%22%3A%22gitlab_token%22%2C%22description%22%3A%22GitLab%20Personal%20Access%20Token%22%2C%22password%22%3Atrue%7D%2C%7B%22type%22%3A%22promptString%22%2C%22id%22%3A%22gitlab_url%22%2C%22description%22%3A%22GitLab%20API%20URL%20(optional%2C%20default%3A%20https%3A%2F%2Fgitlab.com%2Fapi%2Fv4)%22%2C%22default%22%3A%22https%3A%2F%2Fgitlab.com%2Fapi%2Fv4%22%7D%5D&config=%7B%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22%40modelcontextprotocol%2Fserver-gitlab%22%5D%2C%22env%22%3A%7B%22GITLAB_PERSONAL_ACCESS_TOKEN%22%3A%22%24%7Binput%3Agitlab_token%7D%22%2C%22GITLAB_API_URL%22%3A%22%24%7Binput%3Agitlab_url%7D%22%7D%7D&quality=insiders>)

[![Install with Docker in VS Code](https://img.shields.io/badge/VS_Code-Docker-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](<https://insiders.vscode.dev/redirect/mcp/install?name=gitlab&inputs=%5B%7B%22type%22%3A%22promptString%22%2C%22id%22%3A%22gitlab_token%22%2C%22description%22%3A%22GitLab%20Personal%20Access%20Token%22%2C%22password%22%3Atrue%7D%2C%7B%22type%22%3A%22promptString%22%2C%22id%22%3A%22gitlab_url%22%2C%22description%22%3A%22GitLab%20API%20URL%20(optional%2C%20default%3A%20https%3A%2F%2Fgitlab.com%2Fapi%2Fv4)%22%2C%22default%22%3A%22https%3A%2F%2Fgitlab.com%2Fapi%2Fv4%22%7D%5D&config=%7B%22command%22%3A%22docker%22%2C%22args%22%3A%5B%22run%22%2C%22--rm%22%2C%22-i%22%2C%22mcp%2Fgitlab%22%5D%2C%22env%22%3A%7B%22GITLAB_PERSONAL_ACCESS_TOKEN%22%3A%22%24%7Binput%3Agitlab_token%7D%22%2C%22GITLAB_API_URL%22%3A%22%24%7Binput%3Agitlab_url%7D%22%7D%7D>) [![Install with Docker in VS Code Insiders](https://img.shields.io/badge/VS_Code_Insiders-Docker-24bfa5?style=flat-square&logo=visualstudiocode&logoColor=white)](<https://insiders.vscode.dev/redirect/mcp/install?name=gitlab&inputs=%5B%7B%22type%22%3A%22promptString%22%2C%22id%22%3A%22gitlab_token%22%2C%22description%22%3A%22GitLab%20Personal%20Access%20Token%22%2C%22password%22%3Atrue%7D%2C%7B%22type%22%3A%22promptString%22%2C%22id%22%3A%22gitlab_url%22%2C%22description%22%3A%22GitLab%20API%20URL%20(optional%2C%20default%3A%20https%3A%2F%2Fgitlab.com%2Fapi%2Fv4)%22%2C%22default%22%3A%22https%3A%2F%2Fgitlab.com%2Fapi%2Fv4%22%7D%5D&config=%7B%22command%22%3A%22docker%22%2C%22args%22%3A%5B%22run%22%2C%22--rm%22%2C%22-i%22%2C%22mcp%2Fgitlab%22%5D%2C%22env%22%3A%7B%22GITLAB_PERSONAL_ACCESS_TOKEN%22%3A%22%24%7Binput%3Agitlab_token%7D%22%2C%22GITLAB_API_URL%22%3A%22%24%7Binput%3Agitlab_url%7D%22%7D%7D&quality=insiders>)

For manual installation, add the following JSON block to your User Settings (JSON) file in VS Code. You can do this by pressing `Ctrl + Shift + P` and typing `Preferences: Open User Settings (JSON)`.

Optionally, you can add it to a file called `.vscode/mcp.json` in your workspace. This will allow you to share the configuration with others.

> Note that the `mcp` key is not needed in the `.vscode/mcp.json` file.

#### Docker

```json
{
  "mcp": {
    "inputs": [
      {
        "type": "promptString",
        "id": "gitlab_token",
        "description": "GitLab Personal Access Token",
        "password": true
      },
      {
        "type": "promptString",
        "id": "gitlab_url",
        "description": "GitLab API URL (optional)",
        "default": "https://gitlab.com/api/v4"
      }
    ],
    "servers": {
      "gitlab": {
        "command": "docker",
        "args": ["run", "--rm", "-i", "mcp/gitlab"],
        "env": {
          "GITLAB_PERSONAL_ACCESS_TOKEN": "${input:gitlab_token}",
          "GITLAB_API_URL": "${input:gitlab_url}"
        }
      }
    }
  }
}
```

#### NPX

```json
{
  "mcp": {
    "inputs": [
      {
        "type": "promptString",
        "id": "gitlab_token",
        "description": "GitLab Personal Access Token",
        "password": true
      },
      {
        "type": "promptString",
        "id": "gitlab_url",
        "description": "GitLab API URL (optional)",
        "default": "https://gitlab.com/api/v4"
      }
    ],
    "servers": {
      "gitlab": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-gitlab"],
        "env": {
          "GITLAB_PERSONAL_ACCESS_TOKEN": "${input:gitlab_token}",
          "GITLAB_API_URL": "${input:gitlab_url}"
        }
      }
    }
  }
}
```

## Build

Docker build:

```bash
docker build -t vonwig/gitlab:mcp -f src/gitlab/Dockerfile .
```

## Environment Variables

- `GITLAB_PERSONAL_ACCESS_TOKEN`: Your GitLab personal access token (required)
- `GITLAB_API_URL`: Base URL for GitLab API (optional, defaults to `https://gitlab.com/api/v4`)

## License

This MCP server is licensed under the MIT License. This means you are free to use, modify, and distribute the software, subject to the terms and conditions of the MIT License. For more details, please see the LICENSE file in the project repository.
