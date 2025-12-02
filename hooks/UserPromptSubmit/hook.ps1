# ⚠️  DO NOT EDIT - Managed by claude-rio
#
# This file is installed and maintained by claude-rio.
# Manual changes will be lost when claude-rio is updated.
#
# To customize behavior, create skills in .claude/skills/
# See: .claude/docs/CREATING_SKILLS.md

# PowerShell strict mode
$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

# Determine hook directory (where this script lives)
$HOOK_DIR = Split-Path -Parent $MyInvocation.MyCommand.Definition

# Determine skill, agent, and command root directories
if ($env:CLAUDE_PROJECT_DIR) {
    $PROJECT_SKILLS = Join-Path $env:CLAUDE_PROJECT_DIR ".claude\skills"
    $PROJECT_AGENTS = Join-Path $env:CLAUDE_PROJECT_DIR ".claude\agents"
    $PROJECT_COMMANDS = Join-Path $env:CLAUDE_PROJECT_DIR ".claude\commands"
} else {
    $PROJECT_SKILLS = Join-Path (Get-Location) ".claude\skills"
    $PROJECT_AGENTS = Join-Path (Get-Location) ".claude\agents"
    $PROJECT_COMMANDS = Join-Path (Get-Location) ".claude\commands"
}
$USER_SKILLS = Join-Path $env:USERPROFILE ".claude\skills"
$USER_AGENTS = Join-Path $env:USERPROFILE ".claude\agents"
$USER_COMMANDS = Join-Path $env:USERPROFILE ".claude\commands"

# Find all matcher files in skills, agents, and commands directories
# Get-ChildItem with -ErrorAction SilentlyContinue to suppress errors for non-existent directories
$MATCHERS = @()

# Skills: search recursively for UserPromptSubmit.rio.matcher.cjs in rio subdirectories
if (Test-Path $PROJECT_SKILLS) {
    $MATCHERS += Get-ChildItem -Path $PROJECT_SKILLS -Recurse -Filter "UserPromptSubmit.rio.matcher.cjs" -File -ErrorAction SilentlyContinue
}

if (Test-Path $USER_SKILLS) {
    $MATCHERS += Get-ChildItem -Path $USER_SKILLS -Recurse -Filter "UserPromptSubmit.rio.matcher.cjs" -File -ErrorAction SilentlyContinue
}

# Agents: search directly in agents directory for *.rio.matcher.cjs
if (Test-Path $PROJECT_AGENTS) {
    $MATCHERS += Get-ChildItem -Path $PROJECT_AGENTS -Filter "*.rio.matcher.cjs" -File -ErrorAction SilentlyContinue
}

if (Test-Path $USER_AGENTS) {
    $MATCHERS += Get-ChildItem -Path $USER_AGENTS -Filter "*.rio.matcher.cjs" -File -ErrorAction SilentlyContinue
}

# Commands: search directly in commands directory for *.rio.matcher.cjs
if (Test-Path $PROJECT_COMMANDS) {
    $MATCHERS += Get-ChildItem -Path $PROJECT_COMMANDS -Filter "*.rio.matcher.cjs" -File -ErrorAction SilentlyContinue
}

if (Test-Path $USER_COMMANDS) {
    $MATCHERS += Get-ChildItem -Path $USER_COMMANDS -Filter "*.rio.matcher.cjs" -File -ErrorAction SilentlyContinue
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
$handlerPath = Join-Path $HOOK_DIR "handler.cjs"
& node $handlerPath
exit $LASTEXITCODE
