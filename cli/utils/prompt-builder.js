/**
 * Prompt builder utility
 * Builds prompts for Claude to generate skill and agent matchers
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

## KEYWORD SELECTION FOR SKILLS

Skills are for deterministic, procedural workflows. Focus on:
- **Tool names**: "docker", "typescript", "git", "npm"
- **Commands**: "build", "compile", "test", "lint"
- **Error messages**: "type error", "build failed", "syntax error"
- **File types**: "dockerfile", "tsconfig", ".py file"
- **Technologies**: "react", "node", "python", "rust"

Priority levels for skills:
- "critical" = Build failures, blockers, urgent errors
- "high" = Running tests, compilation, important workflows
- "medium" = Linting, formatting, helpers (most common)
- "low" = Optional, nice-to-have

## EXAMPLE KEYWORDS

For a Docker skill: ['docker', 'container', 'dockerfile', 'compose', 'image']
For a TypeScript skill: ['typescript', 'type check', 'compile', 'tsc', 'build']
For a Git skill: ['git', 'commit', 'branch', 'merge', 'push']

## IMPORTANT

- ALL return fields are MANDATORY: version, relevant, priority, relevance
- Use simple keyword matching (sync function)
- Make keywords specific to avoid false positives
- Priority should typically be "medium" for most skills

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

## KEYWORD SELECTION FOR AGENTS

Agents handle complex, multi-step reasoning tasks. Focus on DELEGATION LANGUAGE:
- **Analysis keywords**: "review", "analyze", "investigate", "examine", "audit"
- **Refactoring keywords**: "refactor", "restructure", "reorganize", "improve architecture"
- **Exploration keywords**: "explore", "search through", "find all", "look for"
- **Understanding keywords**: "help me understand", "explain", "how does", "why does"
- **Complex tasks**: "plan", "design", "research", "compare alternatives"

Priority levels for agents:
- "medium" = Default for agents (they're suggestions, not urgent)
- "high" = Only for agents handling critical issues
- "low" = Agents for optional enhancements

## EXAMPLE KEYWORDS

For a Code Review agent: ['review code', 'code review', 'check for issues', 'audit', 'analyze']
For an Architecture agent: ['architecture', 'refactor', 'restructure', 'design', 'improve']
For an Exploration agent: ['explore', 'search codebase', 'find all', 'investigate', 'look through']

## IMPORTANT

- ALL return fields are MANDATORY: version, relevant, priority, relevance
- Use simple keyword matching (sync function)
- Agents typically have priority "medium" (lower than skills)
- Focus on delegation language and complex reasoning keywords

Show your reasoning briefly, then create the matcher file.`;

  return prompt;
}

/**
 * Build a prompt based on the type (skill or agent)
 *
 * @param {Object} options - Prompt building options
 * @param {string} options.type - Either "skill" or "agent"
 * @param {string} options.skillName - Name of the skill/agent
 * @param {string} options.skillPath - Path to the skill/agent directory
 * @param {string} options.matcherFilePath - Where Claude should write the matcher
 * @returns {Promise<string>} The complete prompt
 */
async function buildPrompt(options) {
  if (options.type === 'agent') {
    return buildAgentPrompt(options);
  } else {
    return buildSkillPrompt(options);
  }
}

module.exports = {
  buildPrompt,
  buildSkillPrompt,
  buildAgentPrompt,
};
