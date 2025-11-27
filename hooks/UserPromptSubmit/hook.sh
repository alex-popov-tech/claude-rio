#!/bin/bash
# ⚠️  DO NOT EDIT - Managed by claude-rio
#
# This file is installed and maintained by claude-rio.
# Manual changes will be lost when claude-rio is updated.
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

# Find all matcher files
# Using -L to follow symlinks (user skills/agents may be symlinked from dotfiles)
#
# Skills and agents have different structures:
# - Skills (subdirectories): .claude/skills/<skill>/rio/UserPromptSubmit.matcher.cjs
# - Agents (.md files): .claude/agents/<agent>.rio.matcher.cjs (sibling to .md file)

# Find skill matchers (in rio subdirectories)
SKILL_MATCHERS=$(find -L "$PROJECT_SKILLS" "$USER_SKILLS" \
  -type f -path "*/rio/UserPromptSubmit.matcher.cjs" -print 2>/dev/null || true)

# Find agent matchers (directly in agents directory, named *.rio.matcher.cjs)
AGENT_MATCHERS=$(find -L "$PROJECT_AGENTS" "$USER_AGENTS" \
  -maxdepth 1 -type f -name "*.rio.matcher.cjs" -print 2>/dev/null || true)

# Combine both sets of matchers
MATCHERS="${SKILL_MATCHERS}
${AGENT_MATCHERS}"
# Remove empty lines
MATCHERS=$(echo "$MATCHERS" | grep -v '^$' || true)

# Early exit if no matchers found - no need to launch Node.js
if [ -z "$MATCHERS" ]; then
  exit 0
fi

# Pass matcher paths via environment variable to Node.js handler
# Node.js will read JSON payload from stdin as before
export MATCHER_PATHS="$MATCHERS"
exec node "$HOOK_DIR/handler.cjs"
