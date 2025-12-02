/**
 * Generate matchers command - Generate matchers for all skills and agents using Claude Haiku.
 */

const path = require('path');
const chalk = require('chalk');
const { isClaudeAvailable } = require('../utils/claude-checker');
const {
  scanSkills,
  getSkillsDir,
  getAgentsDir,
  getCommandsDir,
} = require('../utils/skill-scanner');
const { buildPrompt } = require('../utils/prompt-builder');
const { generateMatchers: generateMatchersUtil } = require('../utils/claude-generator');
const { validateMatcher } = require('../utils/matcher-validator');
const { selectEntities } = require('../utils/entity-selector');

/**
 * Generate matchers for all skills and agents
 *
 * @param {boolean} isUserLevel - Generate matchers at user level (~/) instead of project level
 * @param {boolean} useInteractive - Show interactive selection (default true)
 * @returns {Promise<void>}
 */
async function generateMatchers(isUserLevel, useInteractive = true) {
  const startTime = Date.now();

  // Dynamic import for @clack/prompts
  const p = await import('@clack/prompts');

  p.intro(chalk.cyan.bold('claude-rio'));

  // Step 1: Check if Claude CLI is available
  if (!isClaudeAvailable()) {
    p.outro(chalk.red('✗ Claude CLI not found'));
    console.log('\nThe `claude` command must be installed and available in your PATH.');
    console.log('Install it from: https://claude.ai/download\n');
    process.exit(1);
  }

  // Step 2: Scan for skills, agents, and commands
  const baseDir = isUserLevel ? require('os').homedir() : process.cwd();
  const skillsDir = getSkillsDir(baseDir);
  const agentsDir = getAgentsDir(baseDir);
  const commandsDir = getCommandsDir(baseDir);

  const { needMatchers, haveMatchers } = await scanSkills(baseDir);

  const totalItems = needMatchers.length + haveMatchers.length;

  // Handle case: no skills/agents/commands found
  if (totalItems === 0) {
    p.outro(chalk.yellow('⊗ No skills, agents, or commands found'));
    console.log(`\nCreate skills, agents, and commands in:`);
    console.log(chalk.cyan(`  ${skillsDir}`));
    console.log(chalk.cyan(`  ${agentsDir}`));
    console.log(chalk.cyan(`  ${commandsDir}\n`));
    process.exit(0);
  }

  // Combine all entities for selection
  const allSkills = [
    ...needMatchers.filter((i) => i.type === 'skill'),
    ...haveMatchers.filter((i) => i.type === 'skill'),
  ];
  const allAgents = [
    ...needMatchers.filter((i) => i.type === 'agent'),
    ...haveMatchers.filter((i) => i.type === 'agent'),
  ];
  const allCommands = [
    ...needMatchers.filter((i) => i.type === 'command'),
    ...haveMatchers.filter((i) => i.type === 'command'),
  ];

  // Add hasMatcher flag for hint display
  allSkills.forEach((s) => {
    s.hasMatcher = haveMatchers.some((h) => h.name === s.name && h.type === 'skill');
  });
  allAgents.forEach((a) => {
    a.hasMatcher = haveMatchers.some((h) => h.name === a.name && h.type === 'agent');
  });
  allCommands.forEach((c) => {
    c.hasMatcher = haveMatchers.some((h) => h.name === c.name && h.type === 'command');
  });

  // Step 3: Interactive selection or use all
  let selectedSkills, selectedAgents, selectedCommands;

  if (useInteractive) {
    // Show interactive selection
    const selection = await selectEntities(allSkills, allAgents, allCommands);
    selectedSkills = selection.skills;
    selectedAgents = selection.agents;
    selectedCommands = selection.commands;
  } else {
    // Use all entities (--all flag)
    selectedSkills = allSkills;
    selectedAgents = allAgents;
    selectedCommands = allCommands;
    console.log(
      chalk.dim(
        `\nGenerating for all: ${allSkills.length} skill(s), ${allAgents.length} agent(s), ${allCommands.length} command(s)`
      )
    );
  }

  // Combine selected entities
  const selectedEntities = [...selectedSkills, ...selectedAgents, ...selectedCommands];

  if (selectedEntities.length === 0) {
    p.outro(chalk.yellow('No entities selected'));
    process.exit(0);
  }

  // Step 4: Build prompts for each selected skill/agent/command
  const skillPrompts = [];
  for (const item of selectedEntities) {
    // Different matcher paths for skills vs agents vs commands:
    // - Skills (directories): <skill-dir>/rio/UserPromptSubmit.rio.matcher.cjs
    // - Agents (.md files): <agents-dir>/<agent-name>.rio.matcher.cjs (sibling to .md file)
    // - Commands (.md files): <commands-dir>/<command-name>.rio.matcher.cjs (sibling to .md file)
    let matcherFilePath;
    if (item.type === 'agent' || item.type === 'command') {
      // Agent/command path is the .md file, matcher is sibling with .rio.matcher.cjs extension
      matcherFilePath = item.path.replace(/\.md$/, '.rio.matcher.cjs');
    } else {
      // Skill path is the directory, matcher is in rio subdirectory
      matcherFilePath = path.join(item.path, 'rio', 'UserPromptSubmit.rio.matcher.cjs');
    }

    const prompt = await buildPrompt({
      type: item.type, // Pass type (skill, agent, or command)
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

  // Step 5: Generate matchers in parallel with progress spinner
  const results = {
    created: [],
    failed: [],
    completed: [], // Track completed items for summary
  };

  const totalCount = skillPrompts.length;
  let completedCount = 0;

  // Use clack spinner for progress
  const spinner = p.spinner();
  spinner.start(`Generating matchers... (0/${totalCount})`);

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

    // Update spinner message
    spinner.message(`Generating matchers... (${completedCount}/${totalCount})`);
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

  // Step 6: Display results summary
  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log();

  if (results.created.length > 0) {
    p.outro(chalk.green(`✅ Created ${results.created.length} matcher(s) in ${totalTime}s`));
    console.log(chalk.bold('\nReview generated matchers:'));
    results.created.forEach((filePath) => {
      console.log(chalk.dim(`  ${filePath}`));
    });
    console.log();
  }

  if (results.failed.length > 0) {
    p.outro(chalk.red(`❌ Failed to create ${results.failed.length} matcher(s)`));
    console.log(chalk.bold('\nErrors:'));
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

  if (results.created.length === 0 && results.failed.length === 0) {
    p.outro(chalk.dim('No matchers created'));
  }
}

/**
 * Execute the generate-matchers command.
 *
 * @param {Object} options - Command options
 * @param {boolean} [options.user] - Generate at user level (~/) instead of project level
 * @param {boolean} [options.all] - Generate for all entities without interactive selection
 * @returns {Promise<void>}
 */
async function generateMatchersCommand(options) {
  const isUserLevel = options.user || false;
  const useInteractive = !options.all; // Interactive unless --all flag is set
  await generateMatchers(isUserLevel, useInteractive);
}

module.exports = generateMatchersCommand;
