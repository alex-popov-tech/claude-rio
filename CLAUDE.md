# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This project implements a **skill-based hooks system** for Claude Code CLI with a **two-tier architecture** for optimal performance. It provides:

1. **Shell preprocessing layer** - Fast skill matcher discovery using `find` command
2. **Node.js execution layer** - Matcher evaluation and output formatting
3. **Skill matcher framework** - Automatic skill activation based on hook events
4. **Modular utilities** - Shared code for I/O, logging, validation, and error handling

### Key Architecture Decision

The system uses a **shell-first approach** to minimize overhead:
- **Shell wrapper** (`hook.sh`) runs first, uses `find` to locate matcher files
- **Early exit optimization**: If no matchers found, hook exits immediately (~10-20ms) without starting Node.js
- **Node.js handler** (`handler.js`) only executes when matchers are present (~50-100ms)
- **Result**: ~70% performance improvement when no skills match the hook event

The system is built with **bash shell scripts** and **Node.js with plain JavaScript**, using JSDoc for type documentation.

## Project Structure

```
.claude/
├── settings.json                          # Hook configuration for Claude Code
├── hooks/
│   ├── utils/                            # Shared utilities
│   │   ├── index.js                      # Main exports
│   │   ├── io.js                         # File I/O and stdin reading
│   │   ├── logger.js                     # File-based logging
│   │   ├── result.js                     # Result-style error handling
│   │   ├── validations.js                # Validation utilities
│   │   ├── skills.js                     # Skill matcher execution
│   │   ├── formatter.js                  # Output formatting
│   │   └── transcript.js                 # Conversation history utilities (cached)
│   ├── UserPromptSubmit/
│   │   ├── hook.sh                       # Shell wrapper (finds matchers)
│   │   ├── handler.js                    # Node.js handler (runs matchers)
│   │   ├── types.js                      # JSDoc type definitions
│   │   ├── validations.js                # Payload validation
│   │   └── formatter.js                  # Skill activation formatting
│   └── Stop/
│       ├── hook.sh                       # Shell wrapper (finds matchers)
│       ├── handler.js                    # Node.js handler (runs matchers)
│       ├── types.js                      # JSDoc type definitions
│       └── validations.js                # Payload validation
└── skills/
    ├── demo-hello/
    │   └── UserPromptSubmit.matcher.js   # Example: matches "hello" or "привіт"
    ├── demo-backend/
    │   └── UserPromptSubmit.matcher.js   # Example: matches "backend" keyword
    ├── typescript-compiler/
    │   └── UserPromptSubmit.matcher.js   # Matches TypeScript/build prompts
    ├── test-runner/
    │   └── UserPromptSubmit.matcher.js   # Matches test-related prompts
    ├── commit-helper/
    │   └── UserPromptSubmit.matcher.js   # Matches git commit prompts
    └── cheerleader/
        └── UserPromptSubmit.matcher.js   # Matches encouragement requests
```

## Architecture Overview

### Two-Tier Hook System

The hook system is designed to minimize overhead through a **shell preprocessing layer** that avoids unnecessary Node.js process startup.

#### Execution Flow

```
User Action → Claude Code triggers hook
                     ↓
         [1] Shell Wrapper (hook.sh)
                     ↓
         Uses `find` to search for matchers
         in .claude/skills/ directories
                     ↓
              ┌──────┴──────┐
              ↓             ↓
        No matchers    Matchers found
        found          ↓
        ↓              [2] Node.js Handler (handler.js)
        Exit 0         ↓
        (~10-20ms)     Read MATCHER_PATHS from env
                       Load and execute each matcher
                       Format and output results
                       (~50-100ms)
```

#### Components

1. **Shell Wrapper (`hook.sh`)** - Fast preprocessing layer
   - **Purpose**: Discover matcher files without Node.js overhead
   - **Mechanism**: Uses `find` command to locate `<HookType>.matcher.js` files
   - **Optimization**: Exits immediately if no matchers found (skips Node.js entirely)
   - **Communication**: Passes matcher paths via `MATCHER_PATHS` environment variable
   - **Performance**: ~10-20ms when no matchers exist, ~5ms overhead when matchers exist

