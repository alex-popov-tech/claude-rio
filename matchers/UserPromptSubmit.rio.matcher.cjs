/**
 * Universal UserPromptSubmit Matcher Template (v2.0)
 *
 * This template is used by the `setup` command to auto-generate
 * matchers for skills and agents. Claude Haiku fills in the keywords array
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
    // Keywords will be inserted here by setup command
  ];

  // Count matching keywords
  const matchCount = keywords.filter((keyword) => prompt.includes(keyword)).length;

  // IMPORTANT: All fields are MANDATORY and must not be undefined/null
  return {
    version: '2.0', // Required: always "2.0"
    matchCount: matchCount, // Required: number of matches (0+)
    type: 'skill', // TODO: Haiku sets to 'skill' or 'agent' based on context
  };
};
