/**
 * Claude CLI availability checker
 * Verifies if the `claude` command is available in PATH
 */

const { execSync } = require('child_process');

/**
 * Check if the claude CLI is installed and available
 * @returns {boolean} True if claude command is available
 */
function isClaudeAvailable() {
  try {
    // Try to execute `command -v claude` which is POSIX-compliant
    // and works in bash, zsh, sh
    execSync('command -v claude', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  isClaudeAvailable,
};