2. **Node.js Handler (`handler.js`)** - Matcher execution layer
   - **Purpose**: Execute matcher logic and format output
   - **Trigger**: Only runs if shell wrapper found matchers
   - **Input**: Reads matcher paths from `MATCHER_PATHS` environment variable
   - **Processing**: Loads, validates, and executes each matcher function
   - **Output**: Formats results as JSON for Claude Code
   - **Performance**: ~50-100ms total execution time

#### Why This Architecture?

**Problem**: Node.js startup overhead (~50ms) was incurred on every hook invocation, even when no matchers existed.

**Solution**: Shell preprocessing eliminates Node.js startup when no work needs to be done.

**Benefits**:
- ✅ **70% faster** when no matchers present (most common case)
- ✅ **Simple implementation** using standard `find` command
- ✅ **No dependencies** (no jq, python, or other tools required)
- ✅ **Portable** across bash/zsh/sh environments
- ✅ **Maintainable** clear separation of concerns

**Trade-offs**:
- ⚠️ Adds ~5ms overhead when matchers exist (negligible)
- ⚠️ Two-file structure per hook (hook.sh + handler.js)
- ✅ Worth it: optimization targets the common case (no matches)

### Hook Handlers

Currently implemented hook handlers:

1. **UserPromptSubmit** (`.claude/hooks/UserPromptSubmit/`)
   - **hook.sh**: Finds `UserPromptSubmit.matcher.js` files
   - **handler.js**: Evaluates matchers and outputs skill suggestions
   - Runs when user submits a prompt, before Claude receives it
   - Outputs `additionalContext` with skill suggestions
   - Receives: `prompt`, `cwd`, `transcriptPath`, `sessionId`, `permissionMode`

2. **Stop** (`.claude/hooks/Stop/`)
   - **hook.sh**: Finds `Stop.matcher.js` files
   - **handler.js**: Evaluates matchers (currently basic logging)
   - Runs when Claude agent is about to stop
   - Can force Claude to continue working
   - Receives: `stop_hook_active`, `cwd`, `transcriptPath`, `sessionId`

### Skill Matcher System

**Matcher Contract:**
- Each skill can have hook-specific matcher files: `<HookType>.matcher.js` in `.claude/skills/<skill-name>/`
- For example: `UserPromptSubmit.matcher.js`, `Stop.matcher.js`, etc.
- Matchers export a function: `function(context) → { relevant, priority, relevance }`
- The function receives context with hook-specific data (e.g., `prompt`, `cwd`, `transcriptPath`, etc.)
- Returns an object with:
  - `version`: "1.0" (schema version)
  - `relevant`: boolean (should this skill be suggested?)
  - `priority`: "critical" | "high" | "medium" | "low" (importance)
  - `relevance`: "high" | "medium" | "low" (confidence level)

**Matcher Discovery (Shell Layer):**

The shell wrapper (`hook.sh`) handles all matcher discovery:

```bash
# Example from UserPromptSubmit/hook.sh
MATCHERS=$(find "$PROJECT_SKILLS" "$USER_SKILLS" \
  -type f -name "UserPromptSubmit.matcher.js" -print 2>/dev/null || true)

if [ -z "$MATCHERS" ]; then
  exit 0  # No matchers = immediate exit, no Node.js
fi

export MATCHER_PATHS="$MATCHERS"
exec node "$HOOK_DIR/handler.js"
```

**Search locations**:
- Project skills: `<project>/.claude/skills/`
- User skills: `~/.claude/skills/`

**Naming convention**: `<HookType>.matcher.js`
- Example: `UserPromptSubmit.matcher.js`, `Stop.matcher.js`
- Skills are identified by their parent directory name
- A skill can have different matchers for different hooks

**Performance optimization**:
- If `find` returns no results → immediate exit (~10-20ms)
- If `find` returns matcher paths → pass to Node.js via `MATCHER_PATHS` env var

**Output Format:**
When skills match, the UserPromptSubmit hook outputs:
```
SUGGESTED (consider invoking):
- skill-name: Skill tool, skill="skill-name"
```

This appears as additional context in the Claude Code UI before the user's prompt.

## Utility Modules

