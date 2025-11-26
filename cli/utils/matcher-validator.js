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
      schemaVersion: '1.0',
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
 * Required schema:
 * - version: string "1.0" (non-empty, trimmed)
 * - relevant: boolean
 * - priority: "critical" | "high" | "medium" | "low"
 * - relevance: "high" | "medium" | "low"
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
  if (result.version !== '1.0') {
    return {
      valid: false,
      error: 'Matcher result "version" must be "1.0"',
      details: `Got: ${result.version}`,
    };
  }

  // Validate relevant field (MANDATORY - no undefined/null)
  if (result.relevant === undefined || result.relevant === null) {
    return {
      valid: false,
      error: 'Matcher result must have a "relevant" field (cannot be undefined or null)',
      details: 'Field is missing or null',
    };
  }
  if (typeof result.relevant !== 'boolean') {
    return {
      valid: false,
      error: 'Matcher result "relevant" must be a boolean',
      details: `Got type: ${typeof result.relevant}`,
    };
  }

  // Validate priority field (MANDATORY - no undefined/null)
  if (result.priority === undefined || result.priority === null) {
    return {
      valid: false,
      error: 'Matcher result must have a "priority" field (cannot be undefined or null)',
      details: 'Field is missing or null',
    };
  }
  const validPriorities = ['critical', 'high', 'medium', 'low'];
  if (!validPriorities.includes(result.priority)) {
    return {
      valid: false,
      error: `Matcher result "priority" must be one of: ${validPriorities.join(', ')}`,
      details: `Got: ${result.priority}`,
    };
  }

  // Validate relevance field (MANDATORY - no undefined/null)
  if (result.relevance === undefined || result.relevance === null) {
    return {
      valid: false,
      error: 'Matcher result must have a "relevance" field (cannot be undefined or null)',
      details: 'Field is missing or null',
    };
  }
  const validRelevances = ['high', 'medium', 'low'];
  if (!validRelevances.includes(result.relevance)) {
    return {
      valid: false,
      error: `Matcher result "relevance" must be one of: ${validRelevances.join(', ')}`,
      details: `Got: ${result.relevance}`,
    };
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
