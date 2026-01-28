# Nat-1 Games – Dev Workflow & Automation

This repository uses a **strict but minimal automation workflow** designed to keep code, docs, and architecture in sync without creating maintenance overhead.

This file is written for **future-you**.

---

## Core Idea

* Code changes and documentation changes move **together**
* Docs reflect **reality**, not intention
* Automation is intentionally **boring, bounded, and strict**

If this system ever feels clever or verbose, it is wrong.

---

## Source-of-Truth Docs

Always read these before large changes:

* `docs/ARCHITECTURE.md` – module boundaries & data flow
* `docs/CODEX.md` – invariants, tool modes, current phase
* `docs/doc-sync.yml` – automation policy (what can be edited, and where)

Only sections marked with `AGENT:BEGIN / AGENT:END` may be edited by automation.

---

## Standard Refactor Workflow

### 1. Start a branch

```bash
git checkout -b refactor/<topic>
```

### 2. Prime Codex

Tell Codex to read:

* `docs/ARCHITECTURE.md`
* `docs/CODEX.md`
* `docs/doc-sync.yml`

### 3. Run the refactor prompt

Use:

* `.codex/prompts/refactor.md`

This enforces:

* planning before implementation
* architectural boundary checks
* verification before completion

### 4. Verify

During work:

```bash
npm run codex:verify:fast
```

Before finalizing:

```bash
npm run codex:verify
```

### 5. Sync docs

After merge-worthy changes:

* Use `.codex/prompts/doc-sync.md`
* Update only AGENT blocks
* Append a concise changelog entry

### 6. Commit code + docs together

```bash
git add .
git commit -m "<summary> + doc sync"
```

---

## Automation Philosophy

The goal of doc automation is **accuracy and trust**, not completeness.

This system is intentionally strict and boring:

* It updates a small number of fenced sections only
* It writes a concise, bounded changelog entry
* It summarizes reality; it does not explain everything

If this system ever becomes annoying to maintain, it has already failed.

---

## When to Expand This System

Only add tooling (MCP servers, agents, scripts) if:

* verification becomes repetitive
* doc-sync becomes error-prone
* you trust the workflow and want tighter loops

Never expand automation just because it is possible.
