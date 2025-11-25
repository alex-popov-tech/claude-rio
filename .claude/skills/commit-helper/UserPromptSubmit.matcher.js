/**
 * Matcher for commit-helper skill.
 * Activates when the prompt mentions commits, committing, or git operations.
 *
 * EXAMPLES:
 * - "commit the changes" → relevant: true, priority: critical
 * - "create a commit" → relevant: true, priority: critical
 * - "git commit" → relevant: true, priority: critical
 * - "push to remote" → relevant: false
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

  // Keywords that suggest commit operations
  const commitKeywords = [
    "commit",
    "git commit",
    "create commit",
    "make a commit",
    "commit the",
    "commit changes",
    "stage and commit",
  ];

  // Check if any commit keyword is present
  const hasCommitKeyword = commitKeywords.some((keyword) =>
    prompt.includes(keyword),
  );

  if (hasCommitKeyword) {
    // High relevance if explicit "commit" mentioned
    const relevance = prompt.includes("commit") ? "high" : "medium";

    // Critical priority for commit operations - requires immediate skill invocation
    const priority = prompt.match(/\b(commit|commits)\b/) ? "critical" : "high";

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
