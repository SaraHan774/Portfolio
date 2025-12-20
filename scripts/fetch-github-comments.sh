#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./pr_reviews_comments.sh        # uses current branch's PR
#   ./pr_reviews_comments.sh 11     # uses PR #11 explicitly

PR_NUMBER="${1:-}"

if [[ -z "${PR_NUMBER}" ]]; then
  # gh pr view (no number) targets the current branch's PR
  PR_NUMBER="$(gh pr view --json number -q '.number' 2>/dev/null || true)"
fi

if [[ -z "${PR_NUMBER}" ]]; then
  echo "No PR found for the current branch (or you lack access)." >&2
  exit 1
fi

gh pr view "${PR_NUMBER}" --json reviews,comments --jq '.'
