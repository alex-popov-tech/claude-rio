/**
 * Setup command - Setup or update claude-rio in the current project.
 * Idempotent - safe to run multiple times to update to latest version.
 */

const path = require('path');
const chalk = require('chalk');
const ora = require('ora');
const { copyTemplates, validateTargetDirectory } = require('../utils/copy-templates');
const { detectOS } = require('../utils/platform');
const { isClaudeAvailable } = require('../utils/claude-checker');
const { scanSkills, getSkillsDir, getAgentsDir } = require('../utils/skill-scanner');
const { buildPrompt } = require('../utils/prompt-builder');
const { generateMatchers: generateMatchersUtil } = require('../utils/claude-generator');
const { validateMatcher } = require('../utils/matcher-validator');

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
  console.log(`  2. Add matchers to activate skills automatically`);
  console.log(`  3. See ${chalk.cyan('https://github.com/alex-popov-tech/claude-rio')} for docs\n`);

  if (isUserLevel) {
    console.log(chalk.dim('Note: User-level hooks are active for all your projects.'));
  } else {
    console.log(chalk.dim('Run Claude Code to see hooks in action!'));
  }
}

/**
 * Generate matchers for skills and/or agents
 *
 * @param {boolean} includeSkills - Generate matchers for skills
 * @param {boolean} includeAgents - Generate matchers for agents
 * @param {boolean} isUserLevel - Generate matchers at user level (~/.) instead of project level
 * @returns {Promise<void>}
 */
