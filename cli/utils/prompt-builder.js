/**
 * Prompt builder utility
 * Builds prompts for Claude to generate skill, agent, and command matchers
 */

const path = require('path');

/**
 * Get the path to the universal matcher template
 * @returns {string} Path to matchers/UserPromptSubmit.rio.matcher.cjs
 */
function getMatcherTemplatePath() {
  // Assume claude-rio is installed as a package
  // Go up from cli/utils/ to package root
  return path.join(__dirname, '..', '..', 'matchers', 'UserPromptSubmit.rio.matcher.cjs');
}

/**
 * Build a prompt for Claude to generate a UserPromptSubmit matcher for a SKILL
 *
 * @param {Object} options - Prompt building options
 * @param {string} options.skillName - Name of the skill
 * @param {string} options.skillPath - Path to the skill directory
 * @param {string} options.matcherFilePath - Where Claude should write the matcher
 * @returns {Promise<string>} The complete prompt
 */
async function buildSkillPrompt(options) {
  const { skillName, skillPath, matcherFilePath } = options;
  const templatePath = getMatcherTemplatePath();

  // Build the prompt for skill matcher generation
  const prompt = `You are generating a UserPromptSubmit matcher for a Claude Code SKILL.

## YOUR TASK

Generate a matcher for the skill: **${skillName}**

**Skill directory:** ${skillPath}
**Matcher file to create:** ${matcherFilePath}
**Matcher template:** ${templatePath}

## INSTRUCTIONS

1. Use the Read tool to read ${skillPath}/skill.md (if it exists) to understand what this skill does
2. If skill.md doesn't exist, infer from the skill name "${skillName}"
3. Use the Read tool to read the matcher template at: ${templatePath}
4. Extract 5-8 relevant keywords for this skill (tool names, error messages, commands, file types)
5. Use the Write tool to copy the template to ${matcherFilePath} and fill in the keywords array

## KEYWORD SELECTION FOR SKILLS (v2.0 Schema)

Skills are for deterministic, procedural workflows. Focus on:
- **Tool names**: "docker", "typescript", "git", "npm"
- **Commands**: "build", "compile", "test", "lint"
- **Error messages**: "type error", "build failed", "syntax error"
- **File types**: "dockerfile", "tsconfig", ".py file"
- **Technologies**: "react", "node", "python", "rust"

Matcher v2.0 returns matchCount (number of matches):
- Higher count = higher relevance
- Aim for 5-8 specific keywords

## EXAMPLE KEYWORDS

For a Docker skill: ['docker', 'container', 'dockerfile', 'compose', 'image']
For a TypeScript skill: ['typescript', 'type check', 'compile', 'tsc', 'build']
For a Git skill: ['git', 'commit', 'branch', 'merge', 'push']

## IMPORTANT - v2.0 SCHEMA

Return format: {version: "2.0", matchCount: number, type: "skill"}
- matchCount = keywords.filter(kw => prompt.includes(kw)).length
- Use .filter().length (not .some())
- type must be "skill"

Example:
  const matchCount = keywords.filter(kw => prompt.includes(kw)).length;
  return { version: '2.0', matchCount, type: 'skill' };

Show your reasoning briefly, then create the matcher file.`;

  return prompt;
}

/**
 * Build a prompt for Claude to generate a UserPromptSubmit matcher for an AGENT
 *
 * @param {Object} options - Prompt building options
 * @param {string} options.skillName - Name of the agent (using skillName for consistency)
 * @param {string} options.skillPath - Path to the agent .md file (agents are individual .md files)
 * @param {string} options.matcherFilePath - Where Claude should write the matcher
 * @returns {Promise<string>} The complete prompt
 */
