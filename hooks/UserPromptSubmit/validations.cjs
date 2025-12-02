/**
 * ⚠️  DO NOT EDIT - Managed by claude-rio
 *
 * This file is installed and maintained by claude-rio.
 * Manual changes will be lost when claude-rio is updated.
 *
 * To customize behavior, create skills in .claude/skills/
 * See: .claude/docs/CREATING_SKILLS.md
 */

const { ok, err } = require('../utils/result.cjs');
const { requireNonEmptyObject, requireNonEmptyString } = require('../utils/validations.cjs');

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
 * Required schema v2.0:
 * - version: string "2.0" (non-empty, trimmed)
 * - matchCount: non-negative integer
 * - type: "skill" | "agent" | "command" (optional, defaults to path-based detection)
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
  if (result.version !== '2.0') {
    return err(`Matcher result "version" must be "2.0" (got: ${result.version}). v1.0 matchers need migration - see CHANGELOG.md`);
  }

  // Validate matchCount field (MANDATORY - no undefined/null)
  if (result.matchCount === undefined || result.matchCount === null) {
    return err('Matcher result must have a "matchCount" field (cannot be undefined or null)');
  }
  if (typeof result.matchCount !== 'number') {
    return err(`Matcher result "matchCount" must be a number (got type: ${typeof result.matchCount})`);
  }
  if (!Number.isInteger(result.matchCount)) {
    return err(`Matcher result "matchCount" must be an integer (got: ${result.matchCount})`);
  }
  if (result.matchCount < 0) {
    return err(`Matcher result "matchCount" must be non-negative (got: ${result.matchCount})`);
  }

  // Validate type field (OPTIONAL)
  if (result.type !== undefined && result.type !== null) {
    const validTypes = ['skill', 'agent', 'command'];
    if (!validTypes.includes(result.type)) {
      return err(
        `Matcher result "type" must be one of: ${validTypes.join(', ')} (got: ${result.type})`
      );
    }
  }

  return ok(result);
}

module.exports = {
  validatePayload,
  validateMatcherModule,
  validateMatcherResult,
};
