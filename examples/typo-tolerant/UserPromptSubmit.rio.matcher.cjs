/**
 * EXAMPLE: Typo-Tolerant Matcher
 *
 * Handles common typos, misspellings, and variations of keywords to improve matching
 * reliability. Users often make typos when typing quickly, and this pattern catches them.
 *
 * USE CASE:
 * Best for skills with keywords that are:
 * - Commonly misspelled (technical terms, foreign words)
 * - Have multiple valid spellings or variations
 * - Include abbreviations or shorthand forms
 * - Prone to keyboard proximity errors
 *
 * REAL-WORLD EXAMPLES:
 * - TypeScript: "typescript", "type script", "typscript", "ts", "typescipt"
 * - Kubernetes: "kubernetes", "k8s", "kube", "kubernets", "kuberntes"
 * - PostgreSQL: "postgresql", "postgres", "postgre", "postgress", "psql"
 * - Environment: "environment", "enviroment", "environemnt", "env"
 *
 * BENEFITS:
 * - More forgiving user experience (catches typos gracefully)
 * - Higher activation rate without false positives
 * - Still very fast (~1-2ms execution time)
 * - No dependencies or external tools needed
 *
 * WHEN TO USE:
 * - Your keywords are frequently misspelled
 * - You want better user experience with imperfect input
 * - Your skill's keywords are technical terms or jargon
 * - You have common abbreviations (k8s, i18n, a11y)
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
  // TypeScript helper with common variations and typos
  // In your matcher, include: correct spelling, common typos, abbreviations, alternatives
  const keywordVariations = [
    // Correct spellings
    'typescript',
    'type script',

    // Common abbreviations
    'ts',

    // Missing letters
    'typscript',
    'typescrpt',
    'typesript',

    // Swapped letters (keyboard errors)
    'typescipt',
    'tpyescript',
    'tyepscript',

    // Extra letters (doubled keys)
    'typescriptt',
    'typesscript',
    'typescriipt',

    // Phonetic variations
    'type-script',

    // Related terms that users might mention
    'tsc', // TypeScript compiler
    '.ts file',
    'tsconfig',
  ];

  // Convert prompt to lowercase for case-insensitive matching
  const prompt = context.prompt.toLowerCase();

  // Check if any variation is present
  // .some() short-circuits on first match for performance
  const hasVariation = keywordVariations.some((variant) => prompt.includes(variant));

  // IMPORTANT: All fields are MANDATORY and must not be undefined/null
  return {
    version: '1.0', // Required: always "1.0"
    relevant: hasVariation, // Required: true or false
    priority: hasVariation ? 'medium' : 'low', // Required: "critical" | "high" | "medium" | "low"
    relevance: hasVariation ? 'high' : 'low', // Required: "high" | "medium" | "low"
  };
};

/**
 * PERFORMANCE NOTES:
 * - Execution time: ~1-2ms (still very fast despite more keywords)
 * - Simple substring matching (.includes) is highly optimized
 * - .some() stops on first match (doesn't check all variations)
 * - No regex overhead (regex would be 5-10x slower)
 * - No file I/O or external dependencies
 *
 * TYPO CATEGORIES TO CONSIDER:
 *
 * 1. MISSING LETTERS (skipped keys):
 *    - commit → comit, commt, commit
 *    - kubernetes → kuberntes, kubenetes
 *    - environment → enviroment, environent
 *
 * 2. EXTRA LETTERS (doubled keys):
 *    - test → tesst, testt, teest
 *    - docker → dockker, dockerr, doecker
 *    - build → builld, buiild
 *
 * 3. SWAPPED LETTERS (adjacent key errors):
 *    - docker → dcoker, dokcer
 *    - build → biuld, buidl
 *    - commit → comit, commti
 *
 * 4. WRONG LETTERS (keyboard proximity on QWERTY):
 *    - test → teat, tesr, teet (e↔w, t↔r, s↔a)
 *    - git → giy, gjt, git (i↔u, j↔h)
 *    - run → eun, tun, rin (r↔e,t, u↔i)
 *
 * 5. PHONETIC SPELLINGS (sound-alike):
 *    - kubernetes → kuberneetees
 *    - cache → cashe, kash
 *    - syntax → sintax
 *
 * 6. ABBREVIATIONS & SHORTHAND:
 *    - typescript → ts
 *    - kubernetes → k8s
 *    - internationalization → i18n
 *    - accessibility → a11y
 *
 * 7. ALTERNATIVE SPELLINGS:
 *    - gray → grey
 *    - color → colour
 *    - organize → organise
 *
 * HOW TO GENERATE YOUR TYPO LIST:
 *
 * 1. Start with the correct spelling
 * 2. Add common abbreviations (if applicable)
 * 3. Think about keyboard proximity:
 *    - What keys are next to each letter on QWERTY?
 *    - q: [w, a] | w: [q, e, s, a] | e: [w, r, d, s] ...
 * 4. Consider phonetic similarity:
 *    - What sounds like your keyword?
 * 5. Check your project's history/logs:
 *    - What typos do users actually make?
 * 6. Test with colleagues:
 *    - Ask them to type your keyword quickly 5 times
 *
 * BALANCING ACT:
 *
 * ✅ DO include common, realistic typos
 * ✅ DO include standard abbreviations
 * ✅ DO include alternative spellings
 * ❌ DON'T add so many variations that you get false positives
 * ❌ DON'T include variations that are too short (2 chars)
 * ❌ DON'T include variations that overlap with other tools
 *
 * EXAMPLE: Comprehensive Docker Variations
 *
 * const dockerVariations = [
 *   'docker',          // correct
 *   'doker',           // missing c
 *   'dokcer',          // swapped c,k
 *   'dockr',           // missing e
 *   'dockerr',         // extra r
 *   'dcoker',          // swapped d,c
 *   'dokker',          // k instead of c
 *   'docker-compose',  // related tool
 *   'dockerfile',      // related file
 *   'docker compose',  // space variant
 *   'compose'          // shorthand
 * ];
 *
 * TESTING YOUR TYPO LIST:
 *
 * Test with realistic typos:
 * ✅ "How do I use typscript?" → relevant: true (missing e)
 * ✅ "What's the tsc compiler?" → relevant: true (abbreviation)
 * ✅ "Fix this typescipt error" → relevant: true (swapped letters)
 * ✅ "My typescript files..." → relevant: true (correct spelling)
 * ❌ "Script execution failed" → relevant: false (contains "script" but not "typescript")
 *
 * ADVANCED: Regex for Pattern Variations
 *
 * If you have systematic variations, use regex instead:
 *
 * // Match "docker" with optional doubled letters
 * const pattern = /\bd+o+c+k+e+r+\b/i;
 * const hasMatch = pattern.test(context.prompt);
 *
 * // Match "typescript" with optional spaces/hyphens
 * const pattern = /\btype[\s-]?script\b/i;
 * const hasMatch = pattern.test(context.prompt);
 *
 * Note: Regex is ~5-10x slower than .includes(), use only if needed.
 */
