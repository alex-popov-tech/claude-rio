# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Purpose

claude-rio is a hook framework for Claude Code CLI that improves skill, agent, and command activation through deterministic keyword matching. It provides explicit suggestions to Claude about relevant skills/agents/commands based on user prompts, significantly increasing activation probability.

## Technology Stack

- **Languages:** Bash (shell wrappers), JavaScript/Node.js (handlers)
- **Architecture:** Two-tier system (shell preprocessing + Node.js execution)
- **Type System:** JSDoc annotations
- **Dependencies:** chalk, commander, fs-extra, ora (CLI only)
- **Runtime:** Node.js >= 18.0.0

## Project Structure

```
claude-rio/
├── cli/                           # Command-line interface
│   ├── index.js                   # Main CLI entry point
│   ├── commands/
│   │   ├── setup.js               # Install hook framework
│   │   ├── generate-matchers.js   # Generate matchers using Claude Haiku
│   │   └── remove.js              # Uninstall framework + all matchers
│   └── utils/
│       ├── claude-checker.js      # Check if Claude CLI is available
│       ├── claude-generator.js    # Generate matchers using Claude Haiku
│       ├── copy-templates.js      # Copy hooks to .claude directory
│       ├── matcher-validator.js   # Validate matcher structure and fields
│       ├── platform.js            # OS detection (Windows/Unix)
│       ├── prompt-builder.js      # Build prompts for Claude to generate matchers
│       └── skill-scanner.js       # Scan .claude for skills/agents/commands
├── hooks/                         # Hook framework (distributed to .claude)
│   ├── UserPromptSubmit/
│   │   ├── hook.sh                # Shell wrapper (finds matchers) - Unix
│   │   ├── hook.ps1               # Shell wrapper (finds matchers) - Windows
│   │   ├── handler.cjs            # Node.js handler (executes matchers)
│   │   ├── types.cjs              # JSDoc type definitions
│   │   ├── validations.cjs        # Payload and result validation
│   │   └── formatter.cjs          # Output formatting
│   └── utils/                     # Shared utilities for hooks
│       ├── index.cjs              # Central export point
│       ├── io.cjs                 # stdin/stdout operations
│       ├── logger.cjs             # File-based logging
│       ├── result.cjs             # Result-style error handling
│       ├── transcript.cjs         # Conversation history utilities
│       └── validations.cjs        # Validation helpers
├── matchers/                      # Universal matcher template
│   └── UserPromptSubmit.rio.matcher.cjs  # Template used by setup command
├── examples/                      # Example matcher patterns
│   ├── keyword/UserPromptSubmit.rio.matcher.cjs
│   ├── typo-tolerant/UserPromptSubmit.rio.matcher.cjs
│   ├── file-based/UserPromptSubmit.rio.matcher.cjs
│   ├── history-aware/UserPromptSubmit.rio.matcher.cjs
│   └── config-based/UserPromptSubmit.rio.matcher.cjs
├── tests/                         # Test suites
│   ├── docker/                    # Docker-based integration tests
│   └── haiku-visual/              # Haiku generation visual tests
├── package.json                   # Package metadata
├── CHANGELOG.md                   # Version history
├── README.md                      # User-facing documentation
└── CLAUDE.md                      # This file
```

## Key Concepts

### Two-Tier Architecture

The system uses a **shell-first approach** to minimize overhead:

1. **Shell wrapper (`hook.sh`)** runs first
   - Uses `find` command to locate matcher files
   - Searches skills: `.claude/skills/*/rio/UserPromptSubmit.matcher.cjs`
   - Searches agents: `.claude/agents/*.rio.matcher.cjs`
   - Searches commands: `.claude/commands/*.rio.matcher.cjs`
   - If no matchers found → exits immediately (~10-20ms)
   - If matchers found → passes paths to Node.js via `MATCHER_PATHS` env var

2. **Node.js handler (`handler.cjs`)** only executes when matchers exist
   - Reads matcher paths from environment
   - Loads and executes each matcher function
   - Validates matcher results
   - Formats output as JSON for Claude Code
   - Total time: ~50-100ms

**Performance:** ~70% faster when no matchers exist (most common case).

### Matchers

Matchers are JavaScript functions that determine skill/agent/command relevance:

