/**
 * EXAMPLE: Conversation History Aware Matcher
 *
 * Uses conversation history to make context-aware activation decisions. This is an
 * ASYNC matcher that analyzes previous messages to detect patterns, repeated issues,
 * and session context.
 *
 * USE CASE:
 * Best for skills where context from previous messages helps determine relevance:
 * - Detecting repeated issues that need specialized help
 * - Noticing patterns in the conversation
 * - Understanding session-wide context
 * - Following up on previously mentioned but unused topics
 *
 * REAL-WORLD EXAMPLES:
 * - TypeScript helper: Activate with high priority if previous messages had type errors
 * - Debugger helper: Activate if user mentioned "error" or "bug" multiple times
 * - Test runner: Activate if tests were mentioned but haven't been run yet
 * - Git helper: Activate if changes were discussed but no commits were made
 * - Performance analyzer: Activate if user mentioned "slow" repeatedly
 *
 * BENEFITS:
 * - Context-aware activation (understands conversation flow)
 * - Can escalate priority based on repeated issues
 * - Catches cases where keywords weren't used but context suggests relevance
 * - Cached transcript parsing (first call ~50-200ms, subsequent <1ms)
 *
 * WHEN TO USE:
 * - Your skill helps with recurring issues
 * - Context from previous messages matters
 * - You want to suggest help when users struggle repeatedly
 * - You want to remind users of previously mentioned but unused tools
 *
 * @param {Object} context - Matcher context
 * @param {string} context.prompt - User's prompt text
 * @param {string} context.cwd - Current working directory
 * @param {string} context.transcriptPath - Path to conversation transcript
 * @param {string} context.permissionMode - "ask" | "allow"
 * @param {string} context.sessionId - Session ID
 * @param {Object} context.meta - Meta information
 * @param {Object} context.transcript - Transcript utilities (CACHED)
 * @param {Function} context.transcript.getConversationHistory - Get messages array
 * @param {Function} context.transcript.getToolUsage - Get tool usage history
 * @param {Function} context.transcript.getInitialMessage - Get first user message
 * @param {Function} context.transcript.getAllMessages - Get raw messages
 * @returns {Promise<Object>} Matcher result (NOTE: This is async!)
 */
