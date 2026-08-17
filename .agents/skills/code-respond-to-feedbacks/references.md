# References

## External Resources

- [Google Engineering Practices - How to do a code review](https://google.github.io/eng-practices/review/reviewer/) - Google's guide for reviewers and authors
- [Conventional Comments](https://conventionalcomments.org/) - A standard for structured review feedback
- [How to Make Good Code Reviews Better](https://stackoverflow.blog/2019/09/30/how-to-make-good-code-reviews-better/) - Stack Overflow blog on review culture

## GitHub API Endpoints Used by This Skill

All endpoints are REST unless noted. Call them via `gh api <path>` (or
`gh api graphql -f query=...` for GraphQL).

| Operation | Method | Path |
|---|---|---|
| List inline review comments on a PR | GET | `/repos/{owner}/{repo}/pulls/{number}/comments` |
| List general PR conversation comments | GET | `/repos/{owner}/{repo}/issues/{number}/comments` |
| List reviews (with body summaries) on a PR | GET | `/repos/{owner}/{repo}/pulls/{number}/reviews` |
| Reply to an inline review comment | POST | `/repos/{owner}/{repo}/pulls/{number}/comments/{comment_id}/replies` |
| Post a general PR comment | POST | `/repos/{owner}/{repo}/issues/{number}/comments` (or `gh pr comment`) |
| Create a tracking issue | POST | `/repos/{owner}/{repo}/issues` (or `gh issue create`) |
| Resolve a review thread | GraphQL mutation | `resolveReviewThread(input:{threadId:$threadId})` |
| List review threads (to get thread ids) | GraphQL query | `repository.pullRequest.reviewThreads` |

Key comment fields to capture when reading:
- `id` — numeric comment id, needed to reply or reference
- `path`, `line`, `original_line`, `side` — for inline comments
- `body` — the review text
- `user.login` — reviewer
- `html_url` — clickable URL to cite in the summary
- `in_reply_to_id` — present when the comment is itself a reply

## GitHub CLI Authentication

- Install: https://cli.github.com/
- Auth status: `gh auth status`
- Login (interactive): `gh auth login` — choose GitHub.com → HTTPS → browser login
- Login (token / CI): export `GH_TOKEN` or `GITHUB_TOKEN`; classic PAT needs `repo` scope, fine-grained PAT needs Contents + Pull requests (+ Issues for tracking issues) read/write
- Current repo: `gh repo view --json nameWithOwner -q .nameWithOwner`

## Related Skills

- [pr](../pr/SKILL.md) - Creates the pull request whose review comments this skill addresses
- [general-writing-commit-messages](../general-writing-commit-messages/SKILL.md) - Commit message conventions for any fixes applied