- **Input:** Context object with `{prompt, cwd, transcriptPath, sessionId, permissionMode, meta, transcript}`
- **Output:** `{version: "2.0", matchCount: number, type: string}`
- **Validation:** All fields are MANDATORY (no undefined/null allowed)
- **Types:** Sync or async (use async only for conversation history)
- **Scoring:** Handler calculates `score = min(matchCount, 10) / maxMatchCount`

**Required Output Fields:**
- `version`: Always "2.0"
- `matchCount`: Number of keyword matches (0+, capped at 10 for scoring)
- `type`: "skill" | "agent" | "command" - Type of matcher

**How Scoring Works:**
1. Matchers count keyword matches and return `matchCount`
2. Handler caps each `matchCount` at 10 to prevent keyword inflation
3. Handler calculates relative scores: `score = cappedCount / maxMatchCount`
4. Items with `matchCount > 0` are ranked by score (highest first)
5. Items with `matchCount = 0` are filtered out

### Skills vs Agents vs Commands

Per Claude Code documentation, skills, agents, and commands have **different structures**:

**Skills** (subdirectories with SKILL.md):
- Definition: `.claude/skills/<skill-name>/SKILL.md`
- Matcher: `.claude/skills/<skill-name>/rio/UserPromptSubmit.rio.matcher.cjs`
- Structure: Skills are directories containing SKILL.md and optional code
- Purpose: Deterministic workflows (build, test, lint)
- Discovery: Hook searches `.claude/skills/*/rio/UserPromptSubmit.rio.matcher.cjs`
- Tool: `Skill tool, skill="<name>"`

**Agents** (individual .md files):
- Definition: `.claude/agents/<agent-name>.md`
- Matcher: `.claude/agents/<agent-name>.rio.matcher.cjs` (sibling to .md file)
- Structure: Agents are single .md files with sibling matcher files
- Purpose: Complex reasoning tasks (review, refactor, analyze)
- Discovery: Hook searches `.claude/agents/*.rio.matcher.cjs`
- Tool: `Task tool, subagent_type="<name>"`

**Commands** (individual .md files):
- Definition: `.claude/commands/<command-name>.md`
- Matcher: `.claude/commands/<command-name>.rio.matcher.cjs` (sibling to .md file)
- Structure: Commands are single .md files with sibling matcher files
- Purpose: Slash commands for user-invoked actions (deploy, format, test)
- Discovery: Hook searches `.claude/commands/*.rio.matcher.cjs`
- Tool: `SlashCommand tool, command="/<name>"`

## Development Guidelines

### Adding Examples

Examples live in `examples/<pattern-name>/UserPromptSubmit.rio.matcher.cjs`. Each example should:
- Be a complete, working matcher (not a template with TODOs)
- Include comprehensive inline comments
- Demonstrate a specific matching pattern
- Include performance notes and usage tips

### Modifying CLI Commands

CLI commands are in `cli/commands/`:
- `setup.js` - Install hook framework only
- `generate-matchers.js` - Generate matchers for all skills/agents/commands using Claude Haiku
- `remove.js` - Uninstall framework and all matchers

**CLI Utilities** in `cli/utils/`:
- `claude-checker.js` - Verify Claude CLI availability
- `claude-generator.js` - Parallel matcher generation with progress tracking
- `copy-templates.js` - Template copying and settings.json merging
- `matcher-validator.js` - Validate matcher structure and required fields
- `platform.js` - OS detection for cross-platform support
- `prompt-builder.js` - Generate prompts for Claude to create matchers
- `skill-scanner.js` - Scan for skills/agents/commands needing matchers

### Testing Hooks

Test hooks manually with payloads:

```bash
# Test UserPromptSubmit hook
bash hooks/UserPromptSubmit/hook.sh < test-payloads/user-prompt-submit.json
```

### Validating Matchers

Use the CLI validator to check matcher structure:

```bash
# Validate a specific matcher
node cli/utils/matcher-validator.js .claude/skills/my-skill/rio/UserPromptSubmit.rio.matcher.cjs

# Expected output on success:
# ✓ Matcher is valid
# ✓ All required fields present: version, relevant, priority, type
# ✓ Field types correct

# Example validation errors:
# ✗ Missing required field: type
# ✗ Invalid priority: must be critical|high|medium|low, got "important"
```

## Common Tasks

### Running CLI Commands

