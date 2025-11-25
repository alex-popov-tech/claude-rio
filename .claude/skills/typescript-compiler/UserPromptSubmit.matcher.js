/**
 * Matcher for typescript-compiler skill.
 * Activates when the prompt mentions TypeScript compilation, type checking, or build operations.
 * Uses conversation history to detect if there were previous type errors.
 *
 * EXAMPLES:
 * - "check typescript" → Checks prompt + history for previous errors
 * - "build the project" → relevant: true, priority: medium
 * - Previous type errors in conversation → priority: critical
 * - "fix the bug" (no TS context) → relevant: false
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
 * @returns {Promise<Object>} Matcher result
 */
module.exports = async function (context) {
  const prompt = context.prompt.toLowerCase();

  // Keywords that suggest TypeScript compilation
  const tsKeywords = [
    "typescript",
    "type check",
    "type error",
    "compile",
    "build",
    "tsc",
    "type-check",
  ];

  // Quick keyword check first (no async overhead if not relevant)
  const hasTsKeyword = tsKeywords.some((keyword) => prompt.includes(keyword));

  if (!hasTsKeyword) {
    // Not relevant - return immediately without parsing history
    return {
      version: "1.0",
      relevant: false,
      priority: "low",
      relevance: "low",
    };
  }

  // Keyword matched - now check conversation history for context
  // This only parses if we passed the keyword check (lazy evaluation)
  const history = await context.transcript.getConversationHistory(context.transcriptPath);

  // Check if there were previous type errors in the conversation
  const hadPreviousTypeErrors = history.some(
    (msg) =>
      msg.role === "assistant" &&
      (msg.content.includes("type error") ||
        msg.content.includes("Type '") ||
        msg.content.includes("TS") ||
        msg.content.includes("TypeScript error"))
  );

  // Determine relevance based on specificity
  let relevance = "medium";
  if (
    prompt.includes("typescript") ||
    prompt.includes("type error") ||
    prompt.includes("tsc")
  ) {
    relevance = "high";
  }

  // Determine priority based on context and history
  let priority = "medium";

  if (hadPreviousTypeErrors) {
    // If there were previous errors, this is critical
    priority = "critical";
    relevance = "high";
  } else if (prompt.includes("error") || prompt.includes("fix")) {
    priority = "high";
  } else if (prompt.includes("check") || prompt.includes("verify")) {
    priority = "critical";
  }

  return {
    version: "1.0",
    relevant: true,
    priority: priority,
    relevance: relevance,
  };
};
