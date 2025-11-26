/**
 * ⚠️  DO NOT EDIT - Managed by claude-rio
 *
 * This file is installed and maintained by claude-rio.
 * Manual changes will be lost when claude-rio is updated.
 *
 * To customize behavior, create skills in .claude/skills/
 * See: .claude/docs/CREATING_SKILLS.md
 */

const fs = require('fs');
const readline = require('readline');

/**
 * Module-level cache for transcript data.
 * Automatically scoped to this process execution - each hook invocation
 * is a separate Node.js process, so cache is fresh each time.
 */
const cache = {};

/**
 * Get conversation history from transcript (cached).
 * Returns array of {role: 'user'|'assistant', content: string} objects.
 *
 * @param {string} transcriptPath - Path to transcript file
 * @returns {Promise<Array<{role: string, content: string}>>}
 */
async function getConversationHistory(transcriptPath) {
  if (!cache.conversationHistory) {
    cache.conversationHistory = await parseConversationHistory(transcriptPath);
  }
  return cache.conversationHistory;
}

/**
 * Get tool usage from transcript (cached).
 * Returns array of {tool: string, input: object, timestamp: string} objects.
 *
 * @param {string} transcriptPath - Path to transcript file
 * @returns {Promise<Array<{tool: string, input: object, timestamp: string}>>}
 */
async function getToolUsage(transcriptPath) {
  if (!cache.toolUsage) {
    cache.toolUsage = await parseToolUsage(transcriptPath);
  }
  return cache.toolUsage;
}

/**
 * Get the initial user message from transcript (cached).
 * Returns the content of the first user message, or null if not found.
 *
 * @param {string} transcriptPath - Path to transcript file
 * @returns {Promise<string|null>}
 */
async function getInitialMessage(transcriptPath) {
  if (!cache.initialMessage) {
    cache.initialMessage = await parseInitialMessage(transcriptPath);
  }
  return cache.initialMessage;
}

/**
 * Get all messages from transcript (cached).
 * Returns raw message objects from the transcript file.
 *
 * @param {string} transcriptPath - Path to transcript file
 * @returns {Promise<Array<object>>}
 */
async function getAllMessages(transcriptPath) {
  if (!cache.allMessages) {
    cache.allMessages = await parseAllMessages(transcriptPath);
  }
  return cache.allMessages;
}

// ============================================================================
// Internal parsing functions (not exported)
// ============================================================================

/**
 * Parse conversation history from transcript.
 * @private
 */
async function parseConversationHistory(transcriptPath) {
  const messages = await parseAllMessages(transcriptPath);
  const conversation = [];

  for (const message of messages) {
    if (message.type === 'summary') continue;

    if (message.type === 'user' && message.message?.role === 'user') {
      let content = '';

      if (typeof message.message.content === 'string') {
        content = message.message.content;
      } else if (Array.isArray(message.message.content)) {
        content = message.message.content
          .filter((item) => item.type === 'text' && item.content)
          .map((item) => item.content)
          .join('\n');
      }

      if (content) {
        conversation.push({ role: 'user', content });
      }
    } else if (message.type === 'assistant') {
      const textContent = message.message.content
        .filter((item) => item.type === 'text' && item.text)
        .map((item) => item.text)
        .join('');

      if (textContent) {
        conversation.push({ role: 'assistant', content: textContent });
      }
    }
  }

  return conversation;
}

/**
 * Parse tool usage from transcript.
 * @private
 */
async function parseToolUsage(transcriptPath) {
  const messages = await parseAllMessages(transcriptPath);
  const toolUsage = [];

  for (const message of messages) {
    if (message.type === 'assistant') {
      const toolUses = message.message.content.filter((item) => item.type === 'tool_use');

      for (const toolUse of toolUses) {
        if (toolUse.name && toolUse.input) {
          toolUsage.push({
            tool: toolUse.name,
            input: toolUse.input,
            timestamp: message.timestamp,
          });
        }
      }
    }
  }

  return toolUsage;
}

/**
 * Parse initial message from transcript.
 * @private
 */
async function parseInitialMessage(transcriptPath) {
  try {
    const fileStream = fs.createReadStream(transcriptPath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      if (!line.trim()) continue;

      try {
        const message = JSON.parse(line);

        if (message.type === 'user' && message.message?.role === 'user') {
          if (typeof message.message.content === 'string') {
            return message.message.content;
          }
        }
      } catch {
        // Skip invalid JSON lines
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Parse all messages from transcript.
 * @private
 */
async function parseAllMessages(transcriptPath) {
  const messages = [];

  try {
    const fileStream = fs.createReadStream(transcriptPath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      if (!line.trim()) continue;

      try {
        messages.push(JSON.parse(line));
      } catch {
        // Skip invalid JSON lines
      }
    }
  } catch {
    // Return empty array on error
  }

  return messages;
}

module.exports = {
  getConversationHistory,
  getToolUsage,
  getInitialMessage,
  getAllMessages,
};
