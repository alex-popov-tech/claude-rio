#!/usr/bin/env node
/**
 * ⚠️  DO NOT EDIT - Managed by better-hooks
 *
 * This file is installed and maintained by better-hooks.
 * Manual changes will be lost when better-hooks is updated.
 *
 * To customize behavior, create skills in .claude/skills/
 * See: .claude/docs/CREATING_SKILLS.md
 */

const path = require('path');
const utils = require('../utils');
const { validatePayload, validateMatcherModule, validateMatcherResult } = require('./validations');
const { formatActiveSkillsAsDirective } = require('./formatter');

/**
 * @typedef {import('./types').UserPromptSubmitPayload} UserPromptSubmitPayload
 * @typedef {import('./types').MatcherArguments} MatcherArguments
 * @typedef {import('./types').ActiveSkill} ActiveSkill
 */

const logger = utils.logger.createLogger('hook-UserPromptSubmit-handler');

/**
 * Log an error then exit with code 1.
 * @param {string} message
 * @returns {Promise<never>}
 */
async function fail(message) {
  await logger.log({ level: 'error', message });
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
  await logger.log({ level: 'info', event: 'payload', payload });

  // Read matcher paths from environment variable (set by shell wrapper)
  const matcherPathsEnv = process.env.MATCHER_PATHS || '';
  const matcherPaths = matcherPathsEnv
    .split('\n')
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  // Build matcher file info from paths
  // Path structure: .../skills/<name>/better-hooks/UserPromptSubmit.matcher.js
  // We need to extract <name> by going up two directories from the matcher file
  // Type is detected from the path (.claude/skills/ vs .claude/agents/)
  const matcherFiles = matcherPaths.map((matcherPath) => {
    const betterHooksDir = path.dirname(matcherPath); // .../name/better-hooks
    const itemDir = path.dirname(betterHooksDir); // .../name
    const name = path.basename(itemDir); // name
    const isAgent =
      matcherPath.includes('/.claude/agents/') || matcherPath.includes('\\.claude\\agents\\');
    return {
      name: name,
      matcherPath: matcherPath,
      detectedType: isAgent ? 'agent' : 'skill',
    };
  });

  await logger.log({
    level: 'info',
    event: 'matchers-discovered',
    count: matcherFiles.length,
    matchers: matcherFiles,
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
      schemaVersion: '1.0',
    },

    // Transcript utilities namespace (cached)
    transcript: utils.transcript,
  };

  // Run matchers with our validation functions
  const matchResult = await runMatchers(matcherFiles, context);
  if (!matchResult.ok) {
    await fail(matchResult.error);
  }

  const activeItems = matchResult.value || [];
  await logger.log({
    level: 'info',
    event: 'items-evaluated',
    activeItems,
  });

  if (activeItems.length > 0) {
    const directiveMessage = formatActiveSkillsAsDirective(activeItems);

    // Output JSON with additionalContext for better Claude integration
    const output = {
      hookSpecificOutput: {
        hookEventName: 'UserPromptSubmit',
        additionalContext: directiveMessage,
      },
    };

    process.stdout.write(JSON.stringify(output) + '\n');
  }

  process.exit(0);
}

/**
 * Run matchers (supports both sync and async matchers).
 * Logs errors for failed matchers but continues processing.
 * @param {Array<{name: string, matcherPath: string, detectedType: string}>} matcherFiles
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
        level: 'error',
        event: 'matcher-load-failed',
        name: matcherInfo.name,
        matcherPath: matcherInfo.matcherPath,
        error: moduleRes.error,
      });
      continue;
    }

    const validation = validateMatcherModule(moduleRes.value);
    if (!validation.ok) {
      await logger.log({
        level: 'error',
        event: 'matcher-invalid',
        name: matcherInfo.name,
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
        level: 'error',
        event: 'matcher-execution-failed',
        name: matcherInfo.name,
        matcherPath: matcherInfo.matcherPath,
        error: execRes.error,
      });
      continue;
    }

    const resultValidation = validateMatcherResult(execRes.value);
    if (!resultValidation.ok) {
      await logger.log({
        level: 'error',
        event: 'matcher-result-invalid',
        name: matcherInfo.name,
        matcherPath: matcherInfo.matcherPath,
        error: resultValidation.error,
        returnedValue: execRes.value,
      });
      continue;
    }

    const matcherResult = resultValidation.value;
    if (matcherResult.relevant) {
      // Use explicit type from matcher result, fallback to detected type from path
      const itemType = matcherResult.type || matcherInfo.detectedType;

      active.push({
        name: matcherInfo.name,
        priority: matcherResult.priority,
        relevance: matcherResult.relevance,
        type: itemType,
      });
    }
  }

  return utils.result.ok(active);
}

main();
