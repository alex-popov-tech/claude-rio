/**
 * Remove command - Remove claude-rio from project or user-level installation.
 * Removes framework hooks and all generated matchers.
 */

const path = require('path');
const chalk = require('chalk');
const fs = require('fs-extra');

/**
 * Remove hooks directory
 *
 * @param {string} targetDir - Base directory (cwd or user home)
 * @returns {Promise<boolean>} True if hooks directory was removed
 */
async function removeHooksDirectory(targetDir) {
  const hooksDir = path.join(targetDir, '.claude', 'hooks', 'rio');
  const exists = await fs.pathExists(hooksDir);

  if (exists) {
    await fs.remove(hooksDir);
    return true;
  }

  return false;
}

/**
 * Remove skill matchers
 *
 * @param {string} targetDir - Base directory (cwd or user home)
 * @returns {Promise<number>} Count of removed matchers
 */
async function removeSkillMatchers(targetDir) {
  const skillsDir = path.join(targetDir, '.claude', 'skills');
  let count = 0;

  // Check if skills directory exists
  const exists = await fs.pathExists(skillsDir);
  if (!exists) {
    return 0;
  }

  // Read all skill directories
  const entries = await fs.readdir(skillsDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const matcherPath = path.join(skillsDir, entry.name, 'rio', 'UserPromptSubmit.matcher.cjs');
      const matcherExists = await fs.pathExists(matcherPath);

      if (matcherExists) {
        await fs.remove(matcherPath);
        count++;

        // Remove empty rio directory
        const rioDir = path.join(skillsDir, entry.name, 'rio');
        const rioContents = await fs.readdir(rioDir);
        if (rioContents.length === 0) {
          await fs.remove(rioDir);
        }
      }
    }
  }

  return count;
}

/**
 * Remove agent matchers
 *
 * @param {string} targetDir - Base directory (cwd or user home)
 * @returns {Promise<number>} Count of removed matchers
 */
async function removeAgentMatchers(targetDir) {
  const agentsDir = path.join(targetDir, '.claude', 'agents');
  let count = 0;

  // Check if agents directory exists
  const exists = await fs.pathExists(agentsDir);
  if (!exists) {
    return 0;
  }

  // Find all .rio.matcher.cjs files (agent matchers)
  const entries = await fs.readdir(agentsDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith('.rio.matcher.cjs')) {
      const matcherPath = path.join(agentsDir, entry.name);
      await fs.remove(matcherPath);
      count++;
    }
  }

  return count;
}

/**
 * Clean up settings.json
 *
 * @param {string} targetDir - Base directory (cwd or user home)
 * @returns {Promise<boolean>} True if settings were modified
 */
async function cleanupSettings(targetDir) {
  const settingsPath = path.join(targetDir, '.claude', 'settings.json');

  // Check if settings file exists
  const exists = await fs.pathExists(settingsPath);
  if (!exists) {
    return false;
  }

  try {
    // Read settings
    const settingsContent = await fs.readFile(settingsPath, 'utf-8');
    const settings = JSON.parse(settingsContent);

    // Check if hooks.UserPromptSubmit exists
    if (!settings.hooks || !settings.hooks.UserPromptSubmit) {
      return false;
    }

    // Filter out rio hook entries
    const originalLength = settings.hooks.UserPromptSubmit.length;
    settings.hooks.UserPromptSubmit = settings.hooks.UserPromptSubmit.filter((hookGroup) => {
      if (!hookGroup.hooks || !Array.isArray(hookGroup.hooks)) return true;

      // Remove hookGroup if ANY hook inside it matches rio
      return !hookGroup.hooks.some(
        (hook) => hook.command && hook.command.includes('.claude/hooks/rio/')
      );
    });

    const newLength = settings.hooks.UserPromptSubmit.length;

    // If we removed entries, write back
    if (originalLength !== newLength) {
      // If the array is empty, remove the key
      if (settings.hooks.UserPromptSubmit.length === 0) {
        delete settings.hooks.UserPromptSubmit;

        // If hooks object is empty, remove it
        if (Object.keys(settings.hooks).length === 0) {
          delete settings.hooks;
        }
      }

      // Write back settings
      await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2) + '\n', 'utf-8');
      return true;
    }

    return false;
  } catch (error) {
    // If settings.json is corrupted, warn but continue
    console.log(chalk.yellow(`  ⚠ Warning: Could not parse settings.json: ${error.message}`));
    return false;
  }
}

/**
 * Execute the remove command.
 * Removes framework hooks and all generated matchers.
 *
 * @param {Object} options - Command options
 * @param {boolean} [options.user] - Remove from user level (~/.claude)
 * @returns {Promise<void>}
 */
async function removeCommand(options) {
  const isUserLevel = options.user || false;
  const targetDir = isUserLevel ? require('os').homedir() : process.cwd();
  const installationType = isUserLevel ? 'user-level' : 'project-level';

  console.log(chalk.blue.bold(`🗑️  Removing claude-rio (${installationType})...\n`));
  console.log(chalk.dim(`Target: ${targetDir}/.claude\n`));

  // Track what was removed
  const removed = {
    hooks: false,
    skillMatchers: 0,
    agentMatchers: 0,
    settings: false,
  };

  // 1. Remove hooks directory
  removed.hooks = await removeHooksDirectory(targetDir);
  if (removed.hooks) {
    console.log(chalk.green('✓ Removed hooks directory'));
  }

  // 2. Remove all skill matchers
  removed.skillMatchers = await removeSkillMatchers(targetDir);
  if (removed.skillMatchers > 0) {
    console.log(chalk.green(`✓ Removed ${removed.skillMatchers} skill matcher(s)`));
  }

  // 3. Remove all agent matchers
  removed.agentMatchers = await removeAgentMatchers(targetDir);
  if (removed.agentMatchers > 0) {
    console.log(chalk.green(`✓ Removed ${removed.agentMatchers} agent matcher(s)`));
  }

  // 4. Clean up settings.json
  removed.settings = await cleanupSettings(targetDir);
  if (removed.settings) {
    console.log(chalk.green('✓ Cleaned up settings.json'));
  }

  // 5. Print summary
  const totalRemoved =
    removed.hooks || removed.skillMatchers > 0 || removed.agentMatchers > 0 || removed.settings;

  console.log();

  if (totalRemoved) {
    console.log(chalk.green.bold('✅ claude-rio removed successfully!\n'));
    console.log(chalk.bold('Removed:'));

    if (removed.hooks) {
      console.log('  • .claude/hooks/rio/');
    }
    if (removed.skillMatchers > 0) {
      console.log(`  • ${removed.skillMatchers} skill matcher(s)`);
    }
    if (removed.agentMatchers > 0) {
      console.log(`  • ${removed.agentMatchers} agent matcher(s)`);
    }
    if (removed.settings) {
      console.log('  • Hook entries from settings.json');
    }

    console.log();
  } else {
    console.log(chalk.yellow('⊗ No claude-rio installation found\n'));
    console.log('Nothing to remove.\n');
  }
}

module.exports = removeCommand;
