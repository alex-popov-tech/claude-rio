/**
 * Matcher validator utility
 * Validates generated matchers both syntactically and functionally
 */

const fs = require('fs-extra');
const path = require('path');

/**
 * Validation result
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - Whether the matcher is valid
 * @property {string} [error] - Error message if invalid
 * @property {string} [details] - Additional details about the error
 */

/**
 * Create a test context for matcher validation
 * This simulates the context that matchers receive in real usage
 *
 * @returns {Object} Test context object
 */
function createTestContext() {
  return {
    prompt: 'test keywords build typescript compile check',
    cwd: process.cwd(),
    transcriptPath: '/tmp/test-transcript.jsonl',
    sessionId: 'test-session-id',
    permissionMode: 'ask',
    meta: {
      schemaVersion: '2.0',
    },
    transcript: {
      getConversationHistory: async () => [],
      getToolUsage: async () => [],
      getInitialMessage: async () => null,
      getAllMessages: async () => [],
    },
  };
}

/**
 * Validate that a matcher file exists and is syntactically correct
 *
 * @param {string} matcherPath - Path to the matcher file
 * @returns {Promise<ValidationResult>} Validation result
 */
async function validateMatcherFile(matcherPath) {
  // Check file exists
  const exists = await fs.pathExists(matcherPath);
  if (!exists) {
    return {
      valid: false,
      error: 'Matcher file not found',
      details: `Expected file at: ${matcherPath}`,
    };
  }

  // Try to require the file
  let matcherModule;
  try {
    // Clear require cache to ensure we get the latest version
    delete require.cache[path.resolve(matcherPath)];
    matcherModule = require(path.resolve(matcherPath));
  } catch (error) {
    return {
      valid: false,
      error: 'Failed to load matcher file',
      details: error.message,
    };
  }

  // Check that it exports a function
  if (typeof matcherModule !== 'function') {
    return {
      valid: false,
      error: 'Matcher must export a function',
      details: `Got type: ${typeof matcherModule}`,
    };
  }

  return { valid: true };
}

/**
 * Validate matcher result.
 *
 * IMPORTANT: All fields are MANDATORY and must not be undefined/null.
 *
 * Required schema v2.0:
 * - version: string "2.0" (non-empty, trimmed)
 * - matchCount: non-negative integer
 * - type: "skill" | "agent" | "command" (optional, defaults to path-based detection)
 *
 * @param {any} result - The result object from the matcher
 * @returns {ValidationResult} Validation result with error/details
 */
function validateMatcherResult(result) {
  // Check that result is an object
  if (!result || typeof result !== 'object') {
    return {
      valid: false,
      error: 'Matcher result must be an object',
      details: `Got type: ${typeof result}`,
    };
  }

  // Validate version field (MANDATORY - no undefined/null)
  if (result.version === undefined || result.version === null) {
    return {
      valid: false,
      error: 'Matcher result must have a "version" field (cannot be undefined or null)',
      details: 'Field is missing or null',
    };
  }
  if (typeof result.version !== 'string') {
    return {
      valid: false,
      error: 'Matcher result "version" must be a string',
      details: `Got type: ${typeof result.version}`,
    };
  }
  if (!result.version.trim()) {
    return {
      valid: false,
      error: 'Matcher result "version" must be a non-empty string',
      details: 'Version string is empty or whitespace-only',
    };
  }
  if (result.version !== '2.0') {
    return {
      valid: false,
      error: 'Matcher result "version" must be "2.0"',
      details: `Got: ${result.version}. v1.0 matchers need migration - see CHANGELOG.md`,
    };
  }

  // Validate matchCount field (MANDATORY - no undefined/null)
  if (result.matchCount === undefined || result.matchCount === null) {
    return {
      valid: false,
      error: 'Matcher result must have a "matchCount" field (cannot be undefined or null)',
      details: 'Field is missing or null',
    };
  }
  if (typeof result.matchCount !== 'number') {
    return {
      valid: false,
      error: 'Matcher result "matchCount" must be a number',
      details: `Got type: ${typeof result.matchCount}`,
    };
  }
  if (!Number.isInteger(result.matchCount)) {
    return {
      valid: false,
      error: 'Matcher result "matchCount" must be an integer',
      details: `Got: ${result.matchCount}`,
    };
  }
  if (result.matchCount < 0) {
    return {
      valid: false,
      error: 'Matcher result "matchCount" must be non-negative',
      details: `Got: ${result.matchCount}`,
    };
  }

  // Validate type field (OPTIONAL)
  if (result.type !== undefined && result.type !== null) {
    const validTypes = ['skill', 'agent', 'command'];
    if (!validTypes.includes(result.type)) {
      return {
        valid: false,
        error: `Matcher result "type" must be one of: ${validTypes.join(', ')}`,
        details: `Got: ${result.type}`,
      };
    }
  }

  return { valid: true };
}

/**
 * Validate a matcher by running it with test data
 *
 * @param {string} matcherPath - Path to the matcher file
 * @returns {Promise<ValidationResult>} Validation result
 */
async function validateMatcher(matcherPath) {
  // First validate the file exists and loads correctly
  const fileValidation = await validateMatcherFile(matcherPath);
  if (!fileValidation.valid) {
    return fileValidation;
  }

  // Load the matcher
  const matcherModule = require(path.resolve(matcherPath));

  // Create test context
  const testContext = createTestContext();

  // Try to call the matcher
  let result;
  try {
    result = await matcherModule(testContext);
  } catch (error) {
    return {
      valid: false,
      error: 'Matcher function threw an error',
      details: error.message,
    };
  }

  // Validate the result schema
  return validateMatcherResult(result);
}

module.exports = {
  validateMatcher,
  validateMatcherFile,
  validateMatcherResult,
  createTestContext,
};
