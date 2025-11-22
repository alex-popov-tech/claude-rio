/**
 * Type definitions for Stop hook.
 */

/**
 * Payload received by Stop hook via stdin.
 *
 * @typedef {Object} StopPayload
 * @property {string} sessionId - Unique session identifier
 * @property {string} transcriptPath - Path to conversation log (JSONL)
 * @property {string} cwd - Current working directory
 * @property {string} permissionMode - Current permission mode
 * @property {string} hookEventName - The event name (should be "Stop")
 * @property {boolean} stopHookActive - Flag indicating if stop hook is already active (prevents infinite loops)
 */

module.exports = {};
