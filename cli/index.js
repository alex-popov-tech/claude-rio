#!/usr/bin/env node
/**
 * claude-rio CLI
 * Skill-based hooks system for Claude Code CLI
 */

const { program } = require('commander');
const chalk = require('chalk');
const packageJson = require('../package.json');

program
  .name('claude-rio')
  .description('Skill-based hooks system for Claude Code CLI with two-tier architecture')
  .version(packageJson.version);

program
  .command('setup')
  .description('Install claude-rio hook framework')
  .option('-u, --user', 'Install at user level (~/.claude)')
  .action(async (options) => {
    try {
      const setupCommand = require('./commands/setup');
      await setupCommand(options);
    } catch (error) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

program
  .command('generate-matchers')
  .description('Generate matchers for all skills and agents using Claude Haiku')
  .option('-u, --user', 'Generate matchers at user level (~/.claude)')
  .option('-a, --all', 'Generate for all entities without interactive selection')
  .action(async (options) => {
    try {
      const generateMatchersCommand = require('./commands/generate-matchers');
      await generateMatchersCommand(options);
    } catch (error) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

program
  .command('remove')
  .description('Remove claude-rio framework and all generated matchers')
  .option('-u, --user', 'Remove from user level (~/.claude)')
  .action(async (options) => {
    try {
      const removeCommand = require('./commands/remove');
      await removeCommand(options);
    } catch (error) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

program.parse();