### Result-Style Error Handling (`utils/result.js`)
- Functions return `{ ok: true, value }` or `{ ok: false, error }`
- Avoids throwing exceptions in hook logic
- Provides `ok(value)`, `err(error)`, `wrapSync(fn)`, `wrapAsync(fn)`

### File-Based Logging (`utils/logger.js`)
- Logs to `.claude/hooks/logs/<logger-name>.log`
- No stderr/stdout pollution (avoids interfering with Claude)
- JSON line-delimited format with timestamps

### I/O Utilities (`utils/io.js`)
- `readJsonFromStdin()` - Safely read and parse JSON from stdin
- `ensureDir(path)` - Create directory if it doesn't exist
- `isDirExists(path)`, `isFileExists(path)` - Existence checks
- `readDirectory(path)` - List directory contents

### Validations (`utils/validations.js`)
- `validateMatcherModule(module)` - Ensure matcher exports a function
- `validateMatcherResult(result)` - Validate matcher return value
- `requireNonEmptyString(value, name, context)` - String validation

### Transcript Utilities (`utils/transcript.js`)
Provides access to conversation history with automatic caching. Each function parses the transcript file on first call, then returns cached results for subsequent calls within the same hook invocation.

**Module-Level Caching:**
- Cache is scoped to the process execution (each hook invocation = new Node.js process)
- Parse once per hook invocation, share across all matchers
- Zero overhead if no matcher uses the utilities

**Available Functions:**
- `getConversationHistory(transcriptPath)` - Returns array of `{role: 'user'|'assistant', content: string}` objects
- `getToolUsage(transcriptPath)` - Returns array of `{tool: string, input: object, timestamp: string}` objects
- `getInitialMessage(transcriptPath)` - Returns the first user message as a string, or null
- `getAllMessages(transcriptPath)` - Returns all raw message objects from the transcript

**Usage in Matchers:**
Matchers receive transcript utilities via `context.transcript` namespace. Matchers can be async to use these utilities:

```javascript
module.exports = async function(context) {
  // Quick check first (no async overhead if not relevant)
  if (!context.prompt.includes('typescript')) {
    return { relevant: false, priority: 'low', relevance: 'low' };
  }

  // Only parse history if keyword matched
  const history = await context.transcript.getConversationHistory(context.transcriptPath);

  // Check for previous type errors
  const hadErrors = history.some(msg =>
    msg.role === 'assistant' && msg.content.includes('type error')
  );

  return {
    version: "1.0",
    relevant: true,
    priority: hadErrors ? 'critical' : 'medium',
    relevance: hadErrors ? 'high' : 'medium'
  };
};
```

**Performance:**
- First call to any utility: ~50-200ms (parses transcript file)
- Subsequent calls in same hook invocation: <1ms (returns cached data)
- If multiple matchers use `getConversationHistory()`, only first call parses

## Development Guidelines

### Adding a New Skill

Skills are automatically discovered by the shell wrapper - no hook handler changes needed.

1. Create directory: `.claude/skills/<skill-name>/`
2. Create hook-specific matcher files (e.g., `UserPromptSubmit.matcher.js`):

```javascript
/**
 * Matcher for UserPromptSubmit hook
 * Matchers can be sync or async
 *
 * @param {Object} context - Hook-specific context
 * @param {string} context.prompt - User's prompt text
 * @param {string} context.cwd - Current working directory
 * @param {string} context.transcriptPath - Path to transcript
 * @param {string} context.permissionMode - Permission mode (ask/allow)
 * @param {string} context.sessionId - Session identifier
 * @param {Object} context.meta - Meta information
 * @param {string} context.meta.schemaVersion - Schema version
 * @param {Object} context.transcript - Transcript utilities (cached)
 * @param {Function} context.transcript.getConversationHistory - Get conversation history
 * @param {Function} context.transcript.getToolUsage - Get tool usage
 * @param {Function} context.transcript.getInitialMessage - Get first message
 * @param {Function} context.transcript.getAllMessages - Get all messages
 * @returns {Object|Promise<Object>} Matcher result
 */
module.exports = function (context) {
  // Sync matcher example
  const prompt = context.prompt.toLowerCase();

  // Your matching logic here
  const isRelevant = prompt.includes("your-keyword");

  return {
    version: "1.0",
    relevant: isRelevant,
    priority: "medium",  // critical | high | medium | low
    relevance: "high",   // high | medium | low
  };
};

// Or async matcher with conversation history:
module.exports = async function (context) {
  const prompt = context.prompt.toLowerCase();

  if (!prompt.includes("your-keyword")) {
    return { version: "1.0", relevant: false, priority: "low", relevance: "low" };
  }

  // Use conversation history for context-aware matching
  const history = await context.transcript.getConversationHistory(context.transcriptPath);
  const hadPreviousErrors = history.some(msg =>
    msg.role === 'assistant' && msg.content.includes('error')
  );

  return {
    version: "1.0",
    relevant: true,
    priority: hadPreviousErrors ? "critical" : "medium",
    relevance: "high",
  };
};
```

