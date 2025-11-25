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
    const matcherPath = path.join(item.path, 'better-hooks', 'UserPromptSubmit.matcher.js');
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
 * Scan both project and user directories for skills and agents
 * Project items take precedence over user items with the same name
 *
 * @returns {Promise<{needMatchers: Array<{name: string, path: string, type: string}>, haveMatchers: Array<{name: string, path: string, type: string}>}>}
 */
async function scanSkills() {
  const projectSkillsDir = getSkillsDir(process.cwd());
  const userSkillsDir = getSkillsDir(require('os').homedir());
  const projectAgentsDir = getAgentsDir(process.cwd());
  const userAgentsDir = getAgentsDir(require('os').homedir());

  // Scan all directories
  const projectSkillsResults = await scanDirectory(projectSkillsDir, 'skill');
  const userSkillsResults = await scanDirectory(userSkillsDir, 'skill');
  const projectAgentsResults = await scanDirectory(projectAgentsDir, 'agent');
  const userAgentsResults = await scanDirectory(userAgentsDir, 'agent');

  // Merge results, with project taking precedence over user
  const allItems = new Map();

  // Add user items first (skills and agents)
  for (const item of [...userSkillsResults.needMatchers, ...userAgentsResults.needMatchers]) {
    allItems.set(`${item.type}:${item.name}`, { ...item, needMatcher: true });
  }
  for (const item of [...userSkillsResults.haveMatchers, ...userAgentsResults.haveMatchers]) {
    allItems.set(`${item.type}:${item.name}`, { ...item, needMatcher: false });
  }

  // Override with project items (they take precedence)
  for (const item of [...projectSkillsResults.needMatchers, ...projectAgentsResults.needMatchers]) {
    allItems.set(`${item.type}:${item.name}`, { ...item, needMatcher: true });
  }
  for (const item of [...projectSkillsResults.haveMatchers, ...projectAgentsResults.haveMatchers]) {
    allItems.set(`${item.type}:${item.name}`, { ...item, needMatcher: false });
  }

  // Split back into needMatchers and haveMatchers
  const needMatchers = [];
  const haveMatchers = [];

  for (const item of allItems.values()) {
    if (item.needMatcher) {
      needMatchers.push({ name: item.name, path: item.path, type: item.type });
    } else {
      haveMatchers.push({ name: item.name, path: item.path, type: item.type });
    }
  }

  return { needMatchers, haveMatchers };
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
