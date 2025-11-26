/**
 * ⚠️  DO NOT EDIT - Managed by claude-rio
 *
 * This file is installed and maintained by claude-rio.
 * Manual changes will be lost when claude-rio is updated.
 *
 * To customize behavior, create skills in .claude/skills/
 * See: .claude/docs/CREATING_SKILLS.md
 */

const { ok, err } = require('../utils/result');
const { requireNonEmptyObject, requireNonEmptyString } = require('../utils/validations');

/**
 * @typedef {import('./types').UserPromptSubmitPayload} UserPromptSubmitPayload
 * @typedef {import('./types').MatcherResult} MatcherResult
 */

/**
 * Validate and parse the UserPromptSubmit payload from stdin.
 * @param {any} input
 * @returns {{ok: boolean, value?: UserPromptSubmitPayload, error?: string}}
 */
function validatePayload(input) {
  const contextLabel = 'validateUserPromptSubmitPayload';

  const basePayload = requireNonEmptyObject(input, 'payload', contextLabel);
  if (!basePayload.ok) {
    return basePayload;
  }

  const promptRes = requireNonEmptyString(basePayload.value.prompt, 'prompt', contextLabel);
  if (!promptRes.ok) {
    return promptRes;
  }

  const cwdRes = requireNonEmptyString(basePayload.value.cwd, 'cwd', contextLabel);
  if (!cwdRes.ok) {
    return cwdRes;
  }

  const sessionIdRes = requireNonEmptyString(
    basePayload.value.session_id,
    'session_id',
    contextLabel
  );
  if (!sessionIdRes.ok) {
    return sessionIdRes;
  }

  const transcriptRes = requireNonEmptyString(
    basePayload.value.transcript_path,
    'transcript_path',
    contextLabel
  );
  if (!transcriptRes.ok) {
    return transcriptRes;
  }

  const permissionModeRes = requireNonEmptyString(
    basePayload.value.permission_mode,
    'permission_mode',
    contextLabel
  );
  if (!permissionModeRes.ok) {
    return permissionModeRes;
  }

  const hookEventNameRes = requireNonEmptyString(
    basePayload.value.hook_event_name,
    'hook_event_name',
    contextLabel
  );
  if (!hookEventNameRes.ok) {
    return hookEventNameRes;
  }

  /** @type {UserPromptSubmitPayload} */
  const payload = {
    sessionId: sessionIdRes.value,
    transcriptPath: transcriptRes.value,
    cwd: cwdRes.value,
    permissionMode: permissionModeRes.value,
    hookEventName: hookEventNameRes.value,
    prompt: promptRes.value,
  };

  return ok(payload);
}

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
 * @param {any} result - The matcher result to validate
 * @returns {{ok: boolean, value?: MatcherResult, error?: string}}
 */
function validateMatcherResult(result) {
  // Check that result is an object
  if (!result || typeof result !== 'object') {
    return err(`Matcher result must be an object (got type: ${typeof result})`);
  }

  // Validate version field (MANDATORY - no undefined/null)
  if (result.version === undefined || result.version === null) {
    return err('Matcher result must have a "version" field (cannot be undefined or null)');
  }
  if (typeof result.version !== 'string') {
    return err(`Matcher result "version" must be a string (got type: ${typeof result.version})`);
  }
  if (!result.version.trim()) {
    return err('Matcher result "version" must be a non-empty string');
  }
  if (result.version !== '1.0') {
    return err(`Matcher result "version" must be "1.0" (got: ${result.version})`);
  }

  // Validate relevant field (MANDATORY - no undefined/null)
  if (result.relevant === undefined || result.relevant === null) {
    return err('Matcher result must have a "relevant" field (cannot be undefined or null)');
  }
  if (typeof result.relevant !== 'boolean') {
    return err(`Matcher result "relevant" must be a boolean (got type: ${typeof result.relevant})`);
  }

  // Validate priority field (MANDATORY - no undefined/null)
  if (result.priority === undefined || result.priority === null) {
    return err('Matcher result must have a "priority" field (cannot be undefined or null)');
  }
  const validPriorities = ['critical', 'high', 'medium', 'low'];
  if (!validPriorities.includes(result.priority)) {
    return err(
      `Matcher result "priority" must be one of: ${validPriorities.join(', ')} (got: ${result.priority})`
    );
  }

  // Validate relevance field (MANDATORY - no undefined/null)
  if (result.relevance === undefined || result.relevance === null) {
    return err('Matcher result must have a "relevance" field (cannot be undefined or null)');
  }
  const validRelevances = ['high', 'medium', 'low'];
  if (!validRelevances.includes(result.relevance)) {
    return err(
      `Matcher result "relevance" must be one of: ${validRelevances.join(', ')} (got: ${result.relevance})`
    );
  }

  return ok(result);
}

module.exports = {
  validatePayload,
  validateMatcherModule,
  validateMatcherResult,
};
