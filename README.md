<img alt="claude-rio heading image" src="https://github.com/user-attachments/assets/9c1fe0d3-5ae5-4edf-8752-cbf0c364c93c" />

# claude-rio

**Deterministic matcher system for Claude Code that significantly improves skill and agent activation.**

[![npm version](https://img.shields.io/npm/v/claude-rio.svg)](https://www.npmjs.com/package/claude-rio)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## What is claude-rio?

claude-rio adds keyword-based matching to [Claude Code](https://claude.ai/code) skills and agents, significantly increasing the probability that Claude will activate them when relevant.

### The Problem

Claude Code auto-discovers skills and agents but doesn't consistently activate them:
- Claude autonomously decides when to use skills (inconsistent)
- Agents require perfect description phrasing (unreliable)
- "Claude doesn't use my skill" is a common issue

### The Solution

claude-rio provides explicit activation suggestions based on keyword matching:
- Keywords match → Claude sees "SUGGESTED: typescript-compiler (Skill tool)"
- **Claude still makes the final decision**, but with better awareness
- Significantly increases activation probability without guaranteeing it

**Important:** claude-rio improves activation by making Claude aware of relevant skills/agents. However, Claude makes the final decision on whether to use them. Activation depends on prompt clarity, skill relevance, and Claude's reasoning.

## Key Features

- ✅ **Deterministic matching** for both skills and agents
- ✅ **Smooth integration** with existing Claude Code setups
- ✅ **Zero dependencies** - uses only bash/sh and Node.js built-ins
- ✅ **Fast execution** - shell preprocessing with early exit (~10-20ms when no matches)
- ✅ **Cross-platform** - works on Windows (PowerShell), macOS, and Linux (bash)
- ✅ **Auto-generates matchers** - AI-powered matcher creation for existing skills/agents

## Requirements

- Node.js >= 18.0.0
- Claude Code CLI


## Quick Start

```bash
# Install hook framework in your $HOME/.claude/hooks, and use your haiku to pre-generate matchers for your subagents and skills
npx claude-rio setup --user --skills --agents

# Install hook framework only ( if you want to make matchers yourself )
npx claude-rio setup --user

# Install the hook framework locally in one project ( useful for first try )
# and generate matchers for project skills and agents
npx claude-rio setup --skills --agents
```

That's it! claude-rio integrates with your `.claude/settings.json` automatically.

## How It Works

When you submit a prompt, claude-rio:
1. Checks for matcher files in your skills and agents
2. Runs matchers to determine relevance
3. Suggests relevant skills/agents to Claude with special json according to [docs](https://code.claude.com/docs/en/hooks#userpromptsubmit-decision-control)

Claude then sees something like:
```
SUGGESTED (consider invoking):
- typescript-compiler: Skill tool, skill="typescript-compiler"
- code-reviewer: Task tool, subagent_type="code-reviewer"
```

And that affects probability of claude to actually invoke your skills and agents instead of ignoring them.

## Creating Matchers

Matchers are simple JavaScript functions that return whether a skill/agent is relevant:

### Example Matcher

```javascript
// .claude/skills/docker-helper/rio/UserPromptSubmit.matcher.js
module.exports = function (context) {
  const prompt = context.prompt.toLowerCase();
  const keywords = ['docker', 'container', 'dockerfile'];

  const hasKeyword = keywords.some(kw => prompt.includes(kw));

  // IMPORTANT: All fields are MANDATORY
  return {
    type: "skill",         // For Agent pass 'agent' here
    version: "1.0",        // Required: always "1.0"
    relevant: hasKeyword,  // Required: true or false
    priority: hasKeyword ? "medium" : "low",  // Required: critical/high/medium/low
    relevance: hasKeyword ? "high" : "low",   // Required: high/medium/low
  };
};
```

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