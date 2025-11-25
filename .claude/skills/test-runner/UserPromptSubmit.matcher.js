/**
 * Matcher for test-runner skill.
 * Activates when the prompt mentions running tests, test coverage, or testing operations.
 *
 * EXAMPLES:
 * - "run tests" → relevant: true, priority: high
 * - "fix failing tests" → relevant: true, priority: critical
 * - "test coverage" → relevant: true, priority: low
 * - "build the project" → relevant: false
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

  // Keywords that suggest testing operations
  const testKeywords = [
    "test",
    "tests",
    "testing",
    "jest",
    "vitest",
    "mocha",
    "pytest",
    "coverage",
    "spec",
    "unit test",
    "integration test",
  ];

  // Check if any test keyword is present
  const hasTestKeyword = testKeywords.some((keyword) =>
    prompt.includes(keyword),
  );

  if (hasTestKeyword) {
    // Determine relevance based on specificity
    let relevance = "medium";
    if (
      prompt.match(/\btest\b/) ||
      prompt.includes("jest") ||
      prompt.includes("vitest")
    ) {
      relevance = "high";
    } else if (prompt.includes("testing")) {
      relevance = "medium";
    }

    // Determine priority based on action
    let priority = "medium";
    if (prompt.includes("run") || prompt.includes("execute")) {
      priority = "high";
    } else if (prompt.includes("fix") || prompt.includes("failing")) {
      priority = "critical";
    } else if (prompt.includes("coverage")) {
      priority = "low";
    }

    return {
      version: "1.0",
      relevant: true,
      priority: priority,
      relevance: relevance,
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
