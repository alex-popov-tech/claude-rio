#!/bin/bash
set -euo pipefail

# Determine hook directory (where this script lives)
HOOK_DIR="$(cd "$(dirname "$0")" && pwd)"

# Determine skill root directories
PROJECT_SKILLS="${CLAUDE_PROJECT_DIR:-$(pwd)}/.claude/skills"
USER_SKILLS="${HOME}/.claude/skills"

# Find all Stop.matcher.js files in both project and user skills
# Using -L to follow symlinks (user skills may be symlinked from dotfiles)
# Using -print to output paths, suppressing errors for non-existent directories
MATCHERS=$(find -L "$PROJECT_SKILLS" "$USER_SKILLS" \
  -type f -name "Stop.matcher.js" -print 2>/dev/null || true)

# Early exit if no matchers found - no need to launch Node.js
if [ -z "$MATCHERS" ]; then
  exit 0
fi

# Pass matcher paths via environment variable to Node.js handler
# Node.js will read JSON payload from stdin as before
export MATCHER_PATHS="$MATCHERS"
exec node "$HOOK_DIR/handler.js"
