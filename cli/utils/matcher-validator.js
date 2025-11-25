/**
 * Matcher validator utility
 * Validates generated matchers both syntactically and functionally
 */

const fs = require('fs-extra');
const path = require('path');
const { checkMatcherResultCore } = require('../../shared/matcher-validation-core');

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
 * Validate matcher result using shared core validation.
 * Wraps core validation to return CLI-style {valid, error, details} format.
 *
 * @param {any} result - The result object from the matcher
 * @returns {ValidationResult} Validation result with error/details
 */
function validateMatcherResult(result) {
  const validation = checkMatcherResultCore(result);

  if (!validation.isValid) {
    // Return first error in CLI format with separate error/details fields
    const firstError = validation.errors[0];
    return {
      valid: false,
      error: firstError.message,
      details: firstError.details || `Field: ${firstError.field}, Code: ${firstError.code}`,
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
