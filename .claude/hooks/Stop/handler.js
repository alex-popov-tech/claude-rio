#!/usr/bin/env node
const utils = require("../utils");
const { validatePayload } = require("./validations");

/**
 * @typedef {import('./types').StopPayload} StopPayload
 */

const logger = utils.logger.createLogger("hook-Stop-handler");

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

  process.exit(0);
}

main();
