/**
 * Demo matcher for hello/greeting detection.
 * Simple example showing basic keyword matching.
 *
 * EXAMPLES:
 * - "hello" → relevant: true
 * - "привіт" (Ukrainian hello) → relevant: true
 * - "fix the bug" → relevant: false
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

  // Check for greeting keywords
  const isGreeting = text.includes("hello") || text.includes("привіт");

  if (isGreeting) {
    return {
      version: "1.0",
      relevant: true,
      priority: "low",      // Greetings are not urgent
      relevance: "high",    // High confidence this is a greeting
    };
  }

  return {
    version: "1.0",
    relevant: false,
    priority: "low",
    relevance: "low",
  };
};
