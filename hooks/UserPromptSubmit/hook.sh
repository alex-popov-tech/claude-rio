#!/bin/bash
# ⚠️  DO NOT EDIT - Managed by better-hooks
#
# This file is installed and maintained by better-hooks.
# Manual changes will be lost when better-hooks is updated.
#
# To customize behavior, create skills in .claude/skills/
# See: .claude/docs/CREATING_SKILLS.md

set -euo pipefail

# Determine hook directory (where this script lives)
HOOK_DIR="$(cd "$(dirname "$0")" && pwd)"

# Determine skill and agent root directories
PROJECT_SKILLS="${CLAUDE_PROJECT_DIR:-$(pwd)}/.claude/skills"
USER_SKILLS="${HOME}/.claude/skills"
PROJECT_AGENTS="${CLAUDE_PROJECT_DIR:-$(pwd)}/.claude/agents"
USER_AGENTS="${HOME}/.claude/agents"

# Find all UserPromptSubmit.matcher.js files in better-hooks subdirectories
# Using -L to follow symlinks (user skills/agents may be symlinked from dotfiles)
# Using -path to ensure matchers are in better-hooks namespace
MATCHERS=$(find -L "$PROJECT_SKILLS" "$USER_SKILLS" "$PROJECT_AGENTS" "$USER_AGENTS" \
  -type f -path "*/better-hooks/UserPromptSubmit.matcher.js" -print 2>/dev/null || true)

# Early exit if no matchers found - no need to launch Node.js
if [ -z "$MATCHERS" ]; then
  exit 0
fi

# Pass matcher paths via environment variable to Node.js handler
# Node.js will read JSON payload from stdin as before
export MATCHER_PATHS="$MATCHERS"
exec node "$HOOK_DIR/handler.js"
