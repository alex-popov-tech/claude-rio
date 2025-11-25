/**
 * Platform detection and OS-specific utilities.
 * Detects the operating system and provides appropriate file extensions and paths.
 */

const os = require('os');

/**
 * Detect the current operating system.
 * @returns {'windows' | 'macos' | 'linux' | 'unknown'}
 */
function detectOS() {
  const platform = os.platform();

  switch (platform) {
    case 'win32':
      return 'windows';
    case 'darwin':
      return 'macos';
    case 'linux':
      return 'linux';
    default:
      return 'unknown';
  }
}

/**
 * Get the appropriate shell script extension for the current OS.
 * @returns {'.ps1' | '.sh'}
 */
function getShellExtension() {
  const currentOS = detectOS();
  return currentOS === 'windows' ? '.ps1' : '.sh';
}

/**
 * Get the name of the shell wrapper file for the current OS.
 * @returns {'hook.ps1' | 'hook.sh'}
 */
function getShellWrapperName() {
  return `hook${getShellExtension()}`;
}

/**
 * Check if the current OS is Windows.
 * @returns {boolean}
 */
function isWindows() {
  return detectOS() === 'windows';
}

/**
 * Check if the current OS is Unix-like (macOS or Linux).
 * @returns {boolean}
 */
function isUnix() {
  const currentOS = detectOS();
  return currentOS === 'macos' || currentOS === 'linux';
}

/**
 * Get the appropriate command for running a hook based on OS.
 * @param {string} hookPath - Path to the hook directory
 * @returns {string} - Command to execute the hook
 */
function getHookCommand(hookPath) {
  if (isWindows()) {
    return `powershell -ExecutionPolicy Bypass -File "${hookPath}\\hook.ps1"`;
  } else {
    return `bash "${hookPath}/hook.sh"`;
  }
}

/**
 * Get platform-specific path separator.
 * @returns {string}
 */
function getPathSeparator() {
  return isWindows() ? '\\' : '/';
}

module.exports = {
  detectOS,
  getShellExtension,
  getShellWrapperName,
  isWindows,
  isUnix,
  getHookCommand,
  getPathSeparator,
};
