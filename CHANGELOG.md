# Changelog

## 2026-02

- Refactored storage mode architecture by introducing `StorageModeOrchestrator`, `ProjectSessionRegistry`, and `SnapshotTransactionService` to separate provider policy, session ownership, and snapshot operation routing for safer and clearer save/load behavior.
