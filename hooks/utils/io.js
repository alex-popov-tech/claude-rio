/**
 * ⚠️  DO NOT EDIT - Managed by better-hooks
 *
 * This file is installed and maintained by better-hooks.
 * Manual changes will be lost when better-hooks is updated.
 *
 * To customize behavior, create skills in .claude/skills/
 * See: .claude/docs/CREATING_SKILLS.md
 */

const fs = require('fs/promises');
const { ok, err, wrapAsync, wrapSync } = require('./result');

/**
 * Read and parse JSON from stdin.
 * @returns {Promise<{ok: boolean, value?: any, error?: string}>}
 */
async function readJsonFromStdin() {
  const readRes = await wrapAsync(
    () =>
      new Promise((resolve, reject) => {
        /** @type {string[]} */
        const chunks = [];
        process.stdin.setEncoding('utf8');
        process.stdin.on('data', (chunk) => chunks.push(chunk));
        process.stdin.on('end', () => resolve(chunks.join('')));
        process.stdin.on('error', reject);
      })
  );
  if (!readRes.ok) {
    return err(`Failed to read stdin: ${readRes.error}`);
  }

  const content = readRes.value || '';
  if (!content.trim()) {
    return ok({});
  }

  const parseRes = wrapSync(() => JSON.parse(content));
  if (!parseRes.ok) {
    return err(`Failed to parse stdin JSON: ${parseRes.error}`);
  }

  return ok(parseRes.value);
}

/**
 * Ensure a directory exists, creating it if necessary.
 * @param {string} dirPath
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
async function ensureDir(dirPath) {
  const res = await wrapAsync(() => fs.mkdir(dirPath, { recursive: true }));
  if (!res.ok) {
    return err(`Cannot create directory ${dirPath}: ${res.error}`);
  }
  return ok(true);
}

/**
 * Check if a path exists and is a directory.
 * @param {string} dirPath
 * @returns {Promise<{ok: boolean, value?: boolean, error?: string}>}
 */
async function isDirectory(dirPath) {
  const statRes = await wrapAsync(() => fs.stat(dirPath));
  if (!statRes.ok) {
    // Path doesn't exist
    return ok(false);
  }
  return ok(statRes.value.isDirectory());
}

/**
 * Check if a file exists at the given path.
 * @param {string} filePath
 * @returns {Promise<{ok: boolean, value?: boolean, error?: string}>}
 */
async function isFileExists(filePath) {
  const statRes = await wrapAsync(() => fs.stat(filePath));
  if (!statRes.ok) {
    // File doesn't exist
    return ok(false);
  }
  return ok(statRes.value.isFile());
}

/**
 * Check if a directory exists at the given path.
 * @param {string} dirPath
 * @returns {Promise<{ok: boolean, value?: boolean, error?: string}>}
 */
async function isDirExists(dirPath) {
  const statRes = await wrapAsync(() => fs.stat(dirPath));
  if (!statRes.ok) {
    // Directory doesn't exist
    return ok(false);
  }
  return ok(statRes.value.isDirectory());
}

/**
 * Read directory entries.
 * @param {string} dirPath
 * @returns {Promise<{ok: boolean, value?: import('fs').Dirent[], error?: string}>}
 */
async function readDirectory(dirPath) {
  const res = await wrapAsync(() => fs.readdir(dirPath, { withFileTypes: true }));
  if (!res.ok) {
    return err(`Cannot read directory ${dirPath}: ${res.error}`);
  }
  return ok(res.value);
}

/**
 * Check if an error is a "not found" error (ENOENT).
 * @param {string} error
 * @returns {boolean}
 */
function isNotFoundError(error) {
  return error && (error.includes('ENOENT') || error.includes('no such file'));
}

/**
 * Append content to a file.
 * @param {string} filePath
 * @param {string} content
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
async function appendFile(filePath, content) {
  const res = await wrapAsync(() => fs.appendFile(filePath, content, 'utf8'));
  if (!res.ok) {
    return err(`Cannot append to file ${filePath}: ${res.error}`);
  }
  return ok(true);
}

module.exports = {
  readJsonFromStdin,
  ensureDir,
  isDirectory,
  isFileExists,
  isDirExists,
  readDirectory,
  isNotFoundError,
  appendFile,
};
