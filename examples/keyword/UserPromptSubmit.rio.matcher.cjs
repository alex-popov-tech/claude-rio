/**
 * EXAMPLE: Simple Keyword Matcher (v2.0)
 *
 * This is the simplest and most common matcher pattern. It counts how many
 * keywords from your list appear in the user's prompt using case-insensitive matching.
 *
 * USE CASE:
 * Perfect for skills that focus on a specific tool, framework, or concept where the
 * keywords are unique enough that simple matching works reliably.
 *
 * REAL-WORLD EXAMPLES:
 * - Docker helper: "docker", "container", "dockerfile", "compose"
 * - Git helper: "git", "commit", "branch", "merge", "pull request"
 * - Database helper: "database", "sql", "query", "schema", "migration"
 * - TypeScript helper: "typescript", "type check", "compile", "tsc"
 *
 * BENEFITS:
 * - Fastest matcher pattern (~1ms execution)
 * - No dependencies, no file I/O, no async operations
 * - Easy to understand and customize
 * - Natural ranking based on keyword match count
 *
 * WHEN TO USE:
 * - Your skill has unique, specific keywords
 * - You want simple, reliable activation
 * - Performance is important (this is the fastest pattern)
 * - You're just getting started with matchers
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
  // Keywords for a Docker helper skill
  // In your matcher, replace these with keywords relevant to your skill
  const keywords = [
    'docker',
    'container',
    'dockerfile',
    'docker-compose',
    'compose',
    'image',
    'containerize',
  ];

  // Convert prompt to lowercase for case-insensitive matching
  const prompt = context.prompt.toLowerCase();

  // Count how many keywords are present in the prompt
  const matchCount = keywords.filter((keyword) => prompt.includes(keyword)).length;

  // IMPORTANT: All fields are MANDATORY and must not be undefined/null
  return {
    version: '2.0', // Required: always "2.0"
    matchCount: matchCount, // Required: number of matches (0+)
    type: 'skill', // Required: "skill" or "agent"
  };
};

/**
 * PERFORMANCE NOTES:
 * - Execution time: ~1ms (fastest matcher pattern)
 * - .includes() is optimized for substring matching
 * - .filter() counts all matches (scoring is done by handler)
 * - No file I/O, no async operations, no external dependencies
 *
 * CUSTOMIZATION TIPS:
 *
 * 1. CHOOSING KEYWORDS:
 *    - Use specific terms unique to your skill's domain
 *    - Include common variations (e.g., "docker" and "dockerfile")
 *    - Consider both singular and plural forms if needed
 *    - Think about what users actually type in prompts
 *    - Aim for 5-8 keywords for best results
 *
 * 2. SCORING BEHAVIOR:
 *    - matchCount = 0: Not relevant, won't be shown
 *    - matchCount = 1-2: Low relevance
 *    - matchCount = 3-5: Medium relevance
 *    - matchCount = 6+: High relevance (capped at 10 for scoring)
 *
 * 3. AVOIDING FALSE POSITIVES:
 *    - Keep keywords specific (avoid common words like "run", "check")
 *    - Consider word-boundary matching if keywords are too short
 *    - Use negative keywords pattern if you need to exclude cases
 *
 * 4. HANDLING SHORT KEYWORDS:
 *    If your keywords are very short (2-3 characters), consider adding
 *    word boundary checks to avoid false positives:
 *
 *    const matchCount = keywords.filter(keyword => {
 *      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
 *      return regex.test(context.prompt);
 *    }).length;
 *
 * TESTING YOUR MATCHER:
 *
 * Test with realistic prompts:
 * ✅ "Help me set up docker for my app" → matchCount: 1 (docker)
 * ✅ "Why is my docker container not starting?" → matchCount: 2 (docker, container)
 * ✅ "Create a Dockerfile using docker-compose" → matchCount: 3 (dockerfile, docker-compose, compose)
 * ❌ "Fix my React component" → matchCount: 0
 * ❌ "How do I use git?" → matchCount: 0
 */
