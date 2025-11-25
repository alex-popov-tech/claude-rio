/**
 * EXAMPLE: Configuration-Driven Matcher
 *
 * Reads keywords, priorities, and behavior from a configuration file instead of
 * hardcoding them. This allows per-project customization without modifying matcher code.
 *
 * USE CASE:
 * Best for skills where different projects or teams need different behaviors:
 * - Per-project keyword customization
 * - Team-specific terminology
 * - Project-specific priority levels
 * - Dynamic enable/disable per project
 *
 * REAL-WORLD EXAMPLES:
 * - Database helper: Some teams call it "datastore", others "database"
 * - API helper: Enable only in API projects, disable in frontend projects
 * - Linter helper: Make it "critical" priority in strict projects, "low" in others
 * - Testing helper: Different test keywords for different frameworks (jest, mocha, pytest)
 *
 * BENEFITS:
 * - Customizable per project without code changes
 * - Team members can configure without touching code
 * - Can enable/disable skills per project
 * - Supports multiple configuration locations (project, user, skill-specific)
 *
 * WHEN TO USE:
 * - Different projects need different keyword sets
 * - You want to let users customize behavior
 * - You're building a skill for multiple teams
 * - You want per-project enable/disable control
 *
 * @param {Object} context - Matcher context
 * @param {string} context.prompt - User's prompt text
 * @param {string} context.cwd - Current working directory
 * @param {string} context.transcriptPath - Path to conversation transcript
 * @param {string} context.permissionMode - "ask" | "allow"
 * @param {string} context.sessionId - Session ID
 * @param {Object} context.meta - Meta information
 * @param {Object} context.transcript - Transcript utilities (for async usage)
 * @returns {Object} Matcher result with all required fields
 */
module.exports = function (context) {
  const fs = require('fs');
  const path = require('path');

  // Skill name used to lookup configuration
  const skillName = 'docker-helper';

  // Default configuration (used when no config file exists)
  const defaultConfig = {
    enabled: true,
    keywords: ['docker', 'container', 'dockerfile'],
    priority: 'medium',
    relevance: 'high',
    negativeKeywords: [], // Keywords that exclude activation
  };

  // Try to load configuration from file
  let config = { ...defaultConfig };

  try {
    // Configuration file location (customize to your preference)
    const configPath = path.join(context.cwd, '.better-hooks-config.json');

    if (fs.existsSync(configPath)) {
      const fileContent = fs.readFileSync(configPath, 'utf8');
      const fullConfig = JSON.parse(fileContent);

      // Extract configuration for this specific skill
      if (fullConfig.skills && fullConfig.skills[skillName]) {
        config = {
          ...defaultConfig,
          ...fullConfig.skills[skillName],
        };
      }
    }
  } catch (error) {
    // Config file missing or malformed
    // Silently fall back to default configuration
  }

  // Check if skill is enabled in configuration
  if (!config.enabled) {
    // IMPORTANT: All fields are MANDATORY and must not be undefined/null
    return {
      version: '1.0', // Required: always "1.0"
      relevant: false, // Required: true or false
      priority: 'low', // Required: "critical" | "high" | "medium" | "low"
      relevance: 'low', // Required: "high" | "medium" | "low"
    };
  }

  // Convert prompt to lowercase for case-insensitive matching
  const prompt = context.prompt.toLowerCase();

  // Check for positive keywords from configuration
  const hasKeyword = config.keywords.some((kw) => prompt.includes(kw.toLowerCase()));

  // Check for negative keywords from configuration
  // If negative keyword present, don't activate (even if positive keyword matches)
  const hasNegative = config.negativeKeywords.some((kw) => prompt.includes(kw.toLowerCase()));

  // No positive keyword found
  if (!hasKeyword) {
    // IMPORTANT: All fields are MANDATORY and must not be undefined/null
    return {
      version: '1.0', // Required: always "1.0"
      relevant: false, // Required: true or false
      priority: 'low', // Required: "critical" | "high" | "medium" | "low"
      relevance: 'low', // Required: "high" | "medium" | "low"
    };
  }

  // Positive keyword found but negative keyword also present
  if (hasNegative) {
    // IMPORTANT: All fields are MANDATORY and must not be undefined/null
    return {
      version: '1.0', // Required: always "1.0"
      relevant: false, // Required: true or false
      priority: 'low', // Required: "critical" | "high" | "medium" | "low"
      relevance: 'low', // Required: "high" | "medium" | "low"
    };
  }

  // Match found! Use configured priority and relevance
  // IMPORTANT: All fields are MANDATORY and must not be undefined/null
  return {
    version: '1.0', // Required: always "1.0"
    relevant: true, // Required: true or false
    priority: config.priority, // Required: from config
    relevance: config.relevance, // Required: from config
  };
};

