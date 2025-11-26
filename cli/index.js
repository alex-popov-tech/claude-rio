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
  .description('Setup claude-rio framework and/or generate matchers')
  .option('-u, --user', 'Install at user level (~/.claude)')
  .option('-s, --skills', 'Generate matchers for skills')
  .option('-a, --agents', 'Generate matchers for agents')
  .action(async (options) => {
    try {
      const setupCommand = require('./commands/setup');
      await setupCommand(options);
    } catch (error) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

// Future commands can be added here:
// program
//   .command('add <skill-name>')
//   .description('Add a new skill')
//   .action(async (skillName, options) => {
//     // Implementation
//   });

// program
//   .command('validate')
//   .description('Validate hook configuration')
//   .action(async () => {
//     // Implementation
//   });

program.parse();
