/**
 * Template copying utilities with OS-aware hook script selection.
 * Copies hooks, skills, and documentation to the target project.
 */

const fs = require('fs-extra');
const path = require('path');
const { isWindows, isUnix, getShellWrapperName } = require('./platform');

/**
 * Copy hook templates to target directory with OS-specific script selection.
 * Automatically merges with existing settings.json if present.
 *
 * @param {string} targetDir - Target project directory
 * @param {Object} options - Copy options
 * @param {boolean} [options.isUserLevel=false] - User-level installation (~/.)
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
async function copyTemplates(targetDir, options = {}) {
  const { isUserLevel = false } = options;

  try {
    // Determine source directories (flat structure in repo)
    const sourceRoot = path.join(__dirname, '..', '..');
    const hooksSource = path.join(sourceRoot, 'hooks');

    // Determine target directories (add better-hooks namespace during install)
    const claudeDir = path.join(targetDir, '.claude');
    const hooksTarget = path.join(claudeDir, 'hooks', 'better-hooks');

    // Create .claude directory structure
    await fs.ensureDir(hooksTarget);

    // Copy hooks with OS-specific filtering
    await copyHooksWithOSFilter(hooksSource, hooksTarget);

    // Create settings.json
    await createSettingsJson(claudeDir, isUserLevel);

    return { ok: true };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

/**
 * Copy hooks directory with OS-specific script filtering.
 * Only copies the appropriate shell wrapper (.sh for Unix, .ps1 for Windows).
 *
 * @param {string} source - Source hooks directory
 * @param {string} target - Target hooks directory
 * @returns {Promise<void>}
 */
async function copyHooksWithOSFilter(source, target) {
  // Get the appropriate shell wrapper name for this OS
  const shellWrapper = getShellWrapperName();
  const excludeWrapper = isWindows() ? 'hook.sh' : 'hook.ps1';

  // Copy hooks directory with filtering
  await fs.copy(source, target, {
    overwrite: true,
    filter: (src) => {
      const filename = path.basename(src);

      // Exclude the wrapper for the other OS
      if (filename === excludeWrapper) {
        return false;
      }

      // Exclude logs directory if it exists
      if (filename === 'logs' && fs.statSync(src).isDirectory()) {
        return false;
      }

      return true;
    },
  });

  // Make shell scripts executable on Unix
  if (isUnix()) {
    await makeScriptsExecutable(target);
  }
}

/**
 * Make all .sh files executable (Unix only).
 *
 * @param {string} dir - Directory to search for shell scripts
 * @returns {Promise<void>}
 */
async function makeScriptsExecutable(dir) {
  const files = await fs.readdir(dir, { withFileTypes: true });

  for (const file of files) {
    const fullPath = path.join(dir, file.name);

    if (file.isDirectory()) {
      // Recursively process subdirectories
      await makeScriptsExecutable(fullPath);
    } else if (file.name.endsWith('.sh')) {
      // Make .sh files executable (chmod +x)
      await fs.chmod(fullPath, 0o755);
    }
  }
}

/**
 * Create or merge settings.json with OS-appropriate hook commands.
 * Integrates better-hooks into existing Claude Code setup without overwriting user's existing hooks.
 *
 * @param {string} claudeDir - .claude directory path
 * @param {boolean} isUserLevel - Whether this is a user-level installation
 * @returns {Promise<void>}
 */
async function createSettingsJson(claudeDir, isUserLevel = false) {
  const settingsPath = path.join(claudeDir, 'settings.json');

  // Determine the appropriate shell command based on OS
  const shellCommand = isWindows() ? 'powershell' : 'bash';
  const hookExt = isWindows() ? 'ps1' : 'sh';

  // Determine the appropriate path variable based on installation type
  const pathVar = isUserLevel ? '$HOME' : '$CLAUDE_PROJECT_DIR';

  // Our hook commands to add
  const betterHooksCommands = {
    UserPromptSubmit: {
      type: 'command',
      command: `${shellCommand} ${pathVar}/.claude/hooks/better-hooks/UserPromptSubmit/hook.${hookExt}`,
    },
  };

  let settings = { hooks: {} };

  // Load existing settings if they exist
  if (await fs.pathExists(settingsPath)) {
    try {
      settings = await fs.readJson(settingsPath);

      // Ensure hooks object exists
      if (!settings.hooks) {
        settings.hooks = {};
      }
    } catch (error) {
      // If settings.json is malformed, start fresh but warn
      console.warn(`Warning: Could not parse existing settings.json, creating new one.`);
      settings = { hooks: {} };
    }
  }

  // Merge better-hooks into existing hooks for each hook type
  for (const [hookType, hookCommand] of Object.entries(betterHooksCommands)) {
    // Ensure the hook type array exists
    if (!settings.hooks[hookType]) {
      settings.hooks[hookType] = [];
    }

    // Check if our hook command is already present
    const alreadyExists = settings.hooks[hookType].some((hookGroup) => {
      if (!hookGroup.hooks || !Array.isArray(hookGroup.hooks)) return false;

      return hookGroup.hooks.some(
        (hook) => hook.command && hook.command.includes('.claude/hooks/better-hooks/' + hookType)
      );
    });

    // Only add if not already present
    if (!alreadyExists) {
      settings.hooks[hookType].push({
        hooks: [hookCommand],
      });
    }
  }

  await fs.writeJson(settingsPath, settings, { spaces: 2 });
}

/**
 * Validate that the target directory is suitable for installation.
 *
 * @param {string} targetDir - Target directory to validate
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
async function validateTargetDirectory(targetDir) {
  try {
    // Check if directory exists
    const exists = await fs.pathExists(targetDir);
    if (!exists) {
      return { ok: false, error: `Directory does not exist: ${targetDir}` };
    }

    // Check if directory is writable
    try {
      await fs.access(targetDir, fs.constants.W_OK);
    } catch {
      return { ok: false, error: `Directory is not writable: ${targetDir}` };
    }

    return { ok: true };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

module.exports = {
  copyTemplates,
  copyHooksWithOSFilter,
  makeScriptsExecutable,
  createSettingsJson,
  validateTargetDirectory,
};