/**
 * PERFORMANCE NOTES:
 * - Config file read happens on every hook invocation (~1-5ms)
 * - JSON.parse is very fast for small config files
 * - fs.existsSync and readFileSync are synchronous but quick
 * - Fails gracefully to defaults if config missing or malformed
 * - Consider caching config if multiple matchers need it (see tips below)
 *
 * CONFIGURATION FILE FORMATS:
 *
 * LOCATION 1: Project-specific config (.better-hooks-config.json in project root)
 * {
 *   "skills": {
 *     "docker-helper": {
 *       "enabled": true,
 *       "keywords": ["docker", "container", "compose"],
 *       "negativeKeywords": ["kubernetes"],
 *       "priority": "high",
 *       "relevance": "high"
 *     },
 *     "typescript-compiler": {
 *       "enabled": true,
 *       "keywords": ["typescript", "tsc", "compile"],
 *       "priority": "critical",
 *       "relevance": "high"
 *     }
 *   }
 * }
 *
 * LOCATION 2: package.json field
 * {
 *   "name": "my-project",
 *   "version": "1.0.0",
 *   "betterHooks": {
 *     "docker-helper": {
 *       "keywords": ["docker", "container"]
 *     }
 *   }
 * }
 *
 * To use package.json:
 *   const configPath = path.join(context.cwd, 'package.json');
 *   if (fs.existsSync(configPath)) {
 *     const pkg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
 *     if (pkg.betterHooks && pkg.betterHooks[skillName]) {
 *       config = { ...defaultConfig, ...pkg.betterHooks[skillName] };
 *     }
 *   }
 *
 * LOCATION 3: User-level config (~/.better-hooks-config.json)
 * Apply to all projects for this user:
 *   const userConfigPath = path.join(require('os').homedir(), '.better-hooks-config.json');
 *
 * LOCATION 4: Skill-specific config (.claude/skills/my-skill/better-hooks/config.json)
 * Isolated per skill, more granular control
 *
 * CONFIGURATION SCHEMA OPTIONS:
 *
 * MINIMAL (just keywords):
 * {
 *   "docker-helper": {
 *     "keywords": ["docker", "container"]
 *   }
 * }
 *
 * BASIC (keywords + enable/disable):
 * {
 *   "docker-helper": {
 *     "enabled": true,
 *     "keywords": ["docker", "container"]
 *   }
 * }
 *
 * STANDARD (keywords + priority + relevance):
 * {
 *   "docker-helper": {
 *     "enabled": true,
 *     "keywords": ["docker", "container"],
 *     "priority": "high",
 *     "relevance": "high"
 *   }
 * }
 *
 * ADVANCED (with negative keywords and custom options):
 * {
 *   "docker-helper": {
 *     "enabled": true,
 *     "keywords": ["docker", "container", "compose"],
 *     "negativeKeywords": ["kubernetes", "k8s"],
 *     "priority": "high",
 *     "relevance": "high",
 *     "customOptions": {
 *       "checkForDockerfile": true,
 *       "requireMultipleKeywords": false
 *     }
 *   }
 * }
 *
 * CONFIGURATION VALIDATION:
 *
 * It's good practice to validate configuration values:
 *
 * function validateConfig(config) {
 *   const validPriorities = ['critical', 'high', 'medium', 'low'];
 *   const validRelevances = ['high', 'medium', 'low'];
 *
 *   // Validate priority
 *   if (!validPriorities.includes(config.priority)) {
 *     config.priority = 'medium'; // fallback
 *   }
 *
 *   // Validate relevance
 *   if (!validRelevances.includes(config.relevance)) {
 *     config.relevance = 'medium'; // fallback
 *   }
 *
 *   // Validate keywords is an array
 *   if (!Array.isArray(config.keywords)) {
 *     config.keywords = [];
 *   }
 *
 *   // Validate negativeKeywords is an array
 *   if (!Array.isArray(config.negativeKeywords)) {
 *     config.negativeKeywords = [];
 *   }
 *
 *   return config;
 * }
 *
 * CACHING CONFIGURATION:
 *
 * If multiple matchers load the same config file, cache it at module level:
 *
 * let cachedConfig = null;
 * let cacheKey = null;
 *
 * function loadConfig(context, skillName) {
 *   const key = `${context.cwd}:${skillName}`;
 *
 *   // Return cached config if available
 *   if (cachedConfig && cacheKey === key) {
 *     return cachedConfig;
 *   }
 *
 *   // Load config from file...
 *   const config = { ...loadFromFile() };
 *
 *   // Cache for next matcher
 *   cachedConfig = config;
 *   cacheKey = key;
 *
 *   return config;
 * }
 *
 * Note: Cache is per hook invocation (new Node.js process each time),
 * so it helps when multiple matchers in same invocation load config.
 *
 * CASCADING CONFIGURATION:
 *
 * Load from multiple locations with priority:
 *
 * 1. Skill-specific config (highest priority)
 * 2. Project config
 * 3. User config
 * 4. Default config (lowest priority)
 *
 * function loadCascadingConfig(context, skillName) {
 *   let config = { ...defaultConfig };
 *
 *   // User-level config
 *   const userConfig = loadUserConfig(skillName);
 *   if (userConfig) config = { ...config, ...userConfig };
 *
 *   // Project-level config
 *   const projectConfig = loadProjectConfig(context.cwd, skillName);
 *   if (projectConfig) config = { ...config, ...projectConfig };
 *
 *   // Skill-specific config
 *   const skillConfig = loadSkillConfig(context.cwd, skillName);
 *   if (skillConfig) config = { ...config, ...skillConfig };
 *
 *   return config;
 * }
 *
 * REAL-WORLD USAGE EXAMPLES:
 *
 * EXAMPLE 1: Team-Specific Terminology
 * Team A calls their database "datastore", Team B calls it "database".
 * Each project has .better-hooks-config.json with appropriate keywords.
 *
 * EXAMPLE 2: Strict vs Relaxed Projects
 * Strict projects: linter is "critical" priority
 * Relaxed projects: linter is "low" priority
 *
 * EXAMPLE 3: Frontend vs Backend Projects
 * Frontend: Disable database helper, enable React helper
 * Backend: Enable database helper, disable React helper
 *
 * EXAMPLE 4: Monorepo with Multiple Contexts
 * /packages/api/ → Enable API helper
 * /packages/frontend/ → Enable React helper
 * Each subdirectory has its own config
 *
 * TIPS:
 * - Always provide sensible defaults (matcher should work without config)
 * - Fail gracefully if config is missing or malformed
 * - Document your config schema in the skill's README
 * - Validate config values to prevent invalid states
 * - Support both project-level and user-level configs
 * - Consider using JSON Schema for complex configurations
 * - Make the config file location configurable via environment variable
 * - Log config loading for debugging (use logger utility)
 *
 * TESTING CONFIG-BASED MATCHERS:
 *
 * Test with different configurations:
 * ✅ No config file → uses defaults → relevant based on default keywords
 * ✅ Config with enabled: false → relevant: false
 * ✅ Config with custom keywords → matches custom keywords
 * ✅ Config with negativeKeywords → excludes those cases
 * ✅ Config with custom priority → uses configured priority
 * ✅ Malformed config file → falls back to defaults gracefully
 */