3. **Multiple hooks**: Create different matchers for different hooks
   - `UserPromptSubmit.matcher.js` - Triggered on user prompts
   - `Stop.matcher.js` - Triggered when agent about to stop
   - Each hook can have different matching logic

4. **Automatic discovery**: The shell wrapper's `find` command will automatically discover your new matcher file on the next hook invocation. No restarts or configuration changes needed.

### Adding a New Hook Handler

Follow the two-tier pattern established by existing hooks:

**1. Create directory structure:**
```bash
mkdir -p .claude/hooks/<HookEventName>
```

**2. Create shell wrapper (`hook.sh`):**

This is the entry point that Claude Code will execute. It's responsible for fast matcher discovery.

```bash
#!/bin/bash
set -euo pipefail

# Determine hook directory (where this script lives)
HOOK_DIR="$(cd "$(dirname "$0")" && pwd)"

# Determine skill root directories
PROJECT_SKILLS="${CLAUDE_PROJECT_DIR:-$(pwd)}/.claude/skills"
USER_SKILLS="${HOME}/.claude/skills"

# Find hook-specific matchers using standard find command
MATCHERS=$(find "$PROJECT_SKILLS" "$USER_SKILLS" \
  -type f -name "<HookEventName>.matcher.js" -print 2>/dev/null || true)

# Early exit optimization: no matchers = no Node.js
if [ -z "$MATCHERS" ]; then
  exit 0
fi

# Pass matcher paths to Node.js handler via environment variable
export MATCHER_PATHS="$MATCHERS"
exec node "$HOOK_DIR/handler.js"
```

**Key points:**
- Use `set -euo pipefail` for strict error handling
- Use `find` with `-print 2>/dev/null || true` for silent failure handling
- Check if `$MATCHERS` is empty before launching Node.js
- Use `exec` to replace shell process with Node.js (saves memory)

**3. Create Node.js handler (`handler.js`):**

```javascript
#!/usr/bin/env node
const path = require("path");
const utils = require("../utils");
const { validatePayload } = require("./validations");

const logger = utils.logger.createLogger("hook-<HookEventName>-handler");

async function fail(message) {
  await logger.log({ level: "error", message });
  process.exit(1);
}

async function main() {
  // Read JSON payload from stdin
  const inputResult = await utils.io.readJsonFromStdin();
  if (!inputResult.ok) await fail(inputResult.error);

  // Validate payload
  const payloadResult = validatePayload(inputResult.value);
  if (!payloadResult.ok) await fail(payloadResult.error);

  const payload = payloadResult.value;
  await logger.log({ level: "info", event: "payload", payload });

  // Read matcher paths from environment (set by shell wrapper)
  const matcherPathsEnv = process.env.MATCHER_PATHS || "";
  const matcherPaths = matcherPathsEnv
    .split('\n')
    .map(p => p.trim())
    .filter(p => p.length > 0);

  // Build matcher file info
  const matcherFiles = matcherPaths.map(matcherPath => ({
    skillName: path.basename(path.dirname(matcherPath)),
    matcherPath: matcherPath
  }));

  // Build context for matchers
  const context = {
    // ... hook-specific context fields from payload
    schemaVersion: "1.0",
  };

  // Execute matchers
  const matchResult = await utils.skills.runMatchers(matcherFiles, context);
  if (!matchResult.ok) await fail(matchResult.error);

  const activeSkills = matchResult.value || [];

  // Format and output results
  // ... (hook-specific output logic)

  process.exit(0);
}

main();
```

