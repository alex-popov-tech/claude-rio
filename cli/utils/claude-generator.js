/**
 * Claude CLI generator utility
 * Spawns Claude CLI to generate matchers from prompts
 */

const { spawn } = require('child_process');

/**
 * Result of a Claude generation
 * @typedef {Object} GenerationResult
 * @property {boolean} success - Whether generation succeeded
 * @property {string} [error] - Error message if failed
 * @property {string} [stdout] - Standard output from Claude
 * @property {string} [stderr] - Standard error from Claude
 * @property {number} [exitCode] - Exit code from Claude process
 */

/**
 * Generate a matcher by calling Claude CLI with a prompt
 *
 * @param {string} prompt - The complete prompt for Claude
 * @param {Object} options - Generation options
 * @param {number} [options.timeout=30000] - Timeout in milliseconds (default 30s)
 * @returns {Promise<GenerationResult>} Result of the generation
 */
async function generateMatcher(prompt, options = {}) {
  const { timeout = 30000 } = options;

  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    let timedOut = false;

    // Spawn Claude CLI with Haiku model
    // Use --dangerously-skip-permissions to bypass permission prompts for tool usage
    // Use --print to get output without interactive mode
    const claudeProcess = spawn(
      'claude',
      ['--model', 'haiku', '--dangerously-skip-permissions', '-p', prompt],
      {
        stdio: ['ignore', 'pipe', 'pipe'], // ignore stdin, capture stdout/stderr
      }
    );

    // Set timeout
    const timeoutId = setTimeout(() => {
      timedOut = true;
      claudeProcess.kill('SIGTERM');
      resolve({
        success: false,
        error: `Timeout after ${timeout}ms`,
        exitCode: -1,
      });
    }, timeout);

    // Capture stdout
    claudeProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    // Capture stderr
    claudeProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    // Handle process exit
    claudeProcess.on('close', (exitCode) => {
      if (timedOut) return; // Already resolved

      clearTimeout(timeoutId);

      if (exitCode === 0) {
        resolve({
          success: true,
          stdout,
          stderr,
          exitCode,
        });
      } else {
        resolve({
          success: false,
          error: `Claude CLI exited with code ${exitCode}`,
          stdout,
          stderr,
          exitCode,
        });
      }
    });

    // Handle process error
    claudeProcess.on('error', (error) => {
      if (timedOut) return; // Already resolved

      clearTimeout(timeoutId);
      resolve({
        success: false,
        error: `Failed to spawn Claude CLI: ${error.message}`,
        exitCode: -1,
      });
    });
  });
}

/**
 * Generate matchers for multiple skills in parallel with concurrency limit
 *
 * @param {Array<{skillName: string, prompt: string}>} skillPrompts - Array of skill prompts
 * @param {Object} options - Generation options
 * @param {number} [options.concurrency=5] - Max parallel generations
 * @param {number} [options.timeout=30000] - Timeout per skill in milliseconds
 * @param {Function} [options.onProgress] - Progress callback (skillName, result)
 * @returns {Promise<Array<{skillName: string, result: GenerationResult}>>} Results for all skills
 */
async function generateMatchers(skillPrompts, options = {}) {
  const { concurrency = 5, timeout = 30000, onProgress } = options;

  const results = [];
  const queue = [...skillPrompts];
  const inProgress = new Set();

  return new Promise((resolve) => {
    const processNext = () => {
      // Check if we're done
      if (queue.length === 0 && inProgress.size === 0) {
        resolve(results);
        return;
      }

      // Start new jobs up to concurrency limit
      while (queue.length > 0 && inProgress.size < concurrency) {
        const skillPrompt = queue.shift();
        inProgress.add(skillPrompt.skillName);

        generateMatcher(skillPrompt.prompt, { timeout })
          .then(async (result) => {
            inProgress.delete(skillPrompt.skillName);
            results.push({ skillName: skillPrompt.skillName, result });

            // Call progress callback and await it
            if (onProgress) {
              await onProgress(skillPrompt.skillName, result);
            }

            // Process next
            processNext();
          })
          .catch(async (error) => {
            // Shouldn't happen since generateMatcher doesn't throw, but handle anyway
            inProgress.delete(skillPrompt.skillName);
            results.push({
              skillName: skillPrompt.skillName,
              result: {
                success: false,
                error: `Unexpected error: ${error.message}`,
              },
            });

            if (onProgress) {
              await onProgress(skillPrompt.skillName, {
                success: false,
                error: `Unexpected error: ${error.message}`,
              });
            }

            processNext();
          });
      }
    };

    processNext();
  });
}

module.exports = {
  generateMatcher,
  generateMatchers,
};