async function generateMatchers(includeSkills, includeAgents, isUserLevel) {
  const startTime = Date.now();

  // Determine type label for messaging
  const typeLabel =
    includeSkills && includeAgents ? 'skills and agents' : includeSkills ? 'skills' : 'agents';

  console.log(chalk.blue.bold(`🤖 Generating matchers for ${typeLabel}...\n`));

  // Step 1: Check if Claude CLI is available
  console.log(chalk.dim('Checking for Claude CLI...'));
  if (!isClaudeAvailable()) {
    console.error(chalk.red('✗ Error:'), 'Claude CLI not found');
    console.log('\nThe `claude` command must be installed and available in your PATH.');
    console.log('Install it from: https://claude.ai/download\n');
    process.exit(1);
  }
  console.log(chalk.green('✓ Claude CLI found\n'));

  // Step 2: Scan for skills and agents in the appropriate scope
  const baseDir = isUserLevel ? require('os').homedir() : process.cwd();
  const skillsDir = getSkillsDir(baseDir);
  const agentsDir = getAgentsDir(baseDir);

  console.log(chalk.dim(`Scanning ${isUserLevel ? 'user-level' : 'project-level'}:`));
  if (includeSkills) {
    console.log(chalk.dim(`  Skills: ${skillsDir}`));
  }
  if (includeAgents) {
    console.log(chalk.dim(`  Agents: ${agentsDir}`));
  }

  const { needMatchers, haveMatchers } = await scanSkills(baseDir);

  // Filter by requested types
  let filteredNeedMatchers = needMatchers;
  let filteredHaveMatchers = haveMatchers;

  if (includeSkills && !includeAgents) {
    filteredNeedMatchers = needMatchers.filter((item) => item.type === 'skill');
    filteredHaveMatchers = haveMatchers.filter((item) => item.type === 'skill');
  } else if (includeAgents && !includeSkills) {
    filteredNeedMatchers = needMatchers.filter((item) => item.type === 'agent');
    filteredHaveMatchers = haveMatchers.filter((item) => item.type === 'agent');
  }
  // If both flags, include all (no filter needed)

  const totalItems = filteredNeedMatchers.length + filteredHaveMatchers.length;

  // Handle case: no skills/agents found
  if (totalItems === 0) {
    console.log(chalk.yellow(`\n⊗ No ${typeLabel} found`));
    console.log(`\nCreate ${typeLabel} in:`);
    if (includeSkills) {
      console.log(chalk.cyan(`  ${skillsDir}`));
    }
    if (includeAgents) {
      console.log(chalk.cyan(`  ${agentsDir}`));
    }
    console.log();
    process.exit(0);
  }

  // Handle case: all items have matchers
  if (filteredNeedMatchers.length === 0) {
    console.log(chalk.green(`\n✓ All ${totalItems} ${typeLabel} already have matchers`));
    console.log(chalk.dim('Nothing to do!\n'));
    process.exit(0);
  }

  // Display summary
  const skillCount =
    filteredNeedMatchers.filter((i) => i.type === 'skill').length +
    filteredHaveMatchers.filter((i) => i.type === 'skill').length;
  const agentCount =
    filteredNeedMatchers.filter((i) => i.type === 'agent').length +
    filteredHaveMatchers.filter((i) => i.type === 'agent').length;

  console.log(
    chalk.bold(`\nFound ${totalItems} item(s): ${skillCount} skill(s), ${agentCount} agent(s)`)
  );
  if (filteredHaveMatchers.length > 0) {
    console.log(chalk.dim(`  ⊗ ${filteredHaveMatchers.length} already have matchers (skipped)`));
  }
  console.log(`  ${chalk.cyan('○')} ${filteredNeedMatchers.length} need matchers\n`);

  // Step 3: Build prompts for each skill/agent
  const skillPrompts = [];
  for (const item of filteredNeedMatchers) {
    // Different matcher paths for skills vs agents:
    // - Skills (directories): <skill-dir>/rio/UserPromptSubmit.matcher.cjs
    // - Agents (.md files): <agents-dir>/<agent-name>.rio.matcher.cjs (sibling to .md file)
    let matcherFilePath;
    if (item.type === 'agent') {
      // Agent path is the .md file, matcher is sibling with .rio.matcher.cjs extension
      matcherFilePath = item.path.replace(/\.md$/, '.rio.matcher.cjs');
    } else {
      // Skill path is the directory, matcher is in rio subdirectory
      matcherFilePath = path.join(item.path, 'rio', 'UserPromptSubmit.matcher.cjs');
    }

    const prompt = await buildPrompt({
      type: item.type, // Pass type (skill or agent)
      skillName: item.name,
      skillPath: item.path,
      matcherFilePath: matcherFilePath,
    });

    skillPrompts.push({
      skillName: item.name,
      matcherFilePath: matcherFilePath,
      prompt: prompt,
      type: item.type,
    });
  }

  // Step 4: Generate matchers in parallel with single progress spinner
  const results = {
    created: [],
    failed: [],
    completed: [], // Track completed items for summary
  };

  const totalCount = skillPrompts.length;
  let completedCount = 0;

  // Single spinner showing progress
  const spinner = ora({
    text: `Generating matchers... (0/${totalCount})`,
    color: 'cyan',
  }).start();

  // Progress callback for each skill/agent
  const onProgress = async (skillName, result) => {
    completedCount++;
    const skillPrompt = skillPrompts.find((sp) => sp.skillName === skillName);

    if (result.success) {
      // Validate the generated matcher
      const validation = await validateMatcher(skillPrompt.matcherFilePath);

      if (validation.valid) {
        results.created.push(skillPrompt.matcherFilePath);
        results.completed.push({ name: skillName, success: true });
      } else {
        results.failed.push({
          skill: skillName,
          path: skillPrompt.matcherFilePath,
          error: validation.error,
          details: validation.details,
        });
        results.completed.push({ name: skillName, success: false });
      }
    } else {
      results.failed.push({
        skill: skillName,
        error: result.error,
        stdout: result.stdout,
        stderr: result.stderr,
      });
      results.completed.push({ name: skillName, success: false });
    }

    // Update spinner text
    spinner.text = `Generating matchers... (${completedCount}/${totalCount})`;
  };

  // Generate all matchers in parallel
  await generateMatchersUtil(skillPrompts, {
    concurrency: 5,
    timeout: 60000, // 60s timeout per skill/agent
    onProgress: onProgress,
  });

  // Stop spinner and show summary
  spinner.stop();

  // Print individual results
  for (const item of results.completed) {
    if (item.success) {
      console.log(chalk.green(`  ✓ ${item.name}`));
    } else {
      console.log(chalk.red(`  ✗ ${item.name}`));
    }
  }

  // Step 5: Display results summary
  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log();

  if (results.created.length > 0) {
    console.log(
      chalk.green.bold(`✅ Created ${results.created.length} matcher(s) in ${totalTime}s\n`)
    );
    console.log(chalk.bold('Review generated matchers:'));
    results.created.forEach((filePath) => {
      console.log(chalk.dim(`  ${filePath}`));
    });
    console.log();
  }

  if (results.failed.length > 0) {
    console.log(chalk.red.bold(`❌ Failed to create ${results.failed.length} matcher(s)\n`));
    console.log(chalk.bold('Errors:'));
    results.failed.forEach((failure) => {
      console.log(chalk.red(`  ✗ ${failure.skill}:`), failure.error);
      if (failure.details) {
        console.log(chalk.dim(`    Details: ${failure.details}`));
      }
      if (failure.path) {
        console.log(chalk.dim(`    File: ${failure.path}`));
      }
      if (failure.stdout) {
        console.log(chalk.dim(`    Claude output: ${failure.stdout.substring(0, 200)}...`));
      }
      if (failure.stderr) {
        console.log(chalk.dim(`    Stderr: ${failure.stderr.substring(0, 200)}`));
      }
    });
    console.log();
    console.log(chalk.dim('For help creating matchers manually, see:'));
    console.log(chalk.cyan('  https://github.com/alex-popov-tech/claude-rio#creating-matchers\n'));

    process.exit(1);
  }
}

/**
 * Execute the setup command.
 *
 * @param {Object} options - Command options
 * @param {boolean} [options.user] - Install at user level (~/.) instead of project level
 * @param {boolean} [options.skills] - Generate matchers for skills
 * @param {boolean} [options.agents] - Generate matchers for agents
 * @returns {Promise<void>}
 */
async function setupCommand(options) {
  const isUserLevel = options.user || false;
  const shouldInstallFramework = true;
  const shouldGenerateMatchers = options.skills || options.agents;

  if (shouldInstallFramework) {
    await installFramework(isUserLevel);
  }

  // Add visual separator between operations
  if (shouldInstallFramework && shouldGenerateMatchers) {
    console.log(chalk.dim('\n' + '─'.repeat(60) + '\n'));
  }

  if (shouldGenerateMatchers) {
    await generateMatchers(options.skills || false, options.agents || false, isUserLevel);
  }
}

module.exports = setupCommand;