```bash
# Development mode (from repo)
node cli/index.js setup                        # Install framework (project-level)
node cli/index.js setup --user                 # Install framework (user-level)
node cli/index.js generate-matchers            # Generate matchers (project-level)
node cli/index.js generate-matchers --user     # Generate matchers (user-level)
node cli/index.js remove                       # Remove framework + all matchers
node cli/index.js remove --user                # Remove user-level framework + matchers

# As installed package
npx claude-rio setup                           # Install framework (project-level)
npx claude-rio setup --user                    # Install framework (user-level)
npx claude-rio generate-matchers               # Generate matchers (project-level)
npx claude-rio generate-matchers --user        # Generate matchers (user-level)
npx claude-rio remove                          # Remove framework + all matchers
npx claude-rio remove --user                   # Remove user-level framework + matchers
```

### Testing Hooks Manually

Create a test payload file (`test-payload.json`):
```json
{
  "prompt": "your test prompt here",
  "cwd": "/path/to/project",
  "transcriptPath": "/path/to/transcript.jsonl",
  "sessionId": "test-session",
  "permissionMode": "ask"
}
```

Test the hook:
```bash
# Test UserPromptSubmit hook directly
bash hooks/UserPromptSubmit/hook.sh < test-payload.json

# Should output JSON like:
# {"version":"1.0","additionalContext":[{"type":"skill","name":"my-skill",...}]}
```

Performance testing:
```bash
# Test with no matchers (should exit in ~10-20ms)
mv .claude/skills .claude/skills.bak
time bash hooks/UserPromptSubmit/hook.sh < test-payload.json

# Test with matchers (should complete in ~50-100ms)
mv .claude/skills.bak .claude/skills
time bash hooks/UserPromptSubmit/hook.sh < test-payload.json
```

### Adding a New Hook Type

To add support for a new Claude Code hook event:

1. Create directory: `hooks/<HookEventName>/`
2. Create shell wrappers with matcher discovery:
   - `hook.sh` (Unix/macOS)
   - `hook.ps1` (Windows PowerShell)
3. Create Node.js components:
   - `handler.cjs` - Main matcher executor
   - `types.cjs` - JSDoc type definitions for the hook
   - `validations.cjs` - Payload/result validation
   - `formatter.cjs` - Format output for Claude Code
4. Update `cli/utils/copy-templates.js` to copy new hook files
5. Update template in `copy-templates.js` to register hook in settings.json

**Follow the pattern from `UserPromptSubmit/`** - it demonstrates the complete two-tier architecture.

## Important Notes

### Matcher Requirements
- **All fields are mandatory:** `version`, `matchCount`, `type` (no undefined/null values allowed)
- **Strict validation:** Both CLI (`matcher-validator.js`) and runtime (`validations.cjs`) enforce field presence and types
- **Return object must be synchronous or Promise-wrapped** for async matchers

### File Naming Conventions
- **Hook files:** `.cjs` extension (e.g., `handler.cjs`, `types.cjs`)
- **Skill matchers:** `UserPromptSubmit.rio.matcher.cjs` in `<skill-dir>/rio/` subdirectory
- **Agent matchers:** `<agent-name>.rio.matcher.cjs` sibling to `<agent-name>.md`
- **Command matchers:** `<command-name>.rio.matcher.cjs` sibling to `<command-name>.md`
- **Template:** `matchers/UserPromptSubmit.rio.matcher.cjs` used by `setup` command

### CommonJS Compatibility
All hook files and matchers use `.cjs` extension to ensure CommonJS compatibility regardless of the host project's `package.json` `"type"` setting. This prevents ES module errors when hooks are installed in projects with `"type": "module"`.

### Cross-Platform Support
- **Unix/macOS:** `hook.sh` (bash)
- **Windows:** `hook.ps1` (PowerShell)
- **OS detection:** Automatic via `cli/utils/platform.js`

### Performance Characteristics
- **No matchers present:** ~10-20ms (shell exits immediately)
- **With matchers:** ~50-100ms (shell + Node.js execution)
- **70% faster** than pure Node.js approach when no matchers exist

### AI-Powered Generation
- **Model:** Claude Haiku (fast and cost-effective)
- **Concurrency:** 5 parallel generations
- **Timeout:** 60s per matcher
- **Validation:** All generated matchers are validated before being saved
- **Command:** `generate-matchers` (generates for all skills, agents, and commands)

## Migration from v1.0 to v2.0

**Breaking Change:** The matcher schema has changed from priority-based to match-count-based scoring.

**Old Schema (v1.0):**
```javascript
return {
  version: '1.0',
  relevant: boolean,
  priority: 'critical' | 'high' | 'medium' | 'low',
  type: 'skill' | 'agent'
};
```

