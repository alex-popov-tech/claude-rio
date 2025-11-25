/**
 * ⚠️  DO NOT EDIT - Managed by better-hooks
 *
 * This file is installed and maintained by better-hooks.
 * Manual changes will be lost when better-hooks is updated.
 *
 * To customize behavior, create skills in .claude/skills/
 * See: .claude/docs/CREATING_SKILLS.md
 */

/**
 * Small helpers for result-style error handling.
 * @template T
 * @param {T} value
 * @returns {{ ok: true, value: T }}
 */
function ok(value) {
  return { ok: true, value };
}

/**
 * @param {string} error
 * @returns {{ ok: false, error: string }}
 */
function err(error) {
  return { ok: false, error };
}

/**
 * Wrap a synchronous function into a result object.
 * @template T
 * @param {() => T} fn
 * @returns {{ ok: true, value: T } | { ok: false, error: string }}
 */
function wrapSync(fn) {
  try {
    return ok(fn());
  } catch (error) {
    return err(error && error.message ? error.message : String(error));
  }
}

/**
 * Wrap an async function into a result object.
 * @template T
 * @param {() => Promise<T>} fn
 * @returns {Promise<{ ok: true, value: T } | { ok: false, error: string }>}
 */
async function wrapAsync(fn) {
  try {
    const value = await fn();
    return ok(value);
  } catch (error) {
    return err(error && error.message ? error.message : String(error));
  }
}

module.exports = { ok, err, wrapSync, wrapAsync };
