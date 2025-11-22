TODO

- [x] Split utilities into dedicated modules under `.claude/hooks/utils/` (logger, io/fs, orchestrator, validations).
- [x] Replace stderr/stdout debug logging with file-based logging only.
- [x] Rename hook scripts to pattern `hook-<Event>-handler.js` and update `.claude/settings.json`.
- [x] Add JSDoc types for hooks, matchers, and key locals.
- [x] Implement result-style error handling (return objects) and enforce non-zero exits on failures.
- [x] Simplify matcher discovery: sync matchers, fixed skills folder layout; search project + user skills roots.
- [x] Centralize validations in a validations module (payloads, matcher modules, etc.).
