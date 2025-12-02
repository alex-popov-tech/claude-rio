/**
 * Setup command - Install claude-rio framework in the current project or user-level.
 * Idempotent - safe to run multiple times to update to latest version.
 */

const chalk = require('chalk');
const { copyTemplates, validateTargetDirectory } = require('../utils/copy-templates');
const { detectOS } = require('../utils/platform');

/**
 * Install the claude-rio framework
 *
 * @param {boolean} isUserLevel - Install at user level (~/) instead of project level
 * @returns {Promise<void>}
 */
async function installFramework(isUserLevel) {
  const installationType = isUserLevel ? 'user-level' : 'project-level';

  console.log(chalk.blue.bold(`🚀 Setting up claude-rio (${installationType})...\n`));

  // Determine target directory based on installation type
  const targetDir = isUserLevel ? require('os').homedir() : process.cwd();

  console.log(chalk.dim(`Target: ${targetDir}/.claude`));
  console.log(chalk.dim(`OS: ${detectOS()}\n`));

  // Validate target directory
  const validation = await validateTargetDirectory(targetDir);
  if (!validation.ok) {
    console.error(chalk.red('✗ Error:'), validation.error);
    process.exit(1);
  }

  // Copy hooks and update settings
  const result = await copyTemplates(targetDir, { isUserLevel });

  if (!result.ok) {
    console.error(chalk.red('✗ Error:'), result.error);
    process.exit(1);
  }

  // Success message
  const claudePath = isUserLevel ? '~/.claude' : '.claude';
  console.log(chalk.green.bold(`✅ claude-rio installed successfully!\n`));

  console.log(chalk.bold('What was installed:'));
  console.log(`  ✓ Hook system in ${chalk.cyan(claudePath + '/hooks/')}`);
  console.log(`  ✓ Configuration in ${chalk.cyan(claudePath + '/settings.json')}\n`);

  console.log(chalk.bold('Next steps:'));
  console.log(`  1. Create skills in ${chalk.cyan(claudePath + '/skills/')}`);
  console.log(`  2. Run ${chalk.cyan('claude-rio generate-matchers')} to create matchers`);
  console.log(`  3. See ${chalk.cyan('https://github.com/alex-popov-tech/claude-rio')} for docs\n`);

  if (isUserLevel) {
    console.log(chalk.dim('Note: User-level hooks are active for all your projects.'));
  } else {
    console.log(chalk.dim('Run Claude Code to see hooks in action!'));
  }
}

/**
 * Execute the setup command.
 *
 * @param {Object} options - Command options
 * @param {boolean} [options.user] - Install at user level (~/) instead of project level
 * @returns {Promise<void>}
 */
async function setupCommand(options) {
  const isUserLevel = options.user || false;
  await installFramework(isUserLevel);
}

module.exports = setupCommand;
