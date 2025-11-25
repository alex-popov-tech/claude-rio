/**
 * ⚠️  DO NOT EDIT - Managed by better-hooks
 *
 * This file is installed and maintained by better-hooks.
 * Manual changes will be lost when better-hooks is updated.
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
 * @property {string} version - Schema version (e.g., "1.0")
 * @property {boolean} relevant - Whether this skill/agent is relevant to the prompt
 * @property {'critical' | 'high' | 'medium' | 'low'} priority - Priority level
 * @property {'high' | 'medium' | 'low'} relevance - Confidence level that this should be applied
 * @property {'skill' | 'agent'} [type] - Optional: type of item (defaults to path-based detection)
 *
 * Priority levels:
 * - 'critical': MUST be invoked immediately before any other actions
 * - 'high': Strongly recommended for this context
 * - 'medium': Suggested but optional
 * - 'low': May be relevant but not prioritized
 *
 * Relevance levels:
 * - 'high': Very confident this is relevant
 * - 'medium': Moderately confident this applies
 * - 'low': Low confidence or tangentially related
 *
 * Type field:
 * - 'skill': Suggests invoking via Skill tool
 * - 'agent': Suggests delegating via Task tool
 * - If omitted, type is auto-detected from matcher file location
 */

/**
 * Active skill/agent information after matcher evaluation.
 *
 * @typedef {Object} ActiveSkill
 * @property {string} name - Skill or agent name
 * @property {'critical' | 'high' | 'medium' | 'low'} priority - Priority level
 * @property {'high' | 'medium' | 'low'} relevance - Confidence level
 * @property {'skill' | 'agent'} type - Type (skill or agent)
 */

module.exports = {};
