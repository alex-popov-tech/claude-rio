/**
 * Matcher for cheerleader skill.
 * Activates when the user asks for encouragement, motivation, or cheering up.
 *
 * EXAMPLES:
 * - "cheer me up" → relevant: true, priority: high
 * - "I need motivation" → relevant: true, priority: high
 * - "feeling down" → relevant: true, priority: high
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
  const prompt = context.prompt.toLowerCase();

  // Keywords that suggest need for encouragement
  const cheerKeywords = [
    "cheer me up",
    "cheer up",
    "motivate me",
    "encourage me",
    "encouragement",
    "feeling down",
    "need motivation",
    "hype me up",
    "make me feel better",
  ];

  // Check if any cheer keyword is present
  const needsCheer = cheerKeywords.some((keyword) => prompt.includes(keyword));

  if (needsCheer) {
    return {
      version: "1.0",
      relevant: true,
      priority: "high",     // Important to respond to emotional needs
      relevance: "high",    // High confidence this is asking for encouragement
    };
  }

  // Not relevant
  return {
    version: "1.0",
    relevant: false,
    priority: "low",
    relevance: "low",
  };
};
