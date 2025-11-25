# Changelog

All notable changes to better-hooks will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2025-11-23

### ⚠️ BREAKING CHANGES

- **Removed Stop hook**: The Stop hook has been removed from the project as it does not support skill suggestion display to users. Only UserPromptSubmit hook remains, which is the primary hook for skill activation.

### Added

- **User-level installation**: New `--user` flag for `init` command to install hooks at user level (`~/.claude`) instead of project level (`./.claude`)
  - Project-level (default): Active only for current project
  - User-level (`--user`): Active for all your projects
- **Matcher template library**: 10 educational matcher templates in `templates/matcher-templates/` demonstrating common patterns:
  - `keyword-matcher.template.js` - Simple keyword checking
  - `word-boundary-matcher.template.js` - Whole-word regex matching
  - `priority-matcher.template.js` - Dynamic priority based on keywords
  - `file-based-matcher.template.js` - File system detection
  - `history-aware-matcher.template.js` - Conversation history analysis
  - `multi-signal-matcher.template.js` - Combine multiple indicators
  - `tool-usage-matcher.template.js` - Detect tool usage patterns
  - `negative-filter-matcher.template.js` - Include/exclude keywords
  - `typo-tolerant-matcher.template.js` - Handle common typos
  - `config-based-matcher.template.js` - Read keywords from config file
- Comprehensive matcher template documentation with examples, use cases, and performance notes
- Enhanced CLAUDE.md with "Helping Users Add Matchers to Existing Skills" section

### Changed

- Simplified hook system - focus on UserPromptSubmit as the primary hook
- Updated all documentation to remove Stop hook references
- Enhanced CREATING_SKILLS.md with matcher templates usage guide

### Removed

- Stop hook implementation (directory, handlers, matchers, documentation)
- All Stop.matcher.js files from example skills

## [0.1.0] - 2025-11-23

### Added

- Initial release of better-hooks
- Two-tier hook architecture (shell preprocessing + Node.js execution)
- Cross-platform support (Windows PowerShell, macOS/Linux bash)
- Automatic skill activation based on hook events
- Smart settings.json merging (integrates with existing Claude Code setups)
- Idempotent installation (can run init multiple times safely)
- Four example skills:
  - `typescript-compiler` - TypeScript compilation assistance
  - `test-runner` - Test running and debugging help
  - `commit-helper` - Git commit message guidance
  - `cheerleader` - Encouragement and motivation
- CLI with `init` command
- Comprehensive documentation:
  - User-facing README
  - HOOKS.md - System architecture
  - CREATING_SKILLS.md - Skill development guide
  - Skills README - Example skills documentation
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
- --with-examples flag to include example skills
- --force flag to overwrite without prompting

[0.1.0]: https://github.com/yourusername/better-hooks/releases/tag/v0.1.0