module.exports = async function (context) {
  // Keywords for TypeScript compilation
  const keywords = ['typescript', 'type', 'compile', 'tsc', 'build'];

  // Quick synchronous check: is there a keyword in current prompt?
  const prompt = context.prompt.toLowerCase();
  const hasKeyword = keywords.some((kw) => prompt.includes(kw));

  // If no keyword in current prompt, check if TypeScript was discussed recently
  if (!hasKeyword) {
    // Load conversation history (cached - only parses once per hook invocation)
    const history = await context.transcript.getConversationHistory(context.transcriptPath);

    // Look at recent messages (last 10) to see if TypeScript was mentioned
    const recentMessages = history.slice(-10);
    const wasRecentlyMentioned = recentMessages.some((msg) =>
      keywords.some((kw) => msg.content.toLowerCase().includes(kw))
    );

    if (!wasRecentlyMentioned) {
      // No keyword in prompt, no recent history → not relevant
      // IMPORTANT: All fields are MANDATORY and must not be undefined/null
      return {
        version: '1.0', // Required: always "1.0"
        relevant: false, // Required: true or false
        priority: 'low', // Required: "critical" | "high" | "medium" | "low"
        relevance: 'low', // Required: "high" | "medium" | "low"
      };
    }

    // Was mentioned recently but not in current prompt
    // Suggest with lower priority (staying relevant from context)
    // IMPORTANT: All fields are MANDATORY and must not be undefined/null
    return {
      version: '1.0', // Required: always "1.0"
      relevant: true, // Required: true or false
      priority: 'low', // Required: "critical" | "high" | "medium" | "low"
      relevance: 'medium', // Required: "high" | "medium" | "low"
    };
  }

  // Keyword IS present in current prompt
  // Now check conversation history to determine priority and relevance

  // Load conversation history (cached)
  const history = await context.transcript.getConversationHistory(context.transcriptPath);

  // Check for previous TypeScript errors in assistant messages
  const hadPreviousErrors = history.some(
    (msg) =>
      msg.role === 'assistant' &&
      (msg.content.includes('type error') ||
        msg.content.includes('compilation error') ||
        msg.content.includes('TypeScript error') ||
        msg.content.includes('TS'))
  );

  // Count how many times TypeScript was mentioned in the conversation
  const mentionCount = history.filter((msg) =>
    keywords.some((kw) => msg.content.toLowerCase().includes(kw))
  ).length;

  // Check if this is a follow-up to a previous TypeScript discussion
  const recentMessages = history.slice(-5);
  const isFollowUp = recentMessages.some((msg) =>
    keywords.some((kw) => msg.content.toLowerCase().includes(kw))
  );

  // PRIORITY ESCALATION based on conversation context:
  //
  // CRITICAL: Previous errors detected (user is struggling)
  // HIGH: Multiple mentions (3+) OR follow-up question
  // MEDIUM: First or second mention
  // LOW: Not applicable (already returned above)

  if (hadPreviousErrors) {
    // User had TypeScript errors before and is asking about it again
    // This is CRITICAL - they need help resolving ongoing issues
    // IMPORTANT: All fields are MANDATORY and must not be undefined/null
    return {
      version: '1.0', // Required: always "1.0"
      relevant: true, // Required: true or false
      priority: 'critical', // Required: "critical" | "high" | "medium" | "low"
      relevance: 'high', // Required: "high" | "medium" | "low"
    };
  }

  if (mentionCount >= 3 || (isFollowUp && mentionCount >= 2)) {
    // Topic mentioned multiple times or this is a follow-up
    // User is working on TypeScript-related tasks → HIGH priority
    // IMPORTANT: All fields are MANDATORY and must not be undefined/null
    return {
      version: '1.0', // Required: always "1.0"
      relevant: true, // Required: true or false
      priority: 'high', // Required: "critical" | "high" | "medium" | "low"
      relevance: 'high', // Required: "high" | "medium" | "low"
    };
  }

  // First or second mention → MEDIUM priority
  // IMPORTANT: All fields are MANDATORY and must not be undefined/null
  return {
    version: '1.0', // Required: always "1.0"
    relevant: true, // Required: true or false
    priority: 'medium', // Required: "critical" | "high" | "medium" | "low"
    relevance: 'high', // Required: "high" | "medium" | "low"
  };
};

