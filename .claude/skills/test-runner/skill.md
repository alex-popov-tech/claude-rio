---
name: test-runner
description: This skill helps with running and managing tests.
---

# test-runner

This skill helps with running and managing tests.

## When to activate

This skill activates when the user's prompt mentions:
- Running tests
- Test failures
- Test coverage
- Specific test frameworks (Jest, Vitest, Mocha, Pytest, etc.)
- Unit tests or integration tests

## What this skill does

When activated, this skill guides Claude to:
1. Detect the test framework being used in the project
2. Find the appropriate test command (npm test, jest, vitest, pytest, etc.)
3. Run tests and analyze results
4. Fix failing tests if requested
5. Generate test coverage reports if needed
6. Help write new tests

## Example prompts that activate this skill

- "run the tests"
- "execute jest tests"
- "fix the failing tests"
- "show me test coverage"
- "run unit tests"
- "check if tests pass"
