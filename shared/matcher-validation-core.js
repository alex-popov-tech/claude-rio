/**
 * Core matcher result validation logic (dependency-free).
 *
 * This module contains the shared validation logic used by both:
 * - hooks/UserPromptSubmit/validations.js (runtime)
 * - cli/utils/matcher-validator.js (development)
 *
 * IMPORTANT: This module must use ONLY Node.js built-ins (no external dependencies).
 * It ships with the hooks framework and must work out-of-the-box.
 *
 * @module shared/matcher-validation-core
 */

/**
 * @typedef {Object} ValidationError
 * @property {string} field - The field name that failed validation
 * @property {string} code - Error code (e.g., 'MISSING', 'INVALID_TYPE', 'INVALID_VALUE')
 * @property {string} message - Human-readable error message
 * @property {string} [details] - Additional details about the error
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - Whether validation passed
 * @property {ValidationError[]} errors - Array of validation errors (empty if valid)
 */

/**
 * Validate a matcher result object against the required schema.
 *
 * Required schema:
 * - version: string "1.0" (non-empty, trimmed)
 * - relevant: boolean
 * - priority: "critical" | "high" | "medium" | "low"
 * - relevance: "high" | "medium" | "low"
 *
 * All fields are MANDATORY and must not be undefined or null.
 *
 * @param {any} result - The matcher result to validate
 * @returns {ValidationResult} Validation result with errors array
 */
function checkMatcherResultCore(result) {
  const errors = [];

  // Check that result is an object
  if (!result || typeof result !== 'object') {
    errors.push({
      field: 'result',
      code: 'INVALID_TYPE',
      message: 'Matcher result must be an object',
      details: `Got type: ${typeof result}`,
    });
    return { isValid: false, errors };
  }

  // Validate version field (MANDATORY - no undefined/null)
  if (result.version === undefined || result.version === null) {
    errors.push({
      field: 'version',
      code: 'MISSING',
      message: 'Matcher result must have a "version" field (cannot be undefined or null)',
      details: 'Field is missing or null',
    });
  } else if (typeof result.version !== 'string') {
    errors.push({
      field: 'version',
      code: 'INVALID_TYPE',
      message: 'Matcher result "version" must be a string',
      details: `Got type: ${typeof result.version}`,
    });
  } else if (!result.version.trim()) {
    // Apply strict .trim() validation (was only in hooks before)
    errors.push({
      field: 'version',
      code: 'INVALID_VALUE',
      message: 'Matcher result "version" must be a non-empty string',
      details: 'Version string is empty or whitespace-only',
    });
  } else if (result.version !== '1.0') {
    errors.push({
      field: 'version',
      code: 'INVALID_VALUE',
      message: 'Matcher result "version" must be "1.0"',
      details: `Got: ${result.version}`,
    });
  }

  // Validate relevant field (MANDATORY - no undefined/null)
  if (result.relevant === undefined || result.relevant === null) {
    errors.push({
      field: 'relevant',
      code: 'MISSING',
      message: 'Matcher result must have a "relevant" field (cannot be undefined or null)',
      details: 'Field is missing or null',
    });
  } else if (typeof result.relevant !== 'boolean') {
    errors.push({
      field: 'relevant',
      code: 'INVALID_TYPE',
      message: 'Matcher result "relevant" must be a boolean',
      details: `Got type: ${typeof result.relevant}`,
    });
  }

  // Validate priority field (MANDATORY - no undefined/null)
  if (result.priority === undefined || result.priority === null) {
    errors.push({
      field: 'priority',
      code: 'MISSING',
      message: 'Matcher result must have a "priority" field (cannot be undefined or null)',
      details: 'Field is missing or null',
    });
  } else {
    const validPriorities = ['critical', 'high', 'medium', 'low'];
    if (!validPriorities.includes(result.priority)) {
      errors.push({
        field: 'priority',
        code: 'INVALID_VALUE',
        message: `Matcher result "priority" must be one of: ${validPriorities.join(', ')}`,
        details: `Got: ${result.priority}`,
      });
    }
  }

  // Validate relevance field (MANDATORY - no undefined/null)
  if (result.relevance === undefined || result.relevance === null) {
    errors.push({
      field: 'relevance',
      code: 'MISSING',
      message: 'Matcher result must have a "relevance" field (cannot be undefined or null)',
      details: 'Field is missing or null',
    });
  } else {
    const validRelevances = ['high', 'medium', 'low'];
    if (!validRelevances.includes(result.relevance)) {
      errors.push({
        field: 'relevance',
        code: 'INVALID_VALUE',
        message: `Matcher result "relevance" must be one of: ${validRelevances.join(', ')}`,
        details: `Got: ${result.relevance}`,
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

module.exports = {
  checkMatcherResultCore,
};
