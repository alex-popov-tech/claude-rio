/**
 * Universal UserPromptSubmit Matcher Template
 *
 * This template is used by the `setup-skills` command to auto-generate
 * matchers for skills and agents. Haiku fills in the keywords array
 * based on the skill/agent description.
 *
 * IMPORTANT: All return fields are MANDATORY and must not be undefined/null.
 *
 * @param {Object} context - Matcher context
 * @param {string} context.prompt - User's prompt text
 * @param {string} context.cwd - Current working directory
 * @param {string} context.transcriptPath - Path to conversation transcript
 * @param {string} context.permissionMode - "ask" | "allow"
 * @param {string} context.sessionId - Session ID
 * @param {Object} context.meta - Meta information
 * @param {Object} context.transcript - Transcript utilities (for async usage)
 * @returns {Object} Matcher result with all required fields
 */
module.exports = function (context) {
  const prompt = context.prompt.toLowerCase();

  // TODO: Haiku fills this array with relevant keywords
  const keywords = [
    // Keywords will be inserted here by setup-skills command
  ];

  // Check if any keyword is present in the prompt
  const hasKeyword = keywords.some((keyword) => prompt.includes(keyword));

  // IMPORTANT: All fields are MANDATORY and must not be undefined/null
  return {
    version: '1.0', // Required: always "1.0"
    relevant: hasKeyword, // Required: true or false
    priority: hasKeyword ? 'medium' : 'low', // Required: "critical" | "high" | "medium" | "low"
    relevance: hasKeyword ? 'high' : 'low', // Required: "high" | "medium" | "low"
    type: 'skill', // TODO: Haiku sets to 'skill' or 'agent' based on context
  };
};
