# better-claude-hooks – implementation plan

> This file: `plan.md`  \
> Recommended location for testing: the same folder as `hooks.pdf`, for example:  
> `./plan.md` and `./hooks.pdf` in your project root.  
> The agent should create a `.claude` subfolder **in this same directory**:
> `./.claude/settings.json`, `./.claude/hooks/*.js`, `./.claude/skills/**`.

`hooks.pdf` contains the official Claude Code hook documentation (events, stdin/stdout shape, example JS code).  
This plan tells an agent how to build a small Node.js hook system plus a skill-matcher layer on top of that.

---

## 0. Task context

Goal: build a **minimal but extensible** hook system for Claude Code that:

- is implemented in **Node.js + plain JS** (with JSDoc in the PDF, not in this plan);
- uses **one JS file per hook** (e.g. one for `UserPromptSubmit`, one for `Stop`, etc.);
- shares a common utility file `hooks-utils.js` for:
  - reading JSON from stdin,
  - safe execution (logging errors, never breaking Claude’s flow),
  - filesystem helpers (matcher discovery, basic validation) later;
- for the `UserPromptSubmit` hook, implements a **skill-matcher framework** that:
  - automatically discovers per-skill matcher files,
  - calls them with a consistent context object,
  - expects a **yes/no answer** (“is this skill relevant?”),
  - prints a **SKILL ACTIVATION CHECK** block to stdout listing all skills that answered “yes”;
- is easy for a human user to:

  - copy JS files into `./.claude/hooks`,
  - have an agent create/update `./.claude/settings.json`,
  - start testing immediately in Claude Code.

### Assumptions

- Node.js ≥ 18 is installed and available as `node`.
- For testing, we treat the directory containing `plan.md` and `hooks.pdf` as the **project root**.
- The agent may create the following structure under that root:

  ```text
  ./hooks.pdf
  ./plan.md
  ./.claude/
    settings.json
    hooks/
    skills/
  ```

- `hooks.pdf` defines:
  - which hook events exist (`UserPromptSubmit`, `PostToolUse`, `Stop`, etc.),
  - what JSON is passed on stdin to each hook,
  - expected stdout behavior,
  - example JS code for each hook event **including JSDoc and type details**.  
  The agent must rely on `hooks.pdf` for all typing details and must not invent its own.

---

## 1. Dependency chart

High-level components:

```text
hooks.pdf  (Claude’s official hook spec: events, I/O, JSDoc, examples)
      ↓
plan.md   (this plan)
      ↓
.claude/hooks/hooks-utils.js         (shared utilities for all hooks)
   ├── .claude/hooks/user-prompt-skill-hook.js  (UserPromptSubmit)
   │       └── discovers and calls per-skill matcher.js files
   └── .claude/hooks/stop-build-hook.js         (Stop – basic logging/hello world)

.claude/skills/<skill-name>/matcher.js
   ↑
   └── simple yes/no decision: “is this skill relevant for this prompt/context?”

.claude/settings.json
   ├── wires UserPromptSubmit → `node .claude/hooks/user-prompt-skill-hook.js`
   └── wires Stop           → `node .claude/hooks/stop-build-hook.js`
```

Key dependencies:

- **Hook I/O contract** comes from `hooks.pdf` and must be reflected in how hooks read stdin and produce stdout.
- **Skill selection** is controlled by the matcher contract and the discovery utilities.
- **settings.json** binds Claude Code events to `node` commands that run these JS files.

---

## 2. Common use cases

1. **Skill hints on every prompt**

   - The user types a prompt in Claude Code.
   - `UserPromptSubmit` fires and runs `user-prompt-skill-hook.js`.
   - The hook:
     - reads the prompt (and any other fields defined in `hooks.pdf`),
     - builds a context object,
     - discovers and calls all `matcher.js` files under `.claude/skills/**`,
     - collects skills whose matcher returned `true`,
     - prints a SKILL ACTIVATION CHECK block listing those skills.
   - Claude sees this text before the user’s prompt and can decide to load/use those skills.

2. **Hook debugging / validation**

   - The user runs Claude Code with this project open.
   - Hooks log what they receive and what they output (to stderr/stdout).
   - The user manually compares real input/output with what `hooks.pdf` describes.

3. **Adding more skills**

   - The user or agent creates a new skill directory under `.claude/skills/` with a `matcher.js`.
   - No hook changes are needed.
   - The next time `UserPromptSubmit` runs, the new matcher is discovered and, if it returns `true`, its skill is included in the SKILL ACTIVATION CHECK.

