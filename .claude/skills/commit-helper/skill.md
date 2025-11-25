---
name: commit-helper
description: This skill helps with git commit operations.
---

# commit-helper

This skill helps with git commit operations.

## When to activate

This skill activates when the user's prompt mentions:
- Creating commits
- Git commit operations
- Staging and committing changes

## What this skill does

When activated, this skill guides Claude to:
1. Review uncommitted changes with `git status` and `git diff`
2. Create meaningful commit messages following conventional commit format
3. Stage appropriate files
4. Create the commit with proper attribution
5. Verify the commit was created successfully

## Example prompts that activate this skill

- "commit my changes"
- "create a commit with these changes"
- "git commit the updates"
- "stage and commit the new files"
