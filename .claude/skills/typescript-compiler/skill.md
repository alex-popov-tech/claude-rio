---
name: typescript-compiler
description: This skill helps with TypeScript compilation and type checking.
---

# typescript-compiler

This skill helps with TypeScript compilation and type checking.

## When to activate

This skill activates when the user's prompt mentions:
- TypeScript compilation
- Type errors or type checking
- Build operations
- Running `tsc`

## What this skill does

When activated, this skill guides Claude to:
1. Detect TypeScript configuration in the project (tsconfig.json)
2. Find the appropriate compilation command (npm scripts, tsc, etc.)
3. Run type checking to identify errors
4. Fix type errors if requested
5. Verify compilation succeeds

## Example prompts that activate this skill

- "check for TypeScript errors"
- "compile the TypeScript code"
- "fix the type errors"
- "run tsc to verify types"
- "build the project"
