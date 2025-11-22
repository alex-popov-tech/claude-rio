/**
 * @typedef {import('./types').ActiveSkill} ActiveSkill
 */

/**
 * Format active skills with directive, action-oriented language for better Claude adherence.
 * Uses imperative instructions and explicit tool invocation syntax.
 *
 * @param {ActiveSkill[]} skills - Array of active skills
 * @returns {string} Formatted directive message
 */
function formatActiveSkillsAsDirective(skills) {
  if (!skills || skills.length === 0) {
    return "";
  }

  // Group skills by priority
  const critical = skills.filter((s) => s.priority === "critical");
  const high = skills.filter((s) => s.priority === "high");
  const medium = skills.filter((s) => s.priority === "medium");
  const low = skills.filter((s) => s.priority === "low");

  // Sort by relevance within each priority group
  const relevanceOrder = { high: 0, medium: 1, low: 2 };
  const sortByRelevance = (a, b) =>
    relevanceOrder[a.relevance] - relevanceOrder[b.relevance];

  critical.sort(sortByRelevance);
  high.sort(sortByRelevance);
  medium.sort(sortByRelevance);
  low.sort(sortByRelevance);

  let message = "";

  // Critical skills get strongest directive language
  if (critical.length > 0) {
    message += "BEFORE PROCEEDING WITH THIS REQUEST:\n\n";
    message += "CRITICAL REQUIREMENT - Auto-invoke immediately:\n";

    critical.forEach((skill, index) => {
      message += `${index + 1}. Invoke the Skill tool with parameter: skill="${skill.name}"\n`;
    });

    message += "\n";
    message += "IMPORTANT:\n";
    message += "- These skills MUST be invoked as your FIRST action\n";
    message += "- Wait for each skill to complete its workflow\n";
    message += "- Do NOT proceed with manual tool usage that these skills handle\n";
    message += "\n";
  }

  // High priority skills get strong recommendations
  if (high.length > 0) {
    if (critical.length === 0) {
      message += "BEFORE PROCEEDING:\n\n";
    }

    message += "STRONGLY RECOMMENDED - Invoke these skills:\n";
    high.forEach((skill) => {
      message += `- ${skill.name}: Use Skill tool with skill="${skill.name}"\n`;
    });
    message += "\n";
  }

  // Medium priority skills get suggestions
  if (medium.length > 0) {
    message += "SUGGESTED (consider invoking):\n";
    medium.forEach((skill) => {
      message += `- ${skill.name}: Skill tool, skill="${skill.name}"\n`;
    });
    message += "\n";
  }

  // Low priority skills get minimal mention
  if (low.length > 0) {
    message += "OPTIONAL (available if needed):\n";
    low.forEach((skill) => {
      message += `- ${skill.name}\n`;
    });
    message += "\n";
  }

  return message.trim();
}

module.exports = {
  formatActiveSkillsAsDirective,
};
