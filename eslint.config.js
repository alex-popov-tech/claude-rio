/**
 * ESLint configuration (flat config format for ESLint 9+)
 */

const js = require('@eslint/js');

module.exports = [
  // Base configuration for all files
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
  // Ignore patterns
  {
    ignores: ['node_modules/**', 'coverage/**', '.claude/**'],
  },
  // Strict dependency rules for hooks, shared, and matchers
  {
    files: ['hooks/**/*.js', 'shared/**/*.js', 'matchers/**/*.js'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "CallExpression[callee.name='require'] > Literal[value!=/^(\\.|path|fs|readline|util|os)/]",
          message:
            "Hooks, shared, and matchers must be dependency-free (Node.js built-ins only). These files ship as lightweight Node.js code that 'just works' out of the box. Relative imports (starting with '.') and Node.js built-ins (path, fs, readline, util, os and their subpaths) are allowed.",
        },
      ],
    },
  },
];
