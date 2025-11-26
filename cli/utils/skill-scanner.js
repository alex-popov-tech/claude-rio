/**
 * Skill scanner utility
 * Scans .claude/skills/ and .claude/agents/ directories for skills, agents, and their matchers
 */

const path = require('path');
const fs = require('fs-extra');

/**
 * Scan a single directory (skills or agents) and categorize by matcher presence
 *
 * @param {string} dir - Path to .claude/skills or .claude/agents directory
 * @param {string} type - Either "skill" or "agent"
 * @returns {Promise<{needMatchers: Array<{name: string, path: string, type: string}>, haveMatchers: Array<{name: string, path: string, type: string}>}>}
 */
async function scanDirectory(dir, type) {
  // Check if directory exists
  const exists = await fs.pathExists(dir);
  if (!exists) {
    return { needMatchers: [], haveMatchers: [] };
  }

  // Read directory contents
  const entries = await fs.readdir(dir, { withFileTypes: true });

  // Filter for directories only
  const items = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => ({
      name: entry.name,
      path: path.join(dir, entry.name),
      type: type,
    }));

  // Categorize by matcher presence
  const needMatchers = [];
  const haveMatchers = [];

  for (const item of items) {
    const matcherPath = path.join(item.path, 'rio', 'UserPromptSubmit.matcher.js');
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

  const skillsResults = await scanDirectory(skillsDir, 'skill');
  const agentsResults = await scanDirectory(agentsDir, 'agent');

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