/**
 * PERFORMANCE NOTES:
 * - First transcript utility call: ~50-200ms (parses transcript file)
 * - Subsequent calls in same hook invocation: <1ms (cached)
 * - If multiple matchers use transcript, only first one parses
 * - Async overhead is minimal when cached
 * - Short-circuit logic minimizes async calls (checks keyword first)
 *
 * TRANSCRIPT UTILITIES API:
 *
 * All utilities are accessed via context.transcript and are CACHED per hook invocation.
 *
 * 1. getConversationHistory(transcriptPath)
 *    Returns: Array<{role: 'user' | 'assistant', content: string}>
 *    Use for: Analyzing conversation flow and discussion topics
 *    Example:
 *      const history = await context.transcript.getConversationHistory(path);
 *      history.forEach(msg => {
 *        console.log(`${msg.role}: ${msg.content}`);
 *      });
 *
 * 2. getToolUsage(transcriptPath)
 *    Returns: Array<{tool: string, input: object, timestamp: string}>
 *    Use for: Detecting what actions/tools were already used
 *    Example:
 *      const tools = await context.transcript.getToolUsage(path);
 *      const ranTests = tools.some(t => t.tool === 'Bash' && t.input.includes('test'));
 *
 * 3. getInitialMessage(transcriptPath)
 *    Returns: string | null (first user message)
 *    Use for: Understanding the original user intent/goal
 *    Example:
 *      const initial = await context.transcript.getInitialMessage(path);
 *      if (initial.includes('build a new feature')) { ... }
 *
 * 4. getAllMessages(transcriptPath)
 *    Returns: Array<Message> (raw message objects with full metadata)
 *    Use for: Advanced analysis needing full message structure
 *
 * PATTERN DETECTION STRATEGIES:
 *
 * 1. REPEATED ISSUES:
 *    Count error mentions across messages:
 *      const errorCount = history.filter(msg =>
 *        msg.content.toLowerCase().includes('error')
 *      ).length;
 *      if (errorCount >= 3) { priority = "critical"; }
 *
 * 2. UNRESOLVED DISCUSSIONS:
 *    Check if topic mentioned but tool never used:
 *      const mentionedTests = history.some(msg => msg.content.includes('test'));
 *      const ranTests = toolUsage.some(t => t.tool === 'Bash' && t.input.includes('test'));
 *      if (mentionedTests && !ranTests) { priority = "high"; }
 *
 * 3. ESCALATING FRUSTRATION:
 *    Look for repeated similar questions:
 *      const recentQuestions = history.slice(-5).filter(msg => msg.role === 'user');
 *      const similarityScore = calculateSimilarity(recentQuestions);
 *      if (similarityScore > 0.7) { priority = "critical"; }
 *
 * 4. SESSION CONTEXT:
 *    Determine what user is working on:
 *      const initial = await context.transcript.getInitialMessage(path);
 *      if (initial.includes('refactor')) { // suggest architecture tools }
 *
 * 5. RECENCY BIAS:
 *    Prioritize recent messages over old ones:
 *      const recentMessages = history.slice(-10);  // Last 10 messages
 *      const olderMessages = history.slice(0, -10);
 *
 * HISTORY ANALYSIS EXAMPLES:
 *
 * EXAMPLE 1: Detect Repeated Errors
 *    const errorMentions = history.filter(msg =>
 *      msg.role === 'assistant' &&
 *      (msg.content.includes('error') || msg.content.includes('failed'))
 *    ).length;
 *
 *    if (errorMentions >= 3) {
 *      return { relevant: true, priority: "critical", relevance: "high" };
 *    }
 *
 * EXAMPLE 2: Check If Tool Was Used
 *    const toolUsage = await context.transcript.getToolUsage(path);
 *    const ranBuild = toolUsage.some(t =>
 *      t.tool === 'Bash' && t.input.includes('build')
 *    );
 *
 *    if (hasKeyword && !ranBuild) {
 *      // User mentioned build but hasn't run it yet
 *      return { relevant: true, priority: "high", relevance: "high" };
 *    }
 *
 * EXAMPLE 3: Detect Follow-up Questions
 *    const lastUserMessage = history.filter(m => m.role === 'user').slice(-1)[0];
 *    const isFollowUp = lastUserMessage.content.toLowerCase().startsWith('and') ||
 *                       lastUserMessage.content.toLowerCase().startsWith('also');
 *
 * EXAMPLE 4: Count Topic Mentions
 *    const topicCount = history.filter(msg =>
 *      keywords.some(kw => msg.content.toLowerCase().includes(kw))
 *    ).length;
 *
 * TIPS FOR ASYNC MATCHERS:
 *
 * 1. ALWAYS do synchronous checks FIRST:
 *    - Check keywords in current prompt before loading history
 *    - Only call async functions when needed
 *    - This minimizes latency when history isn't needed
 *
 * 2. USE CACHED UTILITIES:
 *    - context.transcript utilities are cached per invocation
 *    - Multiple calls to same utility are free after first call
 *    - Share transcript analysis across logic branches
 *
 * 3. LIMIT HISTORY SCOPE:
 *    - Use .slice(-N) to look at recent messages only
 *    - Don't analyze entire history if not needed
 *    - Recent messages are usually more relevant
 *
 * 4. SHORT-CIRCUIT LOGIC:
 *    - Return early when possible (avoid unnecessary async calls)
 *    - Check simplest conditions first
 *    - Save expensive analysis for cases that need it
 *
 * 5. HANDLE EMPTY HISTORY:
 *    - First message in conversation = empty history
 *    - Check history.length before analyzing
 *    - Provide sensible defaults for new conversations
 *
 * TESTING HISTORY-AWARE MATCHERS:
 *
 * Test with different conversation states:
 * ✅ First mention → priority: medium
 * ✅ Third mention → priority: high
 * ✅ After previous error → priority: critical
 * ✅ Follow-up question → priority: high
 * ✅ No recent mentions → priority: low or relevant: false
 */
