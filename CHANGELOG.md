# Changelog

All notable changes to claude-rio will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.1] - 2025-12-04

### Changed

- **Tiered output formatting**: Formatter now displays results in tiers when multiple items have different scores
  - "BEST MATCH" section highlights top-scoring items with their match count
  - "Other matches" section shows remaining items with individual match counts
  - Single-score results display simplified list without tiers
- **Enhanced logging**: Handler now includes formatted output in logs for debugging
- **Updated examples**: Fixed outdated v1.0 references in history-aware example comments

## [2.0.0] - 2025-11-30

### BREAKING CHANGES

**Matcher Schema v2.0** - Simplified match-count-based ranking system

The matcher schema has been completely redesigned to use automatic scoring based on keyword match counts instead of manual priority assignment.

**Old Schema (v1.0):**
```javascript
{
  version: '1.0',
  relevant: boolean,
  priority: 'critical' | 'high' | 'medium' | 'low',
  type: 'skill' | 'agent' | 'command'
}
```

**New Schema (v2.0):**
```javascript
{
  version: '2.0',
  matchCount: number,  // 0+ matches, capped at 10 for scoring
  type: 'skill' | 'agent' | 'command'
}
```

### Added

- **Commands support**: Hook now discovers and suggests slash commands alongside skills and agents

### Changed

- **Matcher schema**: Replaced `relevant` + `priority` with `matchCount` field
- **Handler logic**: Automatic score calculation with `score = min(matchCount, 10) / maxMatchCount`
- **Formatter output**: Simple ranked list instead of 4-tier priority grouping
- **Validation**: Updated runtime and CLI validation for v2.0 schema
- **Examples**: All 5 example matchers updated to v2.0 schema
- **Template**: Universal matcher template now generates v2.0-compatible code
- **AI generation**: Haiku prompts updated to generate v2.0 matchers

### Benefits

- **Simpler mental model**: Count matches → get ranked results
- **Easier AI generation**: Haiku just fills keyword arrays, no priority decisions
- **Self-balancing**: Natural ranking from match strength
- **Gaming prevention**: Cap at 10 prevents keyword inflation
- **Cleaner code**: Removed priority enum and tier grouping logic

### Migration

**Easiest path**: Regenerate matchers using the generate-matchers command:
```bash
npx claude-rio generate-matchers
```

**Manual migration**:
1. Change `version` from `'1.0'` to `'2.0'`
2. Replace `.some()` with `.filter().length` to count matches
3. Remove `relevant` and `priority` fields
4. Keep `type` field unchanged

**Example**:
```javascript
// Before (v1.0)
const hasKeyword = keywords.some(kw => prompt.includes(kw));
return {
  version: '1.0',
  relevant: hasKeyword,
  priority: hasKeyword ? 'medium' : 'low',
  type: 'skill'
};

// After (v2.0)
const matchCount = keywords.filter(kw => prompt.includes(kw)).length;
return {
  version: '2.0',
  matchCount: matchCount,
  type: 'skill'
};
```

See CLAUDE.md for full migration guide.

## [1.1.3] - 2025-11-28

### Changed

- **Handler output cleanup**: Removed unnecessary logging from handler.cjs to ensure only JSON is printed to stdout, improving compatibility with hook consumers
- **Code formatting**: Applied consistent formatting across codebase

## [1.1.2] - 2025-11-27

### Changed

- **CommonJS compatibility**: Migrated all hook utilities from `.js` to `.cjs` extension
  - Ensures compatibility across mixed ESM/CJS projects
  - Files affected: formatter, handler, types, validations, and all utils/ modules

### Added

- **Remove command**: New `claude-rio remove` command for uninstalling hooks and cleaning up matchers
  - Interactive cleanup process
  - Supports both project-level and user-level installations

### Fixed

- Hook discovery updated to locate `.cjs` files correctly

## [1.1.1] - 2025-11-27

### Fixed

- **Matcher template**: Added missing `type` field to matcher return object in universal template
- **Prompt builder**: Updated both skill and agent prompts to instruct Claude to include `type` field when generating matchers
- This ensures auto-generated matchers on user machines include the `type` property, making skill/agent invocation instructions more explicit

## [1.1.0] - 2025-11-27

### Changed

- **Matcher file extension**: Migrated from `.js` to `.cjs` extension for CommonJS compatibility across mixed ESM/CJS projects
- **Matcher naming convention**: Changed from `UserPromptSubmit.matcher.js` to `UserPromptSubmit.rio.matcher.cjs` for clearer identification
- **Separate skills and agents discovery**: Hook now searches skills at `.claude/skills/*/rio/UserPromptSubmit.matcher.cjs` and agents at `.claude/agents/*.rio.matcher.cjs`
- **Inlined validation logic**: Removed shared validation module, validation is now self-contained in matcher-validator.js

### Added

- **Remove command**: New `claude-rio remove` command to uninstall hooks and clean up matchers
- Support for agent-level matchers (sibling to `.md` agent files)

### Removed

- `shared/` directory - validation logic inlined into CLI utilities
- Legacy `.js` matcher files replaced with `.cjs` versions

## [1.0.0] - 2025-11-26

### Added

- Two-tier hook architecture (shell preprocessing + Node.js execution)
- Cross-platform support (Windows PowerShell, macOS/Linux bash)
- Automatic skill and agent activation based on hook events
- Smart settings.json merging (integrates with existing Claude Code setups)
- Idempotent installation (can run setup multiple times safely)
- **User-level installation**: `--user` flag for `setup` command to install hooks at user level (`~/.claude`) instead of project level (`./.claude`)
  - Project-level (default): Active only for current project
  - User-level (`--user`): Active for all your projects
- **AI-powered matcher generation**: `setup --skills --agents` command uses Claude Haiku to automatically generate matchers for existing skills and agents
- Working example matchers demonstrating common patterns:
  - `keyword/` - Simple keyword checking
  - `typo-tolerant/` - Handle common typos with fuzzy matching
  - `file-based/` - File system detection
  - `history-aware/` - Conversation history analysis
  - `config-based/` - Read keywords from config file
- CLI with unified `setup` command
- Comprehensive documentation:
  - User-facing README
  - CLAUDE.md - AI assistant guidance
  - Example matchers with inline documentation
- Transcript utilities for context-aware matching (cached)
- File-based logging for debugging
- Result-style error handling
- Full JSDoc type annotations

### Performance

- ~10-20ms execution when no matchers present (shell only)
- ~50-100ms execution with matchers (shell + Node.js)
- 70% performance improvement over pure Node.js approach

### Features

- OS detection and platform-specific script copying
- Warning headers on all hook files
- Executable permission preservation (Unix)
- Interactive prompts with --yes flag for automation
- --skills and --agents flags to generate matchers with AI assistance
- Matcher validation (CLI and runtime)
- Universal matcher template for easy customization

[2.0.1]: https://github.com/alex-popov-tech/claude-rio/releases/tag/v2.0.1
[2.0.0]: https://github.com/alex-popov-tech/claude-rio/releases/tag/v2.0.0
[1.1.3]: https://github.com/alex-popov-tech/claude-rio/releases/tag/v1.1.3
[1.1.2]: https://github.com/alex-popov-tech/claude-rio/releases/tag/v1.1.2
[1.1.1]: https://github.com/alex-popov-tech/claude-rio/releases/tag/v1.1.1
[1.1.0]: https://github.com/alex-popov-tech/claude-rio/releases/tag/v1.1.0
[1.0.0]: https://github.com/alex-popov-tech/claude-rio/releases/tag/v1.0.0
