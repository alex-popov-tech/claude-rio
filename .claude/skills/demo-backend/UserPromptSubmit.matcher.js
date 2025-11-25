/**
 * Demo matcher for backend-related prompts.
 * Shows pattern matching for technical keywords and paths.
 *
 * EXAMPLES:
 * - "fix the backend" → relevant: true
 * - "update backend/api.js" → relevant: true
 * - "frontend component" → relevant: false
 *
 * CONTEXT STRUCTURE:
 * - context.prompt: User's prompt text
 * - context.cwd: Current working directory
 * - context.transcriptPath: Path to conversation transcript
 * - context.permissionMode: "ask" | "allow"
 * - context.sessionId: Unique session identifier
 * - context.meta.schemaVersion: Schema version
 * - context.transcript: Namespace with cached utilities:
 *   - getConversationHistory() → [{role, content}, ...]
 *   - getToolUsage() → [{tool, input, timestamp}, ...]
 *   - getInitialMessage() → string | null
 *   - getAllMessages() → [raw messages...]
 *
 * @param {Object} context - Matcher context
 * @returns {Object} Matcher result
 */
module.exports = function (context) {
  const text = String(context.prompt || "").toLowerCase();

  // Check for backend keyword or backend/ path
  const hasBackendKeyword = text.includes("backend");
  const hasBackendPath = text.includes("/backend/") || text.includes("backend/");

  if (hasBackendKeyword || hasBackendPath) {
    // Higher relevance if it's a path (more specific)
    const relevance = hasBackendPath ? "high" : "medium";

    return {
      version: "1.0",
      relevant: true,
      priority: "medium",
      relevance: relevance,
    };
  }

  return {
    version: "1.0",
    relevant: false,
    priority: "low",
    relevance: "low",
  };
};
