/**
 * Skill scanner utility
 * Scans .claude/skills/ and .claude/agents/ directories for skills, agents, and their matchers
 *
 * Note: Skills and agents have different structures per Claude Code docs:
 * - Skills: Subdirectories with SKILL.md (e.g., .claude/skills/my-skill/SKILL.md)
 * - Agents: Individual .md files (e.g., .claude/agents/my-agent.md)
 */

const path = require('path');
const fs = require('fs-extra');

/**
 * Scan skills directory for subdirectories (skills are directories with SKILL.md)
 *
 * @param {string} dir - Path to .claude/skills directory
 * @returns {Promise<{needMatchers: Array<{name: string, path: string, type: string}>, haveMatchers: Array<{name: string, path: string, type: string}>}>}
 */
async function scanSkillsDirectory(dir) {
  // Check if directory exists
  const exists = await fs.pathExists(dir);
  if (!exists) {
    return { needMatchers: [], haveMatchers: [] };
  }

  // Read directory contents
  const entries = await fs.readdir(dir, { withFileTypes: true });

  // Filter for directories only (skills are subdirectories)
  const items = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => ({
      name: entry.name,
      path: path.join(dir, entry.name),
      type: 'skill',
    }));

  // Categorize by matcher presence
  const needMatchers = [];
  const haveMatchers = [];

  for (const item of items) {
    // Skills have matchers in: <skill-dir>/rio/UserPromptSubmit.matcher.cjs
    const matcherPath = path.join(item.path, 'rio', 'UserPromptSubmit.matcher.cjs');
    const hasMatcherFile = await fs.pathExists(matcherPath);

    if (hasMatcherFile) {
      haveMatchers.push(item);
    } else {
      needMatchers.push(item);
    }
  }

  return { needMatchers, haveMatchers };
}

/**
 * Scan agents directory for .md files (agents are individual .md files)
 *
 * @param {string} dir - Path to .claude/agents directory
 * @returns {Promise<{needMatchers: Array<{name: string, path: string, type: string}>, haveMatchers: Array<{name: string, path: string, type: string}>}>}
 */
async function scanAgentsDirectory(dir) {
  // Check if directory exists
  const exists = await fs.pathExists(dir);
  if (!exists) {
    return { needMatchers: [], haveMatchers: [] };
  }

  // Read directory contents
  const entries = await fs.readdir(dir, { withFileTypes: true });

  // Filter for .md files only (agents are individual markdown files)
  const items = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => ({
      name: entry.name.replace(/\.md$/, ''), // Remove .md extension for name
      path: path.join(dir, entry.name), // Full path to the .md file
      type: 'agent',
    }));

  // Categorize by matcher presence
  const needMatchers = [];
  const haveMatchers = [];

  for (const item of items) {
    // Agents have matchers as siblings: <agents-dir>/<agent-name>.rio.matcher.cjs
    const matcherPath = path.join(dir, `${item.name}.rio.matcher.cjs`);
    const hasMatcherFile = await fs.pathExists(matcherPath);

    if (hasMatcherFile) {
      haveMatchers.push(item);
    } else {
      needMatchers.push(item);
    }
  }

  return { needMatchers, haveMatchers };
}

/**
 * Scan skills and agents in a single scope (project OR user)
 *
 * @param {string} baseDir - Base directory (process.cwd() or user home)
 * @returns {Promise<{needMatchers: Array<{name: string, path: string, type: string}>, haveMatchers: Array<{name: string, path: string, type: string}>}>}
 */
async function scanSkills(baseDir) {
  const skillsDir = getSkillsDir(baseDir);
  const agentsDir = getAgentsDir(baseDir);

  const skillsResults = await scanSkillsDirectory(skillsDir);
  const agentsResults = await scanAgentsDirectory(agentsDir);

  return {
    needMatchers: [...skillsResults.needMatchers, ...agentsResults.needMatchers],
    haveMatchers: [...skillsResults.haveMatchers, ...agentsResults.haveMatchers],
  };
}

/**
 * Get the skills directory path for a given base directory
 *
 * @param {string} baseDir - Base directory (cwd or user home)
 * @returns {string} Path to skills directory
 */
function getSkillsDir(baseDir) {
  return path.join(baseDir, '.claude', 'skills');
}

/**
 * Get the agents directory path for a given base directory
 *
 * @param {string} baseDir - Base directory (cwd or user home)
 * @returns {string} Path to agents directory
 */
function getAgentsDir(baseDir) {
  return path.join(baseDir, '.claude', 'agents');
}

module.exports = {
  scanSkills,
  getSkillsDir,
  getAgentsDir,
};
