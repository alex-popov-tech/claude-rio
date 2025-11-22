const { ok } = require("../utils/result");
const {
  requireNonEmptyObject,
  requireNonEmptyString,
  requireBoolean,
} = require("../utils/validations");

/**
 * @typedef {import('./types').StopPayload} StopPayload
 */

/**
 * Validate and parse the Stop payload from stdin.
 * @param {any} input
 * @returns {{ok: boolean, value?: StopPayload, error?: string}}
 */
function validatePayload(input) {
  const contextLabel = "validateStopPayload";

  const basePayload = requireNonEmptyObject(input, "payload", contextLabel);
  if (!basePayload.ok) {
    return basePayload;
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

  const stopHookActiveRes = requireBoolean(
    basePayload.value.stop_hook_active,
    "stop_hook_active",
    contextLabel,
  );
  if (!stopHookActiveRes.ok) {
    return stopHookActiveRes;
  }

  /** @type {StopPayload} */
  const payload = {
    sessionId: sessionIdRes.value,
    transcriptPath: transcriptRes.value,
    cwd: cwdRes.value,
    permissionMode: permissionModeRes.value,
    hookEventName: hookEventNameRes.value,
    stopHookActive: stopHookActiveRes.value,
  };

  return ok(payload);
}

module.exports = {
  validatePayload,
};
