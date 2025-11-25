# ⚠️  DO NOT EDIT - Managed by better-hooks
#
# This file is installed and maintained by better-hooks.
# Manual changes will be lost when better-hooks is updated.
#
# To customize behavior, create skills in .claude/skills/
# See: .claude/docs/CREATING_SKILLS.md

# PowerShell strict mode
$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

# Determine hook directory (where this script lives)
$HOOK_DIR = Split-Path -Parent $MyInvocation.MyCommand.Definition

# Determine skill and agent root directories
if ($env:CLAUDE_PROJECT_DIR) {
    $PROJECT_SKILLS = Join-Path $env:CLAUDE_PROJECT_DIR ".claude\skills"
    $PROJECT_AGENTS = Join-Path $env:CLAUDE_PROJECT_DIR ".claude\agents"
} else {
    $PROJECT_SKILLS = Join-Path (Get-Location) ".claude\skills"
    $PROJECT_AGENTS = Join-Path (Get-Location) ".claude\agents"
}
$USER_SKILLS = Join-Path $env:USERPROFILE ".claude\skills"
$USER_AGENTS = Join-Path $env:USERPROFILE ".claude\agents"

# Find all UserPromptSubmit.matcher.js files in both skills and agents directories
# Get-ChildItem with -ErrorAction SilentlyContinue to suppress errors for non-existent directories
$MATCHERS = @()

if (Test-Path $PROJECT_SKILLS) {
    $MATCHERS += Get-ChildItem -Path $PROJECT_SKILLS -Recurse -Filter "UserPromptSubmit.matcher.js" -File -ErrorAction SilentlyContinue
}

if (Test-Path $USER_SKILLS) {
    $MATCHERS += Get-ChildItem -Path $USER_SKILLS -Recurse -Filter "UserPromptSubmit.matcher.js" -File -ErrorAction SilentlyContinue
}

if (Test-Path $PROJECT_AGENTS) {
    $MATCHERS += Get-ChildItem -Path $PROJECT_AGENTS -Recurse -Filter "UserPromptSubmit.matcher.js" -File -ErrorAction SilentlyContinue
}

if (Test-Path $USER_AGENTS) {
    $MATCHERS += Get-ChildItem -Path $USER_AGENTS -Recurse -Filter "UserPromptSubmit.matcher.js" -File -ErrorAction SilentlyContinue
}

# Early exit if no matchers found - no need to launch Node.js
if ($MATCHERS.Count -eq 0) {
    exit 0
}

# Pass matcher paths via environment variable to Node.js handler
# Join paths with newline separator (same format as bash version)
$env:MATCHER_PATHS = ($MATCHERS | ForEach-Object { $_.FullName }) -join "`n"

# Execute Node.js handler
# Node.js will read JSON payload from stdin as before
$handlerPath = Join-Path $HOOK_DIR "handler.js"
& node $handlerPath
exit $LASTEXITCODE
