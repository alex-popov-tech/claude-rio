# Changelog

All notable changes to claude-rio will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[1.0.0]: https://github.com/alex-popov-tech/claude-rio/releases/tag/v1.0.0
