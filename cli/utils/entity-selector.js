/**
 * Entity selector utility
 * Provides interactive selection for skills, agents, and commands using @clack/prompts
 */

const SELECT_ALL = '__SELECT_ALL__';

/**
 * Show interactive selection for skills, agents, and commands
 *
 * @param {Array<{name: string, path: string, type: string, hasMatcher: boolean}>} skills - Skills list
 * @param {Array<{name: string, path: string, type: string, hasMatcher: boolean}>} agents - Agents list
 * @param {Array<{name: string, path: string, type: string, hasMatcher: boolean}>} commands - Commands list
 * @returns {Promise<{skills: Array, agents: Array, commands: Array}>} Selected skills, agents, and commands
 */
async function selectEntities(skills, agents, commands = []) {
  // Dynamic import for ESM package compatibility
  const p = await import('@clack/prompts');

  // Build options with select-all at top of each group
  const options = {};

  if (skills.length > 0) {
    options['Skills'] = [
      { value: `skill:${SELECT_ALL}`, label: '[ Select all skills ]' },
      ...skills.map((s) => ({
        value: `skill:${s.name}`,
        label: s.name,
        hint: s.hasMatcher ? 'has matcher' : undefined,
      })),
    ];
  }

  if (agents.length > 0) {
    options['Agents'] = [
      { value: `agent:${SELECT_ALL}`, label: '[ Select all agents ]' },
      ...agents.map((a) => ({
        value: `agent:${a.name}`,
        label: a.name,
        hint: a.hasMatcher ? 'has matcher' : undefined,
      })),
    ];
  }

  if (commands.length > 0) {
    options['Commands'] = [
      { value: `command:${SELECT_ALL}`, label: '[ Select all commands ]' },
      ...commands.map((c) => ({
        value: `command:${c.name}`,
        label: c.name,
        hint: c.hasMatcher ? 'has matcher' : undefined,
      })),
    ];
  }

  const selected = await p.groupMultiselect({
    message: 'Select entities to generate matchers for:',
    options,
    required: false, // Allow empty selection
  });

  if (p.isCancel(selected)) {
    p.cancel('Operation cancelled.');
    process.exit(0);
  }

  // Handle empty selection
  if (!selected || selected.length === 0) {
    p.cancel('No entities selected.');
    process.exit(0);
  }

  // Process selection - expand "select all" options
  return processSelection(selected, skills, agents, commands);
}

/**
 * Process selected values and expand "select all" options
 *
 * @param {Array<string>} selected - Selected values from groupMultiselect
 * @param {Array} skills - All skills
 * @param {Array} agents - All agents
 * @param {Array} commands - All commands
 * @returns {{skills: Array, agents: Array, commands: Array}} Processed selection
 */
function processSelection(selected, skills, agents, commands = []) {
  const result = { skills: [], agents: [], commands: [] };

  const hasSkillSelectAll = selected.includes(`skill:${SELECT_ALL}`);
  const hasAgentSelectAll = selected.includes(`agent:${SELECT_ALL}`);
  const hasCommandSelectAll = selected.includes(`command:${SELECT_ALL}`);

  if (hasSkillSelectAll) {
    result.skills = skills;
  } else {
    result.skills = skills.filter((s) => selected.includes(`skill:${s.name}`));
  }

  if (hasAgentSelectAll) {
    result.agents = agents;
  } else {
    result.agents = agents.filter((a) => selected.includes(`agent:${a.name}`));
  }

  if (hasCommandSelectAll) {
    result.commands = commands;
  } else {
    result.commands = commands.filter((c) => selected.includes(`command:${c.name}`));
  }

  return result;
}

module.exports = { selectEntities };
