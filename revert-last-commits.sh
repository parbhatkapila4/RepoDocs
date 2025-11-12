#!/usr/bin/env bash
set -euo pipefail

TARGET_BRANCH="main"

NEWEST="c5a8b83"
COMMIT2="fd1ad49"
COMMIT3="e22337d"
COMMIT4="58daa52"
OLDEST="43e1623"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "ERROR: not inside a git repository. Abort."
  exit 1
fi

if ! git diff --quiet || ! git diff --staged --quiet; then
  echo "ERROR: working tree not clean. Please commit/stash changes before running this script."
  git status --porcelain
  exit 1
fi

git fetch origin
git checkout "${TARGET_BRANCH}"
git pull --ff-only origin "${TARGET_BRANCH}"

BACKUP="backup-before-revert-$(date +%s)"
git branch "${BACKUP}"
git push -u origin "${BACKUP}"
echo "Created backup branch: ${BACKUP} (pushed to origin)."

echo
echo "The following commits will be reverted (newest -> oldest):"
git --no-pager log --oneline --max-count=10 "${OLDEST}^..${NEWEST}"
echo
echo "Performing git revert --no-commit ${OLDEST}^..${NEWEST} ..."
if ! git revert --no-commit "${OLDEST}^..${NEWEST}"; then
  echo "Revert command failed (likely conflicts)."
  echo "Resolve conflicts manually, then run:"
  echo "  git add <fixed-files>"
  echo "  git commit -m 'Revert recent problematic commits (manual conflict resolution)'"
  echo "  git push origin ${TARGET_BRANCH}"
  echo "If you want to abort, run: git reset --hard ${BACKUP}"
  exit 2
fi

echo
echo "Staged revert changes ready to commit. Showing git status and staged diff summary:"
git status --short
git --no-pager diff --staged --name-only | sed -n '1,200p'
echo

REVERT_MSG="Revert commits ${OLDEST}..${NEWEST} — roll back changes from last 24h"
git commit -m "${REVERT_MSG}"

git push origin "${TARGET_BRANCH}"

echo
echo "✅ Revert committed and pushed to origin/${TARGET_BRANCH}."
echo "Backup branch retained as ${BACKUP}."
echo
echo "Verify with: git log --oneline --decorate --graph --max-count=20"
echo "To restore backup: git reset --hard ${BACKUP}; git push --force-with-lease origin ${TARGET_BRANCH}"
