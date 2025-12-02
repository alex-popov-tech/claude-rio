<img alt="claude-rio heading image" src="https://github.com/user-attachments/assets/776a0996-efb2-4ac3-9249-9304cb7e2d89" />

# claude-rio

**Deterministic matcher system for Claude Code that significantly improves skill, agent, and command activation.**

[![npm version](https://img.shields.io/npm/v/claude-rio.svg)](https://www.npmjs.com/package/claude-rio)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## What is claude-rio?

claude-rio adds keyword-based matching to [Claude Code](https://claude.ai/code) skills, agents, and commands, significantly increasing the probability that Claude will activate them when relevant.

### The Problem

Claude Code auto-discovers skills, agents, and commands but doesn't consistently activate them:
- Claude autonomously decides when to use skills (inconsistent)
- Agents require perfect description phrasing (unreliable)
- Commands may be overlooked in favor of direct implementation
- "Claude doesn't use my skill" is a common issue

### The Solution

claude-rio provides explicit activation suggestions based on keyword matching:
- Keywords match → Claude sees "SUGGESTED: typescript-compiler (Skill tool)"
- **Claude still makes the final decision**, but with better awareness
- Significantly increases activation probability without guaranteeing it

**Important:** claude-rio improves activation by making Claude aware of relevant skills/agents/commands. However, Claude makes the final decision on whether to use them. Activation depends on prompt clarity, relevance, and Claude's reasoning.

## Key Features

- ✅ **Deterministic matching** for skills, agents, and commands
- ✅ **Smooth integration** with existing Claude Code setups
- ✅ **Zero dependencies** - uses only bash/sh and Node.js built-ins
- ✅ **Fast execution** - shell preprocessing with early exit (~10-20ms when no matches)
- ✅ **Cross-platform** - works on Windows (PowerShell), macOS, and Linux (bash)
- ✅ **Auto-generates matchers** - AI-powered matcher creation for existing skills/agents/commands

## Requirements

- Node.js >= 18.0.0
- Claude Code CLI


## Quick Start

```bash
# Install hook framework (user-level, applies to all projects)
npx claude-rio setup --user

# Generate matchers for all skills, agents, and commands using Claude Haiku
npx claude-rio generate-matchers --user

# Or install locally in one project (useful for first try)
npx claude-rio setup
npx claude-rio generate-matchers
```

That's it! claude-rio integrates with your `.claude/settings.json` automatically.

## How It Works

When you submit a prompt, claude-rio:
1. Checks for matcher files in your skills, agents, and commands
2. Runs matchers to determine relevance
3. Suggests relevant skills/agents/commands to Claude with special json according to [docs](https://code.claude.com/docs/en/hooks#userpromptsubmit-decision-control)

Claude then sees something like:
```
SUGGESTED (consider invoking):
- typescript-compiler: Skill tool, skill="typescript-compiler"
- code-reviewer: Task tool, subagent_type="code-reviewer"
- deploy: SlashCommand tool, command="/deploy"
```

And that affects probability of claude to actually invoke your skills, agents, and commands instead of ignoring them.

## Creating Matchers

Matchers are simple JavaScript functions that return whether a skill/agent/command is relevant:

### Example Matcher

```javascript
// .claude/skills/docker-helper/rio/UserPromptSubmit.matcher.js
module.exports = function (context) {
  const prompt = context.prompt.toLowerCase();
  const keywords = ['docker', 'container', 'dockerfile'];

  // Count how many keywords match
  const matchCount = keywords.filter(kw => prompt.includes(kw)).length;

  // IMPORTANT: All fields are MANDATORY
  return {
    version: "2.0",         // Required: always "2.0"
    matchCount: matchCount, // Required: number of matches (0+)
    type: "skill",          // Required: "skill", "agent", or "command"
  };
};
```

**How it works:**
- `matchCount = 0`: Not relevant, won't be shown
- `matchCount > 0`: Ranked by score (higher count = higher rank)
- Scores are capped at 10 to prevent keyword inflation

### Advanced Matchers Examples

Since matchers are represented as arbitrary js functions, you can match on whatever you want - keywords in prompt, text patterns in history, config files, etc.

claude-rio includes 5 example matcher patterns in `examples/` for inspiration:

1. **keyword** - Simple keyword matching (fastest, most common)
2. **typo-tolerant** - Handles misspellings and variations
3. **file-based** - Detects project type by checking for indicator files
4. **history-aware** - Uses conversation history for context-aware activation
5. **config-based** - Reads keywords from configuration file


## License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Made for the Claude Code community**
