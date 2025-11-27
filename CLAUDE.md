# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Purpose

claude-rio is a hook framework for Claude Code CLI that improves skill and agent activation through deterministic keyword matching. It provides explicit suggestions to Claude about relevant skills/agents based on user prompts, significantly increasing activation probability.

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
│   ├── commands/                  # CLI commands (setup)
│   └── utils/                     # CLI utilities (scanning, validation, prompts)
├── hooks/                         # Hook framework (distributed)
│   └── UserPromptSubmit/
│       ├── hook.sh                # Shell wrapper (finds matchers)
│       ├── handler.cjs            # Node.js handler (executes matchers)
│       ├── types.cjs              # JSDoc type definitions
│       ├── validations.cjs        # Payload and result validation (inlined)
│       └── formatter.cjs          # Output formatting
├── matchers/                      # Universal matcher template
│   └── UserPromptSubmit.rio.matcher.cjs
├── examples/                      # Example matcher patterns
│   ├── keyword/
│   ├── typo-tolerant/
│   ├── file-based/
│   ├── history-aware/
│   └── config-based/
├── package.json                   # Package metadata
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

Matchers are JavaScript functions that determine skill/agent relevance:

- **Input:** Context object with `{prompt, cwd, transcriptPath, sessionId, permissionMode, meta, transcript}`
- **Output:** `{version: "1.0", relevant: boolean, priority: string, relevance: string}`
- **Validation:** All fields are MANDATORY (no undefined/null allowed)
- **Types:** Sync or async (use async only for conversation history)

**Priority levels:** "critical" | "high" | "medium" | "low"
**Relevance levels:** "high" | "medium" | "low"

### Skills vs Agents

Per Claude Code documentation, skills and agents have **different structures**:

**Skills** (subdirectories with SKILL.md):
- Location: `.claude/skills/<skill-name>/SKILL.md`
- Matcher: `.claude/skills/<skill-name>/rio/UserPromptSubmit.matcher.cjs`
- Purpose: Deterministic workflows (build, test, lint)

**Agents** (individual .md files):
- Location: `.claude/agents/<agent-name>.md`
- Matcher: `.claude/agents/<agent-name>.rio.matcher.cjs` (sibling to .md file)
- Purpose: Complex reasoning tasks (review, refactor, analyze)

## Development Guidelines

### Adding Examples

Examples live in `examples/<pattern-name>/UserPromptSubmit.rio.matcher.cjs`. Each example should:
- Be a complete, working matcher (not a template with TODOs)
- Include comprehensive inline comments
- Demonstrate a specific matching pattern
- Include performance notes and usage tips

### Modifying CLI Commands

CLI commands are in `cli/commands/`. Key command:
- `setup.js` - Unified command that installs framework and/or generates matchers using Claude AI (Haiku model)

### Testing Hooks

Test hooks manually with payloads:

```bash
# Test UserPromptSubmit hook
bash hooks/UserPromptSubmit/hook.sh < test-payloads/user-prompt-submit.json
```

### Validating Matchers

Use the CLI validator:

```bash
# Validate a specific matcher
node cli/utils/matcher-validator.js path/to/matcher.js
```

## Common Tasks

### Running CLI Commands

```bash
# Development mode (from repo)
node cli/index.js setup
node cli/index.js setup --skills --agents

# As installed package
npx claude-rio setup
npx claude-rio setup --user
npx claude-rio setup --skills --agents
npx claude-rio setup --user --skills --agents
```

### Testing Hook Discovery

```bash
# Test with no matchers (should exit immediately)
mv .claude/skills .claude/skills.bak
bash hooks/UserPromptSubmit/hook.sh < test-payloads/user-prompt-submit.json
# Should output nothing and exit with code 0

# Test with matchers (should execute)
mv .claude/skills.bak .claude/skills
bash hooks/UserPromptSubmit/hook.sh < test-payloads/user-prompt-submit.json
# Should output JSON with additionalContext
```

### Adding a New Hook

1. Create directory: `hooks/<HookEventName>/`
2. Create `hook.sh` (shell wrapper with matcher discovery)
3. Create `handler.cjs` (Node.js matcher executor)
4. Create `types.cjs`, `validations.cjs`, `formatter.cjs`
5. Update `.claude/settings.json` with hook configuration

Follow the pattern established by `UserPromptSubmit/`.

## Important Notes

- **Matcher fields are mandatory:** version, relevant, priority, relevance (no undefined/null)
- **Validation is strict:** Both CLI and runtime validation enforce all fields
- **Shell wrappers are OS-specific:** `.sh` for Unix, `.ps1` for Windows
- **Template references:** CLI uses `matchers/UserPromptSubmit.rio.matcher.cjs` as template
- **CommonJS extension:** All hook files (`.cjs`) and matchers (`.rio.matcher.cjs`) use the `.cjs` extension to ensure CommonJS compatibility regardless of host project's `package.json` "type" setting. This prevents ES module errors when hooks are installed in projects with `"type": "module"`.
- **Auto-generation:** `setup --skills --agents` uses Claude Haiku for fast, cost-effective generation

## Reference Files

- `hooks.pdf` - Official Claude Code hook specification
- `examples/` - Working matcher patterns with extensive documentation
- `README.md` - User-facing documentation
