/**
 * EXAMPLE: Simple Keyword Matcher
 *
 * This is the simplest and most common matcher pattern. It checks if the user's
 * prompt contains any of your specified keywords using case-insensitive substring matching.
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
 * - Very low false negative rate for specific keywords
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

  // Check if any keyword is present in the prompt
  // .some() short-circuits on first match for better performance
  const hasKeyword = keywords.some((keyword) => prompt.includes(keyword));

  // IMPORTANT: All fields are MANDATORY and must not be undefined/null
  return {
    version: '1.0', // Required: always "1.0"
    relevant: hasKeyword, // Required: true or false
    priority: hasKeyword ? 'medium' : 'low', // Required: "critical" | "high" | "medium" | "low"
    relevance: hasKeyword ? 'high' : 'low', // Required: "high" | "medium" | "low"
  };
};

/**
 * PERFORMANCE NOTES:
 * - Execution time: ~1ms (fastest matcher pattern)
 * - .includes() is optimized for substring matching
 * - .some() stops on first match (no need to check all keywords)
 * - No file I/O, no async operations, no external dependencies
 *
 * CUSTOMIZATION TIPS:
 *
 * 1. CHOOSING KEYWORDS:
 *    - Use specific terms unique to your skill's domain
 *    - Include common variations (e.g., "docker" and "dockerfile")
 *    - Consider both singular and plural forms if needed
 *    - Think about what users actually type in prompts
 *
 * 2. ADJUSTING PRIORITY:
 *    - "critical" = Urgent, time-sensitive workflows (build failures, blockers)
 *    - "high" = Important, commonly needed (running tests, compilation)
 *    - "medium" = Helpful, frequently used (linting, formatting)
 *    - "low" = Optional, nice-to-have (documentation, examples)
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
 *    const hasKeyword = keywords.some(keyword => {
 *      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
 *      return regex.test(context.prompt);
 *    });
 *
 * TESTING YOUR MATCHER:
 *
 * Test with realistic prompts:
 * ✅ "Help me set up docker for my app" → relevant: true
 * ✅ "Why is my container not starting?" → relevant: true
 * ✅ "Create a Dockerfile for Node.js" → relevant: true
 * ❌ "Fix my React component" → relevant: false
 * ❌ "How do I use git?" → relevant: false
 */
