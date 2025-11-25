# better-hooks

**Deterministic matcher system for Claude Code that significantly improves skill and agent activation.**

[![npm version](https://img.shields.io/npm/v/better-hooks.svg)](https://www.npmjs.com/package/better-hooks)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## What is better-hooks?

better-hooks adds keyword-based matching to [Claude Code](https://claude.ai/code) skills and agents, significantly increasing the probability that Claude will activate them when relevant.

### The Problem

Claude Code auto-discovers skills and agents but doesn't consistently activate them:
- Claude autonomously decides when to use skills (inconsistent)
- Agents require perfect description phrasing (unreliable)
- "Claude doesn't use my skill" is a common issue

### The Solution

better-hooks provides explicit activation suggestions based on keyword matching:
- Keywords match → Claude sees "SUGGESTED: typescript-compiler (Skill tool)"
- **Claude still makes the final decision**, but with better awareness
- Significantly increases activation probability without guaranteeing it

**Important:** better-hooks improves activation by making Claude aware of relevant skills/agents. However, Claude makes the final decision on whether to use them. Activation depends on prompt clarity, skill relevance, and Claude's reasoning.

## Key Features

- ✅ **Deterministic matching** for both skills and agents
- ✅ **Smooth integration** with existing Claude Code setups
- ✅ **Zero dependencies** - uses only bash/sh and Node.js built-ins
- ✅ **Fast execution** - shell preprocessing with early exit (~10-20ms when no matches)
- ✅ **Cross-platform** - works on Windows (PowerShell), macOS, and Linux (bash)
- ✅ **Auto-generates matchers** - AI-powered matcher creation for existing skills/agents

## Quick Start

```bash
# Install the hook framework
npx better-hooks setup

# Auto-generate matchers for existing skills/agents
npx better-hooks setup --skills --agents

# Or do everything at once
npx better-hooks setup --user --skills --agents
```

That's it! better-hooks integrates with your `.claude/settings.json` automatically.

## How It Works

When you submit a prompt, better-hooks:
1. Checks for matcher files in your skills and agents
2. Runs matchers to determine relevance
3. Suggests relevant skills/agents to Claude

Claude then sees:
```
SUGGESTED (consider invoking):
- typescript-compiler: Skill tool, skill="typescript-compiler"
- code-reviewer: Task tool, subagent_type="code-reviewer"
```

## Creating Matchers

Matchers are simple JavaScript functions that return whether a skill/agent is relevant:

### Example: Skill Matcher

```javascript
// .claude/skills/docker-helper/better-hooks/UserPromptSubmit.matcher.js
module.exports = function (context) {
  const prompt = context.prompt.toLowerCase();
  const keywords = ['docker', 'container', 'dockerfile'];

  const hasKeyword = keywords.some(kw => prompt.includes(kw));

  // IMPORTANT: All fields are MANDATORY
  return {
    version: "1.0",        // Required: always "1.0"
    relevant: hasKeyword,  // Required: true or false
    priority: hasKeyword ? "medium" : "low",  // Required: critical/high/medium/low
    relevance: hasKeyword ? "high" : "low",   // Required: high/medium/low
  };
};
```

### Example: Agent Matcher

```javascript
// .claude/agents/code-reviewer/better-hooks/UserPromptSubmit.matcher.js
module.exports = function (context) {
  const prompt = context.prompt.toLowerCase();

  // Agents use delegation language keywords
  const keywords = ['review code', 'code review', 'analyze', 'audit'];

  const hasKeyword = keywords.some(kw => prompt.includes(kw));

  // IMPORTANT: All fields are MANDATORY
  return {
    version: "1.0",
    relevant: hasKeyword,
    priority: hasKeyword ? "medium" : "low",  // Agents typically "medium" priority
    relevance: hasKeyword ? "high" : "low",
  };
};
```

**Note:** The `type` field in matcher return values is optional and defaults based on directory path (`.claude/skills/` → "skill", `.claude/agents/` → "agent").

## Examples

better-hooks includes 5 example matcher patterns in `examples/`:

1. **keyword** - Simple keyword matching (fastest, most common)
2. **typo-tolerant** - Handles misspellings and variations
3. **file-based** - Detects project type by checking for indicator files
4. **history-aware** - Uses conversation history for context-aware activation
5. **config-based** - Reads keywords from configuration file

View examples:
```bash
# After installing better-hooks
node_modules/better-hooks/examples/keyword/UserPromptSubmit.matcher.js
```

Or browse on [GitHub](https://github.com/yourusername/better-hooks/tree/main/examples).

## Installation

### Project-level (recommended)
```bash
npx better-hooks setup
```

Installs to `./.claude/` - hooks active only for this project.

### User-level
```bash
npx better-hooks setup --user
```

Installs to `~/.claude/` - hooks active for all your projects.

## Auto-generating Matchers

If you already have skills or agents without matchers, use:

```bash
# Generate matchers for skills only
npx better-hooks setup --skills

# Generate matchers for agents only
npx better-hooks setup --agents

# Generate matchers for both
npx better-hooks setup --skills --agents
```

This command:
- Scans `.claude/skills/` and/or `.claude/agents/` based on flags
- Uses Claude AI (Haiku model) to generate appropriate matchers
- Creates matchers with relevant keywords automatically

## CLI Reference

### `setup` - Setup framework and generate matchers

**Usage:** `better-hooks setup [options]`

**Options:**
- `-u, --user` - Install at user level (~/.claude)
- `-s, --skills` - Generate matchers for skills
- `-a, --agents` - Generate matchers for agents

**Examples:**
```bash
# Framework installation
better-hooks setup              # Install to ./.claude
better-hooks setup --user       # Install to ~/.claude

# Matcher generation
better-hooks setup --skills           # Skills only
better-hooks setup --agents           # Agents only
better-hooks setup --skills --agents  # Both

# Combined operations
better-hooks setup --user --skills --agents  # Install + generate all
```

## Integration

better-hooks merges seamlessly with existing Claude Code setups:

```json
// Before
{
  "hooks": {
    "UserPromptSubmit": [
      {"hooks": [{"command": "your-existing-hook"}]}
    ]
  }
}

// After better-hooks setup
{
  "hooks": {
    "UserPromptSubmit": [
      {"hooks": [{"command": "your-existing-hook"}]},
      {"hooks": [{"command": "bash .claude/hooks/better-hooks/UserPromptSubmit/hook.sh"}]}
    ]
  }
}
```

## Requirements

- Node.js >= 18.0.0
- Claude Code CLI
- Windows (PowerShell), macOS, or Linux (bash)

## Documentation

- [Examples](https://github.com/yourusername/better-hooks/tree/main/examples) - Working matcher examples
- [GitHub Repository](https://github.com/yourusername/better-hooks) - Source code and issues
- [Claude Code Docs](https://claude.ai/code) - Official Claude Code documentation

## Performance

- **No matchers**: ~10-20ms (shell only, early exit)
- **With matchers**: ~50-100ms (shell + Node.js)
- **70% faster** than pure Node.js when no skills match

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Made for the Claude Code community**
