#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   pr_review_comments_json.sh <pr-number> [owner/repo]
#
# Example:
#   ./pr_review_comments_json.sh 123
#   ./pr_review_comments_json.sh 123 my-org/my-repo
#
# Requirements: gh, jq
# Auth: gh auth login (must have access to the repo)

PR_NUMBER="${1:?Usage: $0 <pr-number> [owner/repo]}"
REPO="${2:-$(gh repo view --json nameWithOwner -q .nameWithOwner)}"

gh api --paginate \
  -H "Accept: application/vnd.github+json" \
  "repos/${REPO}/pulls/${PR_NUMBER}/comments" \
| jq '[
    .[] | {
      id,
      file: (.path // null),
      content: .body,
      df: (.diff_hunk // null),
      line: (.line // null),
      originalLine: (.original_line // null),
      side: (.side // null),
      position: (.position // null),
      commitId: .commit_id,
      author: (.user.login // null),
      createdAt: .created_at,
      updatedAt: .updated_at,
      url: .html_url
    }
  ]'
