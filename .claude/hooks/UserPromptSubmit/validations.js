const { ok, err } = require("../utils/result");
const {
  requireNonEmptyObject,
  requireNonEmptyString,
} = require("../utils/validations");

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
  const contextLabel = "validateUserPromptSubmitPayload";

  const basePayload = requireNonEmptyObject(input, "payload", contextLabel);
  if (!basePayload.ok) {
    return basePayload;
  }

  const promptRes = requireNonEmptyString(
    basePayload.value.prompt,
    "prompt",
    contextLabel,
  );
  if (!promptRes.ok) {
    return promptRes;
  }

  const cwdRes = requireNonEmptyString(
    basePayload.value.cwd,
    "cwd",
    contextLabel,
  );
  if (!cwdRes.ok) {
    return cwdRes;
  }

  const sessionIdRes = requireNonEmptyString(
    basePayload.value.session_id,
    "session_id",
    contextLabel,
  );
  if (!sessionIdRes.ok) {
    return sessionIdRes;
  }

  const transcriptRes = requireNonEmptyString(
    basePayload.value.transcript_path,
    "transcript_path",
    contextLabel,
  );
  if (!transcriptRes.ok) {
    return transcriptRes;
  }

  const permissionModeRes = requireNonEmptyString(
    basePayload.value.permission_mode,
    "permission_mode",
    contextLabel,
  );
  if (!permissionModeRes.ok) {
    return permissionModeRes;
  }

  const hookEventNameRes = requireNonEmptyString(
    basePayload.value.hook_event_name,
    "hook_event_name",
    contextLabel,
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
    typeof mod === "function"
      ? mod
      : mod && typeof mod.match === "function"
        ? mod.match
        : null;

  if (typeof fn !== "function") {
    return err(
      "validateMatcherModule: matcher must export a function or a .match function",
    );
  }
  return ok(fn);
}

/**
 * Validate matcher result object.
 * @param {any} result
 * @returns {{ok: boolean, value?: MatcherResult, error?: string}}
 */
function validateMatcherResult(result) {
  if (!result || typeof result !== "object") {
    return err("Matcher result must be an object");
  }

  if (typeof result.version !== "string" || !result.version.trim()) {
    return err("Matcher result must have a non-empty 'version' string");
  }

  if (typeof result.relevant !== "boolean") {
    return err("Matcher result must have a 'relevant' boolean");
  }

  const validPriorities = ["critical", "high", "medium", "low"];
  if (!validPriorities.includes(result.priority)) {
    return err(
      `Matcher result 'priority' must be one of: ${validPriorities.join(", ")}`,
    );
  }

  const validRelevance = ["high", "medium", "low"];
  if (!validRelevance.includes(result.relevance)) {
    return err(
      `Matcher result 'relevance' must be one of: ${validRelevance.join(", ")}`,
    );
  }

  return ok(result);
}

module.exports = {
  validatePayload,
  validateMatcherModule,
  validateMatcherResult,
};
