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
 * @property {boolean} relevant - Whether this skill is relevant to the prompt
 * @property {'critical' | 'high' | 'medium' | 'low'} priority - Skill priority level
 * @property {'high' | 'medium' | 'low'} relevance - Confidence level that this skill should be applied
 *
 * Priority levels:
 * - 'critical': Skill MUST be invoked immediately before any other actions
 * - 'high': Skill is strongly recommended for this context
 * - 'medium': Skill is suggested but optional
 * - 'low': Skill may be relevant but not prioritized
 *
 * Relevance levels:
 * - 'high': Very confident this skill is relevant
 * - 'medium': Moderately confident this skill applies
 * - 'low': Low confidence or tangentially related
 */

/**
 * Active skill information after matcher evaluation.
 *
 * @typedef {Object} ActiveSkill
 * @property {string} name - Skill name
 * @property {'critical' | 'high' | 'medium' | 'low'} priority - Skill priority
 * @property {'high' | 'medium' | 'low'} relevance - Confidence level that this skill should be applied
 */

module.exports = {};
