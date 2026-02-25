# Changelog

## 2026-02

- Improved the Start Session flow with a new "Create routine" setup card that simplifies timezone choices to common US regions, auto-selects based on device timezone, and clarifies that a cycle includes both training and rest days (with an explicit cycle summary).
- Improved mobile form behavior by reducing unwanted zoom around inputs through viewport and input sizing safeguards, plus a focus-exit zoom reset handler.

- Refactored storage mode architecture by introducing `StorageModeOrchestrator`, `ProjectSessionRegistry`, and `SnapshotTransactionService` to separate provider policy, session ownership, and snapshot operation routing for safer and clearer save/load behavior.
