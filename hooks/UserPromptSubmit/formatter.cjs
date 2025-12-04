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
 * Get the tool instruction string for a given item type.
 *
 * @param {ActiveSkill} item - The item to get instruction for
 * @returns {string} Tool instruction string
 */
function getToolInstruction(item) {
  if (item.type === 'skill') {
    return `Skill tool, skill="${item.name}"`;
  } else if (item.type === 'agent') {
    return `Task tool, subagent_type="${item.name}"`;
  } else {
    return `SlashCommand tool, command="/${item.name}"`;
  }
}

/**
 * Format active skills, agents, and commands with tiered relevance display.
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

  // Separate top-scoring items (score === 1.0) from others
  const topItems = items.filter((item) => item.score === 1);
  const otherItems = items.filter((item) => item.score < 1);

  // Check if all items have the same score (no tiering needed)
  const allSameScore = items.every((item) => item.score === items[0].score);

  let itemIndex = 1;

  if (allSameScore || items.length === 1) {
    // No tiering: just show all items with match counts
    items.forEach((item) => {
      const toolInstruction = getToolInstruction(item);
      output += `${itemIndex}. ${item.name} (${item.matchCount} matches): ${toolInstruction}\n`;
      itemIndex++;
    });
  } else {
    // Tiered display: BEST MATCH section + Other matches section
    if (topItems.length > 0) {
      const matchLabel = topItems.length === 1 ? 'keywords matched' : 'keywords matched each';
      output += `>>> BEST MATCH (${topItems[0].matchCount} ${matchLabel}):\n`;
      topItems.forEach((item) => {
        const toolInstruction = getToolInstruction(item);
        output += `${itemIndex}. ${item.name}: ${toolInstruction}\n`;
        itemIndex++;
      });
    }

    if (otherItems.length > 0) {
      output += '\nOther matches:\n';
      otherItems.forEach((item) => {
        const toolInstruction = getToolInstruction(item);
        output += `${itemIndex}. ${item.name} (${item.matchCount} matches): ${toolInstruction}\n`;
        itemIndex++;
      });
    }
  }

  output += '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
  output += 'ACTION: Consider using the above tools BEFORE responding\n';
  output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';

  return output;
}

module.exports = {
  formatActiveSkillsAsDirective,
};
