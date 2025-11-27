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
 * Format active skills and agents with visual boxes and emoji indicators for better clarity.
 * Uses a hierarchical priority-based display system with box-drawing characters.
 *
 * @param {ActiveSkill[]} items - Array of active skills and agents
 * @returns {string} Formatted directive message
 */
function formatActiveSkillsAsDirective(items) {
  if (!items || items.length === 0) {
    return '';
  }

  // Group by priority
  const critical = items.filter((s) => s.priority === 'critical');
  const high = items.filter((s) => s.priority === 'high');
  const medium = items.filter((s) => s.priority === 'medium');
  const low = items.filter((s) => s.priority === 'low');

  // Sort by relevance within each priority group
  const relevanceOrder = { high: 0, medium: 1, low: 2 };
  const sortByRelevance = (a, b) => relevanceOrder[a.relevance] - relevanceOrder[b.relevance];

  critical.sort(sortByRelevance);
  high.sort(sortByRelevance);
  medium.sort(sortByRelevance);
  low.sort(sortByRelevance);

  // Build output with visual boxes
  let output = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
  output += '🎯 SKILL/AGENT ACTIVATION CHECK\n';
  output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

  // Critical items (required)
  if (critical.length > 0) {
    output += '⚠️  CRITICAL (REQUIRED):\n';
    critical.forEach((item) => {
      const toolInstruction =
        item.type === 'skill'
          ? `Skill tool, skill="${item.name}"`
          : `Task tool, subagent_type="${item.name}"`;
      output += `  → ${item.name}: ${toolInstruction}\n`;
    });
    output += '\n';
  }

  // High priority items (recommended)
  if (high.length > 0) {
    output += '📚 RECOMMENDED:\n';
    high.forEach((item) => {
      const toolInstruction =
        item.type === 'skill'
          ? `Skill tool, skill="${item.name}"`
          : `Task tool, subagent_type="${item.name}"`;
      output += `  → ${item.name}: ${toolInstruction}\n`;
    });
    output += '\n';
  }

  // Medium priority items (suggested)
  if (medium.length > 0) {
    output += '💡 SUGGESTED:\n';
    medium.forEach((item) => {
      const toolInstruction =
        item.type === 'skill'
          ? `Skill tool, skill="${item.name}"`
          : `Task tool, subagent_type="${item.name}"`;
      output += `  → ${item.name}: ${toolInstruction}\n`;
    });
    output += '\n';
  }

  // Low priority items (optional)
  if (low.length > 0) {
    output += '📌 OPTIONAL:\n';
    low.forEach((item) => {
      const toolInstruction =
        item.type === 'skill'
          ? `Skill tool, skill="${item.name}"`
          : `Task tool, subagent_type="${item.name}"`;
      output += `  → ${item.name}: ${toolInstruction}\n`;
    });
    output += '\n';
  }

  // Footer with action directive
  output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
  output += 'ACTION: Consider using the above tools BEFORE responding\n';
  output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';

  return output;
}

module.exports = {
  formatActiveSkillsAsDirective,
};
