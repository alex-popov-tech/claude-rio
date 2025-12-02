/**
 * ⚠️  DO NOT EDIT - Managed by claude-rio
 *
 * This file is installed and maintained by claude-rio.
 * Manual changes will be lost when claude-rio is updated.
 *
 * To customize behavior, create skills in .claude/skills/
 * See: .claude/docs/CREATING_SKILLS.md
 */

const { ok, err } = require('./result.cjs');

/**
 * Ensure a value is a non-empty object.
 * @param {any} value
 * @param {string} name
 * @param {string} context
 * @returns {ReturnType<typeof ok>}
 */
function requireNonEmptyObject(value, name, context) {
  if (!value || typeof value !== 'object') {
    return err(`${context}: field "${name}" must be a non-empty object`);
  }
  return ok(value);
}

/**
 * Ensure a value is a non-empty string.
 * @param {any} value
 * @param {string} field
 * @param {string} context
 * @returns {ReturnType<typeof ok>}
 */
function requireNonEmptyString(value, field, context) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return err(`${context}: field "${field}" must be a non-empty string`);
  }
  return ok(value);
}

/**
 * Ensure a value is a boolean.
 * @param {any} value
 * @param {string} field
 * @param {string} context
 * @returns {ReturnType<typeof ok>}
 */
function requireBoolean(value, field, context) {
  if (typeof value !== 'boolean') {
    return err(`${context}: field "${field}" must be a boolean`);
  }
  return ok(value);
}

/**
 * @typedef {Object} MatcherResult
 * @property {string} version - Schema version (e.g., "1.0")
 * @property {boolean} relevant - Whether this skill is relevant to the prompt
 * @property {'critical' | 'high' | 'medium' | 'low'} priority - Skill priority level
 */

/**
 * Validate matcher module export.
 * @param {any} mod
 * @returns {ReturnType<typeof ok>}
 */
function validateMatcherModule(mod) {
  const fn =
    typeof mod === 'function' ? mod : mod && typeof mod.match === 'function' ? mod.match : null;

  if (typeof fn !== 'function') {
    return err('validateMatcherModule: matcher must export a function or a .match function');
  }
  return ok(fn);
}

/**
 * Validate matcher result object.
 * @param {any} result
 * @returns {{ok: boolean, value?: MatcherResult, error?: string}}
 */
function validateMatcherResult(result) {
  if (!result || typeof result !== 'object') {
    return err('Matcher result must be an object');
  }

  if (typeof result.version !== 'string' || !result.version.trim()) {
    return err("Matcher result must have a non-empty 'version' string");
  }

  if (typeof result.relevant !== 'boolean') {
    return err("Matcher result must have a 'relevant' boolean");
  }

  const validPriorities = ['critical', 'high', 'medium', 'low'];
  if (!validPriorities.includes(result.priority)) {
    return err(`Matcher result 'priority' must be one of: ${validPriorities.join(', ')}`);
  }

  return ok({
    version: result.version,
    relevant: result.relevant,
    priority: result.priority,
  });
}

module.exports = {
  requireNonEmptyObject,
  requireNonEmptyString,
  requireBoolean,
  validateMatcherModule,
  validateMatcherResult,
};