**New Schema (v2.0):**
```javascript
return {
  version: '2.0',
  matchCount: number,  // 0+, count of keyword matches
  type: 'skill' | 'agent' | 'command'
};
```

**Migration Steps:**

1. **Update version:** Change `'1.0'` to `'2.0'`
2. **Replace `relevant` + `priority` with `matchCount`:**
   - Change `.some(kw => prompt.includes(kw))` to `.filter(kw => prompt.includes(kw)).length`
   - Remove priority logic
3. **Keep `type` field:** No change needed

**Example Migration:**

Before (v1.0):
```javascript
const keywords = ['docker', 'container', 'dockerfile'];
const hasKeyword = keywords.some(kw => prompt.includes(kw));
return {
  version: '1.0',
  relevant: hasKeyword,
  priority: hasKeyword ? 'medium' : 'low',
  type: 'skill'
};
```

After (v2.0):
```javascript
const keywords = ['docker', 'container', 'dockerfile'];
const matchCount = keywords.filter(kw => prompt.includes(kw)).length;
return {
  version: '2.0',
  matchCount: matchCount,
  type: 'skill'
};
```

**Regenerating Matchers:**
The easiest migration path is to regenerate matchers using the `generate-matchers` command:
```bash
npx claude-rio generate-matchers
```

This will use Claude Haiku to generate v2.0-compatible matchers for all skills, agents, and commands.

## Reference Files & Resources

- **`README.md`** - User-facing documentation and quickstart guide
- **`CHANGELOG.md`** - Version history and migration guides
- **`examples/`** - Working matcher patterns with extensive inline documentation:
  - `keyword/` - Simple keyword matching
  - `typo-tolerant/` - Fuzzy matching with Levenshtein distance
  - `file-based/` - File system pattern detection
  - `history-aware/` - Conversation transcript analysis (async)
  - `config-based/` - Configuration file-driven matching
- **`matchers/UserPromptSubmit.rio.matcher.cjs`** - Universal template used by CLI
- **`tests/`** - Test suites:
  - `docker/` - Cross-platform integration tests
  - `haiku-visual/` - Visual verification of AI-generated matchers

## Debugging

### Log Files
Hooks write debug logs to `hooks/logs/`:
- `hook-UserPromptSubmit-handler.log` - Handler execution logs
- Logs include: matcher paths found, execution results, validation errors
- **Note:** Logs are NOT distributed with the package (in `.gitignore`)

### Common Issues

**Matcher not triggering:**
1. Check matcher exists: `find .claude -name "*.rio.matcher.cjs"`
2. Validate matcher: `node cli/utils/matcher-validator.js <path>`
3. Check hook logs: `cat hooks/logs/hook-UserPromptSubmit-handler.log`
4. Test hook directly: `bash hooks/UserPromptSubmit/hook.sh < test-payload.json`

**Validation errors:**
- Ensure all fields are present: `version`, `matchCount`, `type`
- Check field types: strings for `version` and `type`, number for `matchCount`
- Verify enum values: `type` (skill/agent/command)

**Setup command fails:**
- Verify Claude CLI installed: `which claude` or `claude --version`
- Check .claude directory exists: `ls -la .claude`
- Ensure proper permissions: `ls -l .claude/hooks/rio/`

## Architecture Decisions

### Why Shell-First?
The two-tier architecture (shell → Node.js) optimizes for the common case where no matchers exist. Shell's `find` command is extremely fast (~10ms) and avoids Node.js startup overhead (~40-60ms) when unnecessary.

### Why .cjs Extension?
CommonJS compatibility ensures hooks work in any project regardless of `package.json` `"type"` setting. The `.cjs` extension is explicit and prevents module resolution errors.

### Why Separate Skill/Agent/Command Discovery?
Skills, agents, and commands have different structures (directories vs files), so separate `find` commands with appropriate patterns ensure correct discovery:
- Skills: `.claude/skills/*/rio/UserPromptSubmit.rio.matcher.cjs`
- Agents: `.claude/agents/*.rio.matcher.cjs`
- Commands: `.claude/commands/*.rio.matcher.cjs`

### Why Claude Haiku for Generation?
Haiku provides the best balance of speed, cost, and quality for simple keyword extraction tasks. Matcher generation is a structured, deterministic task that doesn't require Sonnet/Opus reasoning capabilities.