4. **Future evolution**

   - Additional hooks (e.g. `PostToolUse`, more advanced `Stop`, or guardrail hooks) can reuse the same `hooks-utils.js` patterns.
   - The matcher contract can be extended later if needed, but the initial version uses **boolean yes/no**, not scores.

---

## 3. Phase 1 – Basic hooks + utility

### Goal

- Implement **two working JS hooks**:

  - `user-prompt-skill-hook.js` for the `UserPromptSubmit` event  
    (initially just “hello world” / logging, no real skill matching yet),
  - `stop-build-hook.js` for the `Stop` event  
    (basic “hello world” / logging).

- Implement `hooks-utils.js` with minimal shared functions.
- Verify that **real behavior** (what Claude sends/receives) matches `hooks.pdf`.

### Files the agent should create/update

Under the same directory where `plan.md` and `hooks.pdf` live:

- Create `.claude/` if it doesn’t exist.
- Under `.claude/hooks/`:

  1. `hooks-utils.js`
  2. `user-prompt-skill-hook.js`
  3. `stop-build-hook.js`

- Under `.claude/`:

  4. Create or update `.claude/settings.json` (details below).

### 3.1. `hooks-utils.js` – minimal utilities

The agent should create `hooks-utils.js` with at least:

- A **safe runner** wrapper:

  - Accepts a function that contains the hook’s main logic.
  - Catches any exceptions.
  - Logs errors to stderr with a clear prefix (e.g. `[hook-error]`).
  - Ensures the process exits with success (or at least does not break Claude’s flow).

- A **JSON stdin reader**:

  - Reads all data from stdin.
  - Attempts to parse JSON.
  - On parse error, logs a debug message and returns an empty object `{}`.

- A **debug logger**:

  - Writes structured debug info to stderr with a clear prefix (e.g. `[hook-debug]`).
  - This is used to inspect the real input payloads and hook behavior during testing.

Exact function names and signatures can be chosen freely by the agent, as long as they implement these behaviors. Any type annotations or JSDoc for these utilities should come from `hooks.pdf`, not from this plan.

### 3.2. `user-prompt-skill-hook.js` – phase 1 “hello world”

Behavior in Phase 1:

- Triggered by the `UserPromptSubmit` event.
- Reads JSON from stdin **exactly** as described in `hooks.pdf` for `UserPromptSubmit`.
- Uses `hooks-utils.js` to:

  - safely run,
  - parse the input,
  - log the entire input structure via a debug function.

- Writes a simple, non-breaking marker to stdout, such as:

  ```text
  // SKILL ACTIVATION CHECK (phase 1 stub)
  ```

No matcher discovery or real skill logic yet.

### 3.3. `stop-build-hook.js` – phase 1 “hello world”

Behavior in Phase 1:

- Triggered by the `Stop` event.
- Reads JSON from stdin according to the `Stop` event description in `hooks.pdf`.
- Uses `hooks-utils.js` to:

  - safely run,
  - parse the input,
  - log the input for inspection.

- It may write nothing to stdout or a very simple marker (but must not cause failures).

### 3.4. `.claude/settings.json` wiring

For Phase 1, the agent should ensure there is a `.claude/settings.json` in the same directory as `.claude/hooks`, and that it:

- Wires `UserPromptSubmit` → `node .claude/hooks/user-prompt-skill-hook.js`
- Wires `Stop` → `node .claude/hooks/stop-build-hook.js`

A minimal example (the agent must **merge** this with any existing content, not overwrite blindly):

```jsonc
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node $CLAUDE_PROJECT_DIR/.claude/hooks/user-prompt-skill-hook.js"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node $CLAUDE_PROJECT_DIR/.claude/hooks/stop-build-hook.js"
          }
        ]
      }
    ]
  }
}
```

Notes:

- Use **Node directly** (`node …`), not a shell wrapper, unless the user explicitly asks otherwise.
- Preserve any other hooks that might already be configured; just add these two.

### Phase 1 acceptance criteria

- [ ] `hooks-utils.js`, `user-prompt-skill-hook.js`, and `stop-build-hook.js` exist under `./.claude/hooks/`.
- [ ] `.claude/settings.json` wires:
  - `UserPromptSubmit` → `node .claude/hooks/user-prompt-skill-hook.js`
  - `Stop` → `node .claude/hooks/stop-build-hook.js`
