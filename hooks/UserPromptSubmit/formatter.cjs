/**
 * ⚠️  DO NOT EDIT - Managed by claude-rio
 *
 * This file is installed and maintained by claude-rio.
 * Manual changes will be lost when claude-rio is updated.
 *
 * To customize behavior, create skills in .claude/skills/
 * See: .claude/docs/CREATING_SKILLS.md
 */

/**
 * @typedef {import('./types').ActiveSkill} ActiveSkill
 */

/**
 * Format active skills, agents, and commands as a simple ranked list.
 * Items are already sorted by score (highest first).
 *
 * @param {ActiveSkill[]} items - Array of active skills, agents, and commands (pre-sorted by score)
 * @returns {string} Formatted directive message
 */
function formatActiveSkillsAsDirective(items) {
  if (!items || items.length === 0) {
    return '';
  }

  let output = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
  output += '🎯 RELEVANT SKILLS/AGENTS/COMMANDS\n';
  output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

  items.forEach((item, index) => {
    let toolInstruction;
    if (item.type === 'skill') {
      toolInstruction = `Skill tool, skill="${item.name}"`;
    } else if (item.type === 'agent') {
      toolInstruction = `Task tool, subagent_type="${item.name}"`;
    } else {
      toolInstruction = `SlashCommand tool, command="/${item.name}"`;
    }

    output += `${index + 1}. ${item.name}: ${toolInstruction}\n`;
  });

  output += '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
  output += 'ACTION: Consider using the above tools BEFORE responding\n';
  output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';

  return output;
}

module.exports = {
  formatActiveSkillsAsDirective,
};
