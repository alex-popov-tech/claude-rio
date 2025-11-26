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
 * Format active skills and agents with directive, action-oriented language for better Claude adherence.
 * Uses imperative instructions and explicit tool invocation syntax.
 *
 * @param {ActiveSkill[]} items - Array of active skills and agents
 * @returns {string} Formatted directive message
 */
function formatActiveSkillsAsDirective(items) {
  if (!items || items.length === 0) {
    return '';
  }

  // Separate skills from agents
  const skills = items.filter((item) => item.type === 'skill');
  const agents = items.filter((item) => item.type === 'agent');

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

  let message = '';

  // Critical items get strongest directive language
  if (critical.length > 0) {
    message += 'BEFORE PROCEEDING WITH THIS REQUEST:\n\n';
    message += 'CRITICAL REQUIREMENT - Auto-invoke immediately:\n';

    critical.forEach((item, index) => {
      if (item.type === 'skill') {
        message += `${index + 1}. Invoke the Skill tool with parameter: skill="${item.name}"\n`;
      } else if (item.type === 'agent') {
        message += `${index + 1}. Delegate to subagent using Task tool with parameter: subagent_type="${item.name}"\n`;
      }
    });

    message += '\n';
    message += 'IMPORTANT:\n';
    message += '- These MUST be invoked as your FIRST action\n';
    message += '- Wait for each to complete its workflow\n';
    message += '- Do NOT proceed with manual tool usage that these handle\n';
    message += '\n';
  }

  // High priority items get strong recommendations
  if (high.length > 0) {
    if (critical.length === 0) {
      message += 'BEFORE PROCEEDING:\n\n';
    }

    message += 'STRONGLY RECOMMENDED:\n';
    high.forEach((item) => {
      if (item.type === 'skill') {
        message += `- ${item.name}: Use Skill tool with skill="${item.name}"\n`;
      } else if (item.type === 'agent') {
        message += `- ${item.name}: Delegate using Task tool with subagent_type="${item.name}"\n`;
      }
    });
    message += '\n';
  }

  // Medium priority items get suggestions
  if (medium.length > 0) {
    message += 'SUGGESTED (consider invoking):\n';
    medium.forEach((item) => {
      if (item.type === 'skill') {
        message += `- ${item.name}: Skill tool, skill="${item.name}"\n`;
      } else if (item.type === 'agent') {
        message += `- ${item.name}: Task tool, subagent_type="${item.name}"\n`;
      }
    });
    message += '\n';
  }

  // Low priority items get minimal mention
  if (low.length > 0) {
    message += 'OPTIONAL (available if needed):\n';
    low.forEach((item) => {
      message += `- ${item.name} (${item.type})\n`;
    });
    message += '\n';
  }

  return message.trim();
}

module.exports = {
  formatActiveSkillsAsDirective,
};