- [ ] When the user runs Claude Code against this directory:
  - the hooks are actually triggered,
  - debug logs show the **real** JSON payloads for `UserPromptSubmit` and `Stop`,
  - the shape of these payloads matches `hooks.pdf` (the user manually verifies this).

### When the agent must pause and ask the user

After Phase 1, the agent **must stop and ask**:

- Does the observed hook input/output match what `hooks.pdf` says?
- Does the user see any issues in the logs (wrong fields, unexpected structure)?

Only after explicit confirmation from the user (“yes, it all matches / we can continue”) may the agent proceed to Phase 2.

---

## 4. Phase 2 – Matcher contract + discovery for `UserPromptSubmit`

Once Phase 1 confirms the hook wiring and input structures, the agent can build the matcher framework for `UserPromptSubmit`.

### Goal

- Define a **simple boolean matcher contract**:
  - A per-skill `matcher.js` file receives a context object,
  - returns **true** if the skill is relevant, **false** otherwise.
- Add filesystem utilities to `hooks-utils.js`:
  - discover matcher files under `.claude/skills/**/matcher.js`,
  - handle basic validation (e.g. missing `match` function).
- Extend `user-prompt-skill-hook.js` to:
  - build a context object from the hook input,
  - call all discovered matchers,
  - collect skills that returned `true`,
  - print a SKILL ACTIVATION CHECK block listing these skills.

### 4.1. Matcher contract (yes/no, no scores)

The contract should be **explicitly described in comments and prose**, but all type details (if needed) should be handled in `hooks.pdf` or in local JSDoc created by the agent, not in this plan.

Conceptually:

- Each skill lives in:

  ```text
  ./.claude/skills/<skill-name>/
    matcher.js
    (optionally SKILL.md, docs, etc.)
  ```

- Each `matcher.js` module exports a function, for example:

  - `match(context) → boolean`

- The `context` object for matchers should include at least:

  - the raw prompt text,
  - the project root path,
  - any file-related information that the hook receives (if available in `hooks.pdf`),
  - optionally, a simple `version` or `schemaVersion` field for future evolution.

- If `match(context)` returns `true`, the orchestrator should treat `<skill-name>` as **active** for this prompt and include it in the SKILL ACTIVATION CHECK block.
- If it returns `false`, the skill is ignored for that prompt.

No numeric scoring and no sorting are needed at this stage.

### 4.2. Discovery utilities in `hooks-utils.js`

The agent should extend `hooks-utils.js` with filesystem helpers that:

- Accept one or more base directories to search, for example:

  - `./.claude/skills` under the current project root.

- Recursively find subdirectories that contain a file named `matcher.js`.
- Return the list of absolute or project-relative paths to these `matcher.js` files.
- Optionally, derive a `skillName` from the directory name (e.g. the `<skill-name>` segment).

The agent should also provide a helper that:

- Takes the list of matcher paths and the context object,
- Requires/imports each `matcher.js`,
- Calls its exported `match` function,
- Returns the list of skill names whose matcher returned `true`,
- Logs any errors or malformed matcher modules, but does **not** throw.

Exact function names are up to the agent; the important part is the behavior.

### 4.3. Updating `user-prompt-skill-hook.js` to use matchers

Phase 2 behavior for `user-prompt-skill-hook.js`:

1. Read the input JSON as in Phase 1.
2. Build a **matcher context object** based on the hook payload and `hooks.pdf`:

   - It must contain at least:
     - the prompt text,
     - the project root,
   - and may also include:
     - edited file paths and/or contents, if available in the hook payload,
     - a simple schema or version field.

3. Call the discovery utilities from `hooks-utils.js` to find all `matcher.js` files under `./.claude/skills/`.
4. Call each matcher’s `match(context)` function.
5. Collect the skill names whose matchers returned `true`.
6. Print a SKILL ACTIVATION CHECK block to stdout, for example:

   ```text
   // SKILL ACTIVATION CHECK
   // Relevant skills:
   // - demo-hello
   // - demo-backend
   ```

7. If no skills return `true`, the hook may either:

   - print a minimal stub (e.g. `// SKILL ACTIVATION CHECK: none`), or
   - print nothing, depending on the user’s preference (to be confirmed later).

### 4.4. Demo “hello world” skills

For testing, the agent should create **two demo skills** under `./.claude/skills/`:

