/**
 * ⚠️  DO NOT EDIT - Managed by claude-rio
 *
 * This file is installed and maintained by claude-rio.
 * Manual changes will be lost when claude-rio is updated.
 *
 * To customize behavior, create skills in .claude/skills/
 * See: .claude/docs/CREATING_SKILLS.md
 */

/**
 * Type definitions for UserPromptSubmit hook.
 */

/**
 * Payload received by UserPromptSubmit hook via stdin.
 *
 * @typedef {Object} UserPromptSubmitPayload
 * @property {string} sessionId - Unique session identifier
 * @property {string} transcriptPath - Path to conversation log (JSONL)
 * @property {string} cwd - Current working directory
 * @property {string} permissionMode - Current permission mode
 * @property {string} hookEventName - The event name (should be "UserPromptSubmit")
 * @property {string} prompt - The user's prompt text
 */

/**
 * Meta information provided to matchers.
 *
 * @typedef {Object} MatcherMeta
 * @property {string} schemaVersion - Schema version (e.g., "1.0")
 */

/**
 * Transcript utilities namespace with automatic caching.
 * Each function parses on first call, then returns cached result.
 *
 * @typedef {Object} TranscriptUtils
 * @property {function(string): Promise<Array<{role: string, content: string}>>} getConversationHistory - Get conversation history
 * @property {function(string): Promise<Array<{tool: string, input: object, timestamp: string}>>} getToolUsage - Get tool usage
 * @property {function(string): Promise<string|null>} getInitialMessage - Get first user message
 * @property {function(string): Promise<Array<object>>} getAllMessages - Get all raw messages
 */

/**
 * Context object passed to matcher functions.
 * Matchers can be sync or async.
 *
 * @typedef {Object} MatcherArguments
 * @property {string} prompt - The user's prompt text
 * @property {string} cwd - Current working directory
 * @property {string} transcriptPath - Path to conversation transcript
 * @property {string} permissionMode - Current permission mode ("ask" | "allow")
 * @property {string} sessionId - Session ID
 * @property {MatcherMeta} meta - Meta information (schema version, etc.)
 * @property {TranscriptUtils} transcript - Transcript utilities (cached)
 */

/**
 * Result object returned by matcher functions.
 *
 * @typedef {Object} MatcherResult
 * @property {string} version - Schema version (must be "2.0")
 * @property {number} matchCount - Number of matching keywords (0+)
 * @property {'skill' | 'agent' | 'command'} [type] - Optional: type of item (defaults to path-based detection)
 *
 * Scoring:
 * - Handler calculates score = min(matchCount, 10) / maxMatchCount
 * - Matchers with matchCount > 0 are considered relevant
 * - Higher matchCount = higher rank in output
 *
 * Type field:
 * - 'skill': Suggests invoking via Skill tool
 * - 'agent': Suggests delegating via Task tool
 * - 'command': Suggests invoking via SlashCommand tool
 * - If omitted, type is auto-detected from matcher file location
 */

/**
 * Active skill/agent/command information after matcher evaluation.
 *
 * @typedef {Object} ActiveSkill
 * @property {string} name - Skill, agent, or command name
 * @property {number} score - Relative score (0.0-1.0)
 * @property {'skill' | 'agent' | 'command'} type - Type (skill, agent, or command)
 */

module.exports = {};
