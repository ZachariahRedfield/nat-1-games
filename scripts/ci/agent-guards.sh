#!/usr/bin/env bash
set -euo pipefail

# agent-guards.sh
# Enforces: changelog required for meaningful changes; tests required for behavior changes unless explicitly exempted.
#
# Configuration:
# - Set DOCS_ONLY_LABEL to a PR label that allows skipping (optional; if not using labels, rely on changed files).
# - Define what "code change" means by file patterns below.

BASE_REF="${BASE_REF:-origin/main}"
HEAD_REF="${HEAD_REF:-HEAD}"

echo "Running agent guards..."
echo "BASE_REF=$BASE_REF"
echo "HEAD_REF=$HEAD_REF"

CHANGED_FILES="$(git diff --name-only "$BASE_REF" "$HEAD_REF")"

if [[ -z "$CHANGED_FILES" ]]; then
  echo "No changes detected."
  exit 0
fi

echo "Changed files:"
echo "$CHANGED_FILES"

# ---------
# Patterns
# ---------
is_docs_only=true
is_code_change=false
has_changelog_change=false
has_test_change=false

while IFS= read -r f; do
  [[ -z "$f" ]] && continue

  # Changelog detection
  if [[ "$f" == "CHANGELOG.md" ]]; then
    has_changelog_change=true
    continue
  fi

  # Treat markdown/docs/config as "docs" (tweak as needed)
  if [[ "$f" =~ ^docs/ ]] || [[ "$f" =~ \.md$ ]] || [[ "$f" =~ ^\.github/ ]]; then
    continue
  fi

  # Tests detection (customize for your stack)
  if [[ "$f" =~ (__tests__/|\.test\.|\.spec\.) ]]; then
    has_test_change=true
  fi

  # Code change detection (customize for your stack)
  if [[ "$f" =~ \.(ts|tsx|js|jsx|css|scss|json|yml|yaml)$ ]] && [[ ! "$f" =~ \.md$ ]]; then
    is_code_change=true
    is_docs_only=false
  else
    # any non-doc file means not docs-only
    is_docs_only=false
  fi
done <<< "$CHANGED_FILES"

# -------------------
# Enforcement Rules
# -------------------

# 1) If docs-only, allow skipping changelog/tests.
if [[ "$is_docs_only" == true ]]; then
  echo "Docs-only change detected. Guards passed."
  exit 0
fi

# 2) If any code changed, require CHANGELOG.md update.
if [[ "$is_code_change" == true && "$has_changelog_change" != true ]]; then
  cat <<'EOF'
❌ Guard failed: CHANGELOG.md not updated.

A non-doc/code change requires a concise CHANGELOG.md entry (what changed + why).

If this is truly docs-only or no user-visible change:
- move changes into docs-only, OR
- include a small changelog note stating "No user-visible change" (preferred).
EOF
  exit 1
fi

# 3) If code changed AND it looks like behavior change area, require tests (or allow explicit skip marker).
# Lightweight heuristic: require tests unless PR includes a "TESTS-N/A:" marker in the commit messages.
# You can replace this with PR body parsing later if you want.
COMMIT_MSGS="$(git log --format=%B "$BASE_REF..$HEAD_REF" || true)"
if [[ "$is_code_change" == true && "$has_test_change" != true ]]; then
  if echo "$COMMIT_MSGS" | rg -qi 'TESTS-N/A:'; then
    echo "Tests missing but skip marker found (TESTS-N/A: ...). Guards passed."
    exit 0
  fi

  cat <<'EOF'
❌ Guard failed: No test changes detected.

Behavior changes should include at least one focused regression unit test when feasible.

If tests are not feasible:
- Add a commit message line like: "TESTS-N/A: <reason + manual checks>"
  (Example: TESTS-N/A: UI pointer interaction; manually verified undo/redo + mobile pan)
EOF
  exit 1
fi

echo "✅ Guards passed."
