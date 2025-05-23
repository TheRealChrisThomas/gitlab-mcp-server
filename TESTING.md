# Manual Testing Guide for GitLab MCP Server

This document provides examples for manually testing the GitLab MCP server functionality in Cursor.

## Prerequisites

1. You need a GitLab Personal Access Token with `api` scope
2. You need access to a GitLab project (can be a test project)
3. The MCP server should be configured in Cursor

## Test Examples

### 1. Basic Repository Operations

**Search for repositories:**

```
Search for GitLab projects containing "test"
```

**Get file contents:**

```
Get the contents of README.md from project ID "12345"
```

### 2. Label Management Testing

**List all labels:**

```
List all labels in project "your-username/your-project"
```

**Create a new label:**

```
Create a label called "bug" with color "#ff0000" and description "Bug reports" in project "your-username/your-project"
```

**Update a label:**

```
Update the label "bug" in project "your-username/your-project" to have color "#cc0000" and new description "Critical bug reports"
```

**Delete a label:**

```
Delete the label "bug" from project "your-username/your-project"
```

### 3. Milestone Management Testing

**List all milestones:**

```
List all active milestones in project "your-username/your-project"
```

**Create a milestone:**

```
Create a milestone called "Version 1.0" with description "First major release" and due date "2024-12-31" in project "your-username/your-project"
```

**Update a milestone:**

```
Update milestone ID 123 in project "your-username/your-project" to change the title to "Version 1.0.1" and due date to "2025-01-15"
```

**Close a milestone:**

```
Close milestone ID 123 in project "your-username/your-project"
```

### 4. Issue and Merge Request Testing

**Create an issue with labels and milestone:**

```
Create an issue titled "Test issue" with description "This is a test issue" in project "your-username/your-project", assign labels ["bug", "urgent"] and milestone ID 123
```

**Create a merge request:**

```
Create a merge request titled "Test MR" from branch "feature-branch" to "main" in project "your-username/your-project"
```

### 5. File Operations

**Create/update a file:**

```
Create a file called "test.txt" with content "Hello World" in the main branch of project "your-username/your-project" with commit message "Add test file"
```

**Push multiple files:**

```
Push files to project "your-username/your-project" in branch "main":
- file1.txt with content "File 1 content"
- file2.txt with content "File 2 content"
with commit message "Add multiple test files"
```

## Testing Workflow

1. **Setup**: Make sure you have your GitLab token ready
2. **Start Simple**: Begin with `list_labels` or `search_repositories` to verify connection
3. **Test CRUD Operations**:
   - Create → List → Update → Delete for both labels and milestones
4. **Test Integration**: Create issues/MRs that use the labels and milestones you created
5. **Error Testing**: Try invalid project IDs, non-existent labels, etc.

## Expected Responses

- **Success**: JSON responses with the created/updated/retrieved objects
- **Errors**: Clear error messages explaining what went wrong

## Tips for Testing in Cursor

1. Use specific project IDs or paths (like "username/project-name")
2. Start with read operations before write operations
3. Keep track of what you create so you can clean up afterwards
4. Use the project's web interface to verify changes
5. Test both existing and non-existing resources

## Common Issues

- **Authentication**: Make sure your token has the right permissions
- **Project Access**: Ensure you have access to the project you're testing with
- **Network**: Check if you can access your GitLab instance
- **Permissions**: Some operations require maintainer or owner access
