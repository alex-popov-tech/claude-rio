/**
 * ⚠️  DO NOT EDIT - Managed by better-hooks
 *
 * This file is installed and maintained by better-hooks.
 * Manual changes will be lost when better-hooks is updated.
 *
 * To customize behavior, create skills in .claude/skills/
 * See: .claude/docs/CREATING_SKILLS.md
 */

const { ok, err } = require('../utils/result');
const { requireNonEmptyObject, requireNonEmptyString } = require('../utils/validations');
const { checkMatcherResultCore } = require('../../../shared/matcher-validation-core');

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
 * Validate matcher result using shared core validation.
 * Wraps core validation to return hooks-style {ok, value?, error} format.
 *
 * IMPORTANT: All fields are MANDATORY and must not be undefined/null.
 *
 * @param {any} result - The matcher result to validate
 * @returns {{ok: boolean, value?: MatcherResult, error?: string}}
 */
function validateMatcherResult(result) {
  const validation = checkMatcherResultCore(result);

  if (!validation.isValid) {
    // Return first error in hooks format
    const firstError = validation.errors[0];
    return err(firstError.message);
  }

  return ok(result);
}

module.exports = {
  validatePayload,
  validateMatcherModule,
  validateMatcherResult,
};
