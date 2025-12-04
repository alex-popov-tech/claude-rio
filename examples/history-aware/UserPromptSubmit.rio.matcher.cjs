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

  // Quick synchronous check: count keywords in current prompt
  const prompt = context.prompt.toLowerCase();
  const promptMatches = keywords.filter((kw) => prompt.includes(kw)).length;

  // Load conversation history (cached - only parses once per hook invocation)
  const history = await context.transcript.getConversationHistory(context.transcriptPath);

  // Count historical context signals
  let contextScore = 0;

  // +1 for each recent mention (last 10 messages)
  const recentMessages = history.slice(-10);
  const recentMentions = recentMessages.filter((msg) =>
    keywords.some((kw) => msg.content.toLowerCase().includes(kw))
  ).length;
  contextScore += Math.min(recentMentions, 3); // Cap at 3

  // +2 for previous errors (strong signal user needs help)
  const hadPreviousErrors = history.some(
    (msg) =>
      msg.role === 'assistant' &&
      (msg.content.includes('type error') ||
        msg.content.includes('compilation error') ||
        msg.content.includes('TypeScript error') ||
        msg.content.includes('TS'))
  );
  if (hadPreviousErrors) {
    contextScore += 2;
  }

  // +1 if this is a follow-up (mentioned in last 5 messages)
  const veryRecentMessages = history.slice(-5);
  const isFollowUp = veryRecentMessages.some((msg) =>
    keywords.some((kw) => msg.content.toLowerCase().includes(kw))
  );
  if (isFollowUp) {
    contextScore += 1;
  }

  // Total matchCount = prompt matches + context score
  const matchCount = promptMatches + contextScore;

  // IMPORTANT: All fields are MANDATORY and must not be undefined/null
  return {
    version: '2.0', // Required: always "2.0"
    matchCount: matchCount, // Required: number of matches (0+)
    type: 'skill', // Required: "skill" or "agent"
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
 *    // Add error mentions to matchCount for higher scoring
 *    matchCount += Math.min(errorMentions, 3);
 *
 * EXAMPLE 2: Check If Tool Was Used
 *    const toolUsage = await context.transcript.getToolUsage(path);
 *    const ranBuild = toolUsage.some(t =>
 *      t.tool === 'Bash' && t.input.includes('build')
 *    );
 *
 *    if (hasKeyword && !ranBuild) {
 *      // User mentioned build but hasn't run it yet - boost score
 *      matchCount += 2;
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
