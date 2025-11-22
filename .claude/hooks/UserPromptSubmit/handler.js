#!/usr/bin/env node
const path = require("path");
const utils = require("../utils");
const { validatePayload, validateMatcherModule, validateMatcherResult } = require("./validations");
const { formatActiveSkillsAsDirective } = require("./formatter");

/**
 * @typedef {import('./types').UserPromptSubmitPayload} UserPromptSubmitPayload
 * @typedef {import('./types').MatcherArguments} MatcherArguments
 * @typedef {import('./types').ActiveSkill} ActiveSkill
 */

const logger = utils.logger.createLogger("hook-UserPromptSubmit-handler");

/**
 * Log an error then exit with code 1.
 * @param {string} message
 * @returns {Promise<never>}
 */
async function fail(message) {
  await logger.log({ level: "error", message });
  process.exit(1);
}

async function main() {
  const inputResult = await utils.io.readJsonFromStdin();
  if (!inputResult.ok) {
    await fail(inputResult.error);
  }

  const payloadResult = validatePayload(inputResult.value);
  if (!payloadResult.ok) {
    await fail(payloadResult.error);
  }

  const payload = payloadResult.value;
  await logger.log({ level: "info", event: "payload", payload });

  // Read matcher paths from environment variable (set by shell wrapper)
  const matcherPathsEnv = process.env.MATCHER_PATHS || "";
  const matcherPaths = matcherPathsEnv
    .split('\n')
    .map(p => p.trim())
    .filter(p => p.length > 0);

  // Build matcher file info from paths
  // Skill name is the parent directory of the matcher file
  const matcherFiles = matcherPaths.map(matcherPath => ({
    skillName: path.basename(path.dirname(matcherPath)),
    matcherPath: matcherPath
  }));

  await logger.log({
    level: "info",
    event: "matchers-discovered",
    count: matcherFiles.length,
    matchers: matcherFiles
  });

  /** @type {MatcherArguments} */
  const context = {
    // Payload data
    prompt: payload.prompt,
    cwd: payload.cwd,
    transcriptPath: payload.transcriptPath,
    permissionMode: payload.permissionMode,
    sessionId: payload.sessionId,

    // Meta information
    meta: {
      schemaVersion: "1.0",
    },

    // Transcript utilities namespace (cached)
    transcript: utils.transcript,
  };

  // Run matchers with our validation functions
  const matchResult = await runMatchers(matcherFiles, context);
  if (!matchResult.ok) {
    await fail(matchResult.error);
  }

  const activeSkills = matchResult.value || [];
  await logger.log({
    level: "info",
    event: "skills-evaluated",
    activeSkills,
  });

  if (activeSkills.length > 0) {
    const directiveMessage = formatActiveSkillsAsDirective(activeSkills);

    // Output JSON with additionalContext for better Claude integration
    const output = {
      hookSpecificOutput: {
        hookEventName: "UserPromptSubmit",
        additionalContext: directiveMessage,
      },
    };

    process.stdout.write(JSON.stringify(output) + "\n");
  }

  process.exit(0);
}

/**
 * Run matchers (supports both sync and async matchers).
 * Logs errors for failed matchers but continues processing.
 * @param {Array<{skillName: string, matcherPath: string}>} matcherFiles
 * @param {MatcherArguments} context
 * @returns {Promise<{ok: boolean, value?: ActiveSkill[], error?: string}>}
 */
async function runMatchers(matcherFiles, context) {
  /** @type {ActiveSkill[]} */
  const active = [];

  for (const matcherInfo of matcherFiles) {
    const moduleRes = utils.result.wrapSync(() => require(matcherInfo.matcherPath));
    if (!moduleRes.ok) {
      await logger.log({
        level: "error",
        event: "matcher-load-failed",
        skillName: matcherInfo.skillName,
        matcherPath: matcherInfo.matcherPath,
        error: moduleRes.error,
      });
      continue;
    }

    const validation = validateMatcherModule(moduleRes.value);
    if (!validation.ok) {
      await logger.log({
        level: "error",
        event: "matcher-invalid",
        skillName: matcherInfo.skillName,
        matcherPath: matcherInfo.matcherPath,
        error: validation.error,
      });
      continue;
    }

    const matcherFn = validation.value;
    // Support both sync and async matchers
    const execRes = await utils.result.wrapAsync(async () => await matcherFn(context));
    if (!execRes.ok) {
      await logger.log({
        level: "error",
        event: "matcher-execution-failed",
        skillName: matcherInfo.skillName,
        matcherPath: matcherInfo.matcherPath,
        error: execRes.error,
      });
      continue;
    }

    const resultValidation = validateMatcherResult(execRes.value);
    if (!resultValidation.ok) {
      await logger.log({
        level: "error",
        event: "matcher-result-invalid",
        skillName: matcherInfo.skillName,
        matcherPath: matcherInfo.matcherPath,
        error: resultValidation.error,
        returnedValue: execRes.value,
      });
      continue;
    }

    const matcherResult = resultValidation.value;
    if (matcherResult.relevant) {
      active.push({
        name: matcherInfo.skillName,
        priority: matcherResult.priority,
        relevance: matcherResult.relevance,
      });
    }
  }

  return utils.result.ok(active);
}

main();