async function buildAgentPrompt(options) {
  const { skillName, skillPath, matcherFilePath } = options;
  const templatePath = getMatcherTemplatePath();

  // Build the prompt for agent matcher generation
  // Note: skillPath is the full path to the .md file for agents
  const prompt = `You are generating a UserPromptSubmit matcher for a Claude Code AGENT (subagent).

## YOUR TASK

Generate a matcher for the agent: **${skillName}**

**Agent definition file:** ${skillPath}
**Matcher file to create:** ${matcherFilePath}
**Matcher template:** ${templatePath}

## INSTRUCTIONS

1. Use the Read tool to read the agent definition at: ${skillPath}
2. Use the Read tool to read the matcher template at: ${templatePath}
3. Extract 5-8 relevant keywords for this agent (delegation language, complex reasoning keywords)
4. Use the Write tool to copy the template to ${matcherFilePath} and fill in the keywords array

## KEYWORD SELECTION FOR AGENTS (v2.0 Schema)

Agents handle complex, multi-step reasoning tasks. Focus on DELEGATION LANGUAGE:
- **Analysis keywords**: "review", "analyze", "investigate", "examine", "audit"
- **Refactoring keywords**: "refactor", "restructure", "reorganize", "improve architecture"
- **Exploration keywords**: "explore", "search through", "find all", "look for"
- **Understanding keywords**: "help me understand", "explain", "how does", "why does"
- **Complex tasks**: "plan", "design", "research", "compare alternatives"

Matcher v2.0 returns matchCount (number of matches):
- Higher count = higher relevance
- Aim for 5-8 delegation keywords

## EXAMPLE KEYWORDS

For a Code Review agent: ['review code', 'code review', 'check for issues', 'audit', 'analyze']
For an Architecture agent: ['architecture', 'refactor', 'restructure', 'design', 'improve']
For an Exploration agent: ['explore', 'search codebase', 'find all', 'investigate', 'look through']

## IMPORTANT - v2.0 SCHEMA

Return format: {version: "2.0", matchCount: number, type: "agent"}
- matchCount = keywords.filter(kw => prompt.includes(kw)).length
- Use .filter().length (not .some())
- type must be "agent"

Example:
  const matchCount = keywords.filter(kw => prompt.includes(kw)).length;
  return { version: '2.0', matchCount, type: 'agent' };

Show your reasoning briefly, then create the matcher file.`;

  return prompt;
}

/**
 * Build a prompt for Claude to generate a UserPromptSubmit matcher for a COMMAND
 *
 * @param {Object} options - Prompt building options
 * @param {string} options.skillName - Name of the command (using skillName for consistency)
 * @param {string} options.skillPath - Path to the command .md file (commands are individual .md files)
 * @param {string} options.matcherFilePath - Where Claude should write the matcher
 * @returns {Promise<string>} The complete prompt
 */
async function buildCommandPrompt(options) {
  const { skillName, skillPath, matcherFilePath } = options;
  const templatePath = getMatcherTemplatePath();

  // Build the prompt for command matcher generation
  // Note: skillPath is the full path to the .md file for commands
  const prompt = `You are generating a UserPromptSubmit matcher for a Claude Code COMMAND (slash command).

## YOUR TASK

Generate a matcher for the command: **${skillName}**

**Command definition file:** ${skillPath}
**Matcher file to create:** ${matcherFilePath}
**Matcher template:** ${templatePath}

## INSTRUCTIONS

1. Use the Read tool to read the command definition at: ${skillPath}
2. Use the Read tool to read the matcher template at: ${templatePath}
3. Extract 5-8 relevant keywords for this command (action language, specific operations)
4. Use the Write tool to copy the template to ${matcherFilePath} and fill in the keywords array

## KEYWORD SELECTION FOR COMMANDS (v2.0 Schema)

Commands are slash commands invoked by users (like /deploy, /format, /test). Focus on ACTION LANGUAGE:
- **Action verbs**: "run", "execute", "deploy", "format", "check", "build", "test"
- **Operation keywords**: "commit", "push", "lint", "clean", "install", "update"
- **Workflow words**: "release", "publish", "sync", "migrate", "backup"
- **State words**: "start", "stop", "restart", "reset", "init", "setup"
- **Command-specific terms**: Based on what the command does from its .md content

Matcher v2.0 returns matchCount (number of matches):
- Higher count = higher relevance
- Aim for 5-8 action keywords

## EXAMPLE KEYWORDS

For a Deploy command: ['deploy', 'release', 'publish', 'push to production', 'ship']
For a Format command: ['format', 'prettier', 'lint', 'fix style', 'cleanup']
For a Test command: ['test', 'run tests', 'check', 'verify', 'validate']

## IMPORTANT - v2.0 SCHEMA

Return format: {version: "2.0", matchCount: number, type: "command"}
- matchCount = keywords.filter(kw => prompt.includes(kw)).length
- Use .filter().length (not .some())
- type must be "command"

Example:
  const matchCount = keywords.filter(kw => prompt.includes(kw)).length;
  return { version: '2.0', matchCount, type: 'command' };

Show your reasoning briefly, then create the matcher file.`;

  return prompt;
}

/**
 * Build a prompt based on the type (skill, agent, or command)
 *
 * @param {Object} options - Prompt building options
 * @param {string} options.type - Either "skill", "agent", or "command"
 * @param {string} options.skillName - Name of the skill/agent/command
 * @param {string} options.skillPath - Path to the skill/agent/command directory or file
 * @param {string} options.matcherFilePath - Where Claude should write the matcher
 * @returns {Promise<string>} The complete prompt
 */
async function buildPrompt(options) {
  if (options.type === 'agent') {
    return buildAgentPrompt(options);
  } else if (options.type === 'command') {
    return buildCommandPrompt(options);
  } else {
    return buildSkillPrompt(options);
  }
}

module.exports = {
  buildPrompt,
  buildSkillPrompt,
  buildAgentPrompt,
  buildCommandPrompt,
};
