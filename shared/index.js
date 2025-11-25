/**
 * Shared modules used by both CLI and hooks runtime.
 *
 * IMPORTANT: All modules in this directory must use ONLY Node.js built-ins.
 * No external dependencies are allowed.
 *
 * @module shared
 */

const { checkMatcherResultCore } = require('./matcher-validation-core');

module.exports = {
  checkMatcherResultCore,
};
