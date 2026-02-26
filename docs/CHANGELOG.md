# Changelog

## 2026-02

- Standardized session auth results to an `ActionResult` contract (`ok/data` or `ok/error`) to make login and signup outcomes explicit and easier to consume consistently.
- Aligned auth API route responses to the same contract so session-related backend responses and client handling follow one semantic pattern.
- Added focused unit coverage for login/signup ActionResult helper semantics to prevent contract regressions as session flows expand.
- Consolidated changelog updates under `docs/CHANGELOG.md` so project change history stays in one governed location.
