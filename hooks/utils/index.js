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
 * Central export point for all hook utility modules.
 * Allows cleaner imports: const utils = require('./utils');
 * Usage: utils.io.readJsonFromStdin(), utils.logger.createLogger(), etc.
 */

const io = require('./io');
const logger = require('./logger');
const result = require('./result');
const validations = require('./validations');
const transcript = require('./transcript');

module.exports = {
  io,
  logger,
  result,
  validations,
  transcript,
};
