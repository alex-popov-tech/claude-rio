/**
 * ⚠️  DO NOT EDIT - Managed by claude-rio
 *
 * This file is installed and maintained by claude-rio.
 * Manual changes will be lost when claude-rio is updated.
 *
 * To customize behavior, create skills in .claude/skills/
 * See: .claude/docs/CREATING_SKILLS.md
 */

const path = require('path');
const { ensureDir, appendFile } = require('./io.cjs');

const LOGS_DIR = path.join(__dirname, '..', 'logs');

/**
 * Logger instance for a specific hook.
 */
class Logger {
  /**
   * @param {string} hookName
   */
  constructor(hookName) {
    this.hookName = hookName;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    this.logPath = path.join(LOGS_DIR, `${hookName}-${today}.log`);
  }

  /**
   * Append a JSON line to the hook-specific log file.
   * Exits with code 1 on failure after writing to stderr.
   * @param {Record<string, unknown>} data
   * @returns {Promise<void>}
   */
  async log(data) {
    const ensureRes = await ensureDir(LOGS_DIR);
    if (!ensureRes.ok) {
      process.stderr.write(`Cannot create logs dir: ${ensureRes.error}\n`);
      process.exit(1);
    }

    const entry = {
      timestamp: new Date().toISOString(),
      ...data,
    };
    const line = `${JSON.stringify(entry)}\n`;

    const appendRes = await appendFile(this.logPath, line);
    if (!appendRes.ok) {
      process.stderr.write(`Cannot write log: ${appendRes.error}\n`);
      process.exit(1);
    }
  }
}

/**
 * Create a logger instance for a hook.
 * @param {string} hookName
 * @returns {Logger}
 */
function createLogger(hookName) {
  return new Logger(hookName);
}

module.exports = { createLogger, Logger };