1. `./.claude/skills/demo-hello/matcher.js`

   - Returns `true` if the prompt contains “hello” or “привіт”.
   - Returns `false` otherwise.

2. `./.claude/skills/demo-backend/matcher.js`

   - Returns `true` if:
     - the prompt contains the word “backend”, OR
     - any file path in the hook payload clearly looks like backend code (e.g. contains `/backend/`).
   - Returns `false` otherwise.

These demo skills exist purely to validate the matcher discovery and execution pipeline.

### Phase 2 acceptance criteria

- [ ] There is a clear, documented matcher contract: one `matcher.js` per skill directory, exporting a function that returns a boolean “yes/no”.
- [ ] `hooks-utils.js` contains utilities to:
  - discover `matcher.js` files under `./.claude/skills/`,
  - load and execute them safely.
- [ ] `user-prompt-skill-hook.js`:
  - builds a matcher context from the real `UserPromptSubmit` payload,
  - discovers and calls matchers,
  - prints a SKILL ACTIVATION CHECK block listing all skills whose matcher returned `true`.
- [ ] With test prompts:
  - a prompt like `"hello world"` causes `demo-hello` to appear in the SKILL ACTIVATION CHECK,
  - a prompt like `"backend stuff"` causes `demo-backend` to appear.

### When the agent must pause and ask the user

After Phase 2, the agent **must stop and ask the user**:

- Is the SKILL ACTIVATION CHECK format acceptable (wording, style, whether to show something when there are no matches)?
- Does the boolean “yes/no” behavior feel right, or should we later introduce priorities or categories?

No further changes to the matcher contract or output format should be made without explicit user instructions.

---

## 5. Phase 3 – Optional extensions (future work)

Only after Phases 1 and 2 are stable and explicitly approved by the user, the agent may propose or implement optional extensions, such as:

1. **Richer Stop hook behavior**

   - Incorporating build checks (`tsc`, application builds) after tool runs.
   - Using information from `PostToolUse` logs (if present) to decide when to run checks.
   - Still ensuring any failures are surfaced as warnings and do not break Claude’s control flow, unless the user explicitly requests guardrail-like behavior.

2. **Priorities or categories for skills**

   - Extending matchers or separate skill metadata with categories (e.g. `backend`, `frontend`, `db`, `logging`).
   - Grouping skills in the SKILL ACTIVATION CHECK block by category.
   - Still based on boolean relevance, not numeric scores, unless the user later chooses to change that.

3. **CLI scaffolding (`npx better-claude-hooks init`)**

   - Once the structure feels solid across projects, move the scaffolding logic into a CLI tool.
   - The CLI could:
     - create `.claude/` with default hooks and settings,
     - generate demo skills,
     - optionally validate a configuration.

These items are **out of scope** for the initial implementation and should only be touched after a new explicit request from the user.

---

## 6. Instructions for using this in any project

For now, testing is done directly in the folder where `plan.md` and `hooks.pdf` live.  
To apply the same pattern in another project, the user can:

1. Copy `plan.md` and `hooks.pdf` to the new project root (optional but convenient).
2. Ensure the following structure exists:

   ```text
   ./plan.md                 (optional, this plan)
   ./hooks.pdf               (hook spec)
   ./.claude/
     settings.json
     hooks/
       hooks-utils.js
       user-prompt-skill-hook.js
       stop-build-hook.js
     skills/
       demo-hello/
         matcher.js
       demo-backend/
         matcher.js
   ```

3. Make sure `.claude/settings.json` wires the hooks exactly as described in Phase 1.
4. Open the project in Claude Code and verify:
   - hooks fire,
   - debug logs look correct,
   - demo skills behave as expected.

After that, demo matchers can be replaced with real skills.

---

## 7. Summary: when the agent must ask the user

The agent should not “freestyle” beyond this plan. It must explicitly ask the user at the following checkpoints:

1. **After Phase 1**  
   - Confirm the real hook payloads match `hooks.pdf`.  
   - Confirm hooks do not break Claude’s behavior.

2. **After Phase 2**  
   - Confirm the SKILL ACTIVATION CHECK format is acceptable.  
   - Confirm the boolean matcher behavior (yes/no) is acceptable.

Any changes to:

- hook wiring,
- matcher contract,
- output format,

must be requested or approved by the user before implementation.

This completes the plan for `better-claude-hooks` for now.