**4. Create supporting files:**
- `types.js` - JSDoc type definitions for payload and context
- `validations.js` - Payload validation logic
- `formatter.js` - Output formatting (if needed)

**5. Make executable and configure:**
```bash
chmod +x .claude/hooks/<HookEventName>/hook.sh
```

Add to `.claude/settings.json`:
```json
{
  "hooks": {
    "<HookEventName>": [{
      "hooks": [{
        "type": "command",
        "command": "bash $CLAUDE_PROJECT_DIR/.claude/hooks/<HookEventName>/hook.sh"
      }]
    }]
  }
}
```

**6. Test:**
```bash
# Create test payload
echo '{"field": "value"}' > test-payloads/<hook-name>.json

# Test with no matchers
mv .claude/skills .claude/skills.bak
bash .claude/hooks/<HookEventName>/hook.sh < test-payloads/<hook-name>.json
# Should exit immediately with no output

# Test with matchers
mv .claude/skills.bak .claude/skills
bash .claude/hooks/<HookEventName>/hook.sh < test-payloads/<hook-name>.json
# Should execute and output results
```

### Coding Patterns

**Error Handling:**
```javascript
const result = await someOperation();
if (!result.ok) {
  await logger.log({ level: "error", message: result.error });
  process.exit(1);
}
const value = result.value;
```

**Reading Stdin:**
```javascript
const inputResult = await utils.io.readJsonFromStdin();
if (!inputResult.ok) {
  await fail(inputResult.error);
}
const payload = inputResult.value;
```

**Logging:**
```javascript
const logger = utils.logger.createLogger("hook-name");
await logger.log({ level: "info", event: "description", data: {...} });
```

**Validations:**
```javascript
const validation = validatePayload(payload);
if (!validation.ok) {
  await fail(validation.error);
}
```

## Hook Configuration

Hooks are configured in `.claude/settings.json`:

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "bash $CLAUDE_PROJECT_DIR/.claude/hooks/UserPromptSubmit/hook.sh"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "bash $CLAUDE_PROJECT_DIR/.claude/hooks/Stop/hook.sh"
          }
        ]
      }
    ]
  }
}
```

**Note:** Hooks now call shell wrapper scripts (`hook.sh`) instead of Node.js handlers directly. The shell wrapper performs fast matcher discovery and only launches Node.js if matchers are found.

## Testing

Test payloads can be found in `test-payloads/` directory.

To test a hook manually:
```bash
# Test the full hook (shell wrapper + Node.js handler)
bash .claude/hooks/UserPromptSubmit/hook.sh < test-payloads/user-prompt-submit.json

# Test with no matchers (temporarily rename skills directory)
mv .claude/skills .claude/skills.bak
bash .claude/hooks/UserPromptSubmit/hook.sh < test-payloads/user-prompt-submit.json
# Should exit immediately with no output
mv .claude/skills.bak .claude/skills
```

## Implementation Status

**Completed (per TODO.md):**
- ✅ Split utilities into dedicated modules under `.claude/hooks/utils/`
- ✅ Replace stderr/stdout debug logging with file-based logging only
- ✅ Rename hook scripts to pattern `<Event>/handler.js` and update settings
- ✅ Add JSDoc types for hooks, matchers, and key locals
- ✅ Implement result-style error handling (return objects) with non-zero exits on failures
- ✅ Simplify matcher discovery: sync matchers, fixed skills folder layout
- ✅ Centralize validations in a validations module
- ✅ Implement hook-specific matcher naming: `<HookType>.matcher.js`
- ✅ Add shell wrapper preprocessing for performance optimization

**Current Capabilities:**
- Two-tier hook system (shell wrapper + Node.js handler)
- UserPromptSubmit hook with full skill matcher framework
- Stop hook with basic logging
- 6 working skill matchers (2 demos + 4 real skills)
- Robust error handling and validation
- File-based logging for debugging
- **Performance optimization**: ~85-95% faster when no matchers exist

## Reference Documentation

- `hooks.pdf` - Official Claude Code hook specification (events, I/O, examples)
- `plan.md` - Original implementation plan with phases and acceptance criteria
