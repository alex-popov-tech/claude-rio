/**
 * EXAMPLE: File System Detection Matcher
 *
 * Combines keyword matching with project file detection to determine skill relevance.
 * This pattern provides higher confidence by validating that the project actually uses
 * the technology the user is asking about.
 *
 * USE CASE:
 * Best for skills where you can detect the technology stack by checking for specific
 * files or directories. This reduces false positives significantly.
 *
 * REAL-WORLD EXAMPLES:
 * - Docker helper: Check for Dockerfile, docker-compose.yml
 * - Python helper: Check for requirements.txt, setup.py, __pycache__/, .py files
 * - Rust helper: Check for Cargo.toml, Cargo.lock, src/main.rs
 * - TypeScript helper: Check for tsconfig.json, .ts/.tsx files
 * - React helper: Check package.json for "react" dependency
 *
 * BENEFITS:
 * - Higher confidence (file presence confirms technology usage)
 * - Reduces false positives dramatically
 * - Can activate even without keywords if files are present
 * - Still fast (~5-10ms with file I/O)
 *
 * WHEN TO USE:
 * - Your technology has distinctive indicator files
 * - You want high confidence activation
 * - You want to suggest your skill for new users who don't know the keywords
 * - You want to avoid activating on projects that don't use your technology
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
  const fs = require('fs');
  const path = require('path');

  // Keywords that indicate Docker usage in the prompt
  const keywords = ['docker', 'container', 'compose', 'dockerfile'];

  // Indicator files that confirm this is a Docker project
  const indicatorFiles = [
    'Dockerfile',
    'docker-compose.yml',
    'docker-compose.yaml',
    '.dockerignore',
    'Dockerfile.dev',
    'Dockerfile.prod',
  ];

  // Check for keywords in prompt (case-insensitive)
  const prompt = context.prompt.toLowerCase();
  const hasKeyword = keywords.some((kw) => prompt.includes(kw));

  // Check for indicator files in project root
  const hasIndicatorFile = indicatorFiles.some((file) => {
    const filePath = path.join(context.cwd, file);
    return fs.existsSync(filePath);
  });

  // MULTI-SIGNAL LOGIC:
  // - Both keyword AND file present → HIGH confidence (critical/high priority)
  // - Keyword OR file present → MEDIUM confidence (medium priority)
  // - Neither present → Not relevant

  if (hasKeyword && hasIndicatorFile) {
    // STRONG SIGNAL: User mentioned Docker AND project has Docker files
    // This is the highest confidence case
    // IMPORTANT: All fields are MANDATORY and must not be undefined/null
    return {
      version: '1.0', // Required: always "1.0"
      relevant: true, // Required: true or false
      priority: 'high', // Required: "critical" | "high" | "medium" | "low"
      relevance: 'high', // Required: "high" | "medium" | "low"
    };
  }

  if (hasKeyword || hasIndicatorFile) {
    // MEDIUM SIGNAL: Either keyword or indicator file present
    // Still relevant but with lower confidence
    // IMPORTANT: All fields are MANDATORY and must not be undefined/null
    return {
      version: '1.0', // Required: always "1.0"
      relevant: true, // Required: true or false
      priority: 'medium', // Required: "critical" | "high" | "medium" | "low"
      relevance: hasKeyword ? 'high' : 'medium', // Required: "high" | "medium" | "low"
    };
  }

  // No signals detected
  // IMPORTANT: All fields are MANDATORY and must not be undefined/null
  return {
    version: '1.0', // Required: always "1.0"
    relevant: false, // Required: true or false
    priority: 'low', // Required: "critical" | "high" | "medium" | "low"
    relevance: 'low', // Required: "high" | "medium" | "low"
  };
};

/**
 * PERFORMANCE NOTES:
 * - Execution time: ~5-10ms (includes file system checks)
 * - fs.existsSync() is synchronous but very fast (~1ms per file)
 * - .some() short-circuits on first match (doesn't check all files)
 * - Consider caching results if checking many files
 * - Still much faster than network calls or heavy computation
 *
 * FILE CHECKING PATTERNS:
 *
 * 1. EXACT FILE NAMES:
 *    fs.existsSync(path.join(context.cwd, 'Dockerfile'))
 *
 * 2. FILE VARIANTS (multiple extensions):
 *    ['docker-compose.yml', 'docker-compose.yaml'].some(...)
 *
 * 3. DIRECTORY PRESENCE:
 *    fs.existsSync(path.join(context.cwd, '.git'))
 *
 * 4. MULTIPLE LOCATIONS:
 *    ['./Dockerfile', './docker/Dockerfile', './.docker/Dockerfile'].some(...)
 *
 * INDICATOR FILE EXAMPLES BY TECHNOLOGY:
 *
 * DOCKER:
 * - Dockerfile, docker-compose.yml, .dockerignore
 *
 * PYTHON:
 * - requirements.txt, setup.py, Pipfile, pyproject.toml, __pycache__/
 *
 * NODE.JS:
 * - package.json, node_modules/, package-lock.json, yarn.lock
 *
 * RUST:
 * - Cargo.toml, Cargo.lock, src/main.rs, target/
 *
 * TYPESCRIPT:
 * - tsconfig.json, .ts files, .tsx files
 *
 * GO:
 * - go.mod, go.sum, main.go
 *
 * REACT:
 * - Check package.json for "react" in dependencies
 *
 * GIT:
 * - .git/ directory
 *
 * ADVANCED PATTERNS:
 *
 * 1. CHECK FILE CONTENTS:
 *    const packagePath = path.join(context.cwd, 'package.json');
 *    if (fs.existsSync(packagePath)) {
 *      const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
 *      const hasReact = pkg.dependencies?.react || pkg.devDependencies?.react;
 *      if (hasReact) {
 *        // This is a React project
 *      }
 *    }
 *
 * 2. CHECK FOR DIRECTORIES:
 *    const gitPath = path.join(context.cwd, '.git');
 *    if (fs.existsSync(gitPath) && fs.statSync(gitPath).isDirectory()) {
 *      // This is a git repository
 *    }
 *
 * 3. PATTERN MATCHING (using glob):
 *    // Note: Requires glob package
 *    const glob = require('glob');
 *    const tsFiles = glob.sync('**\/*.ts', { cwd: context.cwd });
 *    if (tsFiles.length > 0) {
 *      // Project has TypeScript files
 *    }
 *
 * 4. SEARCH SUBDIRECTORIES:
 *    const locations = [
 *      path.join(context.cwd, 'Dockerfile'),
 *      path.join(context.cwd, 'docker', 'Dockerfile'),
 *      path.join(context.cwd, '.docker', 'Dockerfile'),
 *    ];
 *    const hasDockerfile = locations.some(loc => fs.existsSync(loc));
 *
 * MULTI-SIGNAL STRATEGIES:
 *
 * STRATEGY 1: OR Logic (inclusive)
 * - Activate if keyword OR file present
 * - Use when: You want broad activation
 * - Risk: More false positives
 *
 * STRATEGY 2: AND Logic (restrictive)
 * - Activate ONLY if keyword AND file present
 * - Use when: You want high confidence only
 * - Risk: Might miss valid cases
 *
 * STRATEGY 3: Weighted Scoring (this example)
 * - Different priority based on signal strength
 * - Both signals = HIGH priority
 * - One signal = MEDIUM priority
 * - Use when: You want nuanced activation
 *
 * STRATEGY 4: File Overrides Keyword
 * - If file present, always activate (even without keyword)
 * - If keyword present but no file, lower priority
 * - Use when: Files are very reliable indicators
 *
 * TESTING YOUR FILE DETECTION:
 *
 * Test with different project states:
 * ✅ Prompt: "Help with docker", Has Dockerfile → relevant: true, priority: high
 * ✅ Prompt: "Help with docker", No Dockerfile → relevant: true, priority: medium
 * ✅ Prompt: "Setup project", Has Dockerfile → relevant: true, priority: medium
 * ❌ Prompt: "Fix React bug", No Dockerfile → relevant: false
 *
 * TIPS:
 * - Always use path.join() for cross-platform compatibility
 * - Check for multiple file variations (.yml and .yaml)
 * - Consider checking both project root and subdirectories
 * - Balance between precision (AND logic) and recall (OR logic)
 * - File checks add ~5ms overhead but dramatically improve confidence
 * - Cache results if you need to check many files (module-level variable)
 */
