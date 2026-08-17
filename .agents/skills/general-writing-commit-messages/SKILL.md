---
name: general-writing-commit-messages
description: "Write clear, consistent commit messages following conventional commits pattern"
layer: lifecycle
---

<!-- Installed by leet-dev-guides skill-instantiate from leet-dev-guides. Do not edit directly; change the overlay in .agents/skill-overlays/ and re-run `npm run skills:install`. -->

# Writing Commit Messages

## Overview

This skill covers how to write clear, descriptive commit messages that communicate the intent and scope of changes. Good commit messages make code history readable and enable automated changelog generation.

Use this skill when:
- Creating any git commit
- Writing pull request descriptions
- Documenting code changes

Prerequisites: None (general best practice)

## Key Concepts

**Conventional Commits Format:**
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Common Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Formatting, missing semicolons, etc (no code change)
- `refactor`: Code restructuring without changing behavior
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks, dependency updates
- `ci`: CI/CD changes
- `build`: Build system changes

**Key Principles:**
- Subject line: imperative mood, no period, ≤50 characters
- Body: explain what and why, not how, wrap at 72 characters
- Separate subject from body with blank line
- Reference issues/tickets in footer

**Anti-patterns:**
- Vague messages: "fix bug", "update code"
- Missing context: What changed? Why?
- Too broad: Combining unrelated changes
- WIP commits in main branch

## Implementation Guide

### Step 1: Determine the Type
- Is it a new feature? → `feat`
- Fixing a bug? → `fix`
- Changing docs? → `docs`
- Refactoring without behavior change? → `refactor`
- Performance improvement? → `perf`
- Adding/updating tests? → `test`
- Other maintenance? → `chore`

### Step 2: Define the Scope (Optional)
- Component/module affected: `feat(auth):`, `fix(api):`
- Omit if change affects multiple areas

### Step 3: Write the Subject
- Start with lowercase verb in imperative mood
- Describe what the change does, not what you did
- Keep it under 50 characters
- Don't end with period

Examples:
- ✓ "add user authentication endpoint"
- ✓ "fix memory leak in image processor"
- ✗ "Added user authentication endpoint" (past tense)
- ✗ "Fix bug" (too vague)

### Step 4: Write the Body (if needed)
- Explain the motivation for the change
- Contrast with previous behavior
- Include side effects or consequences
- Wrap lines at 72 characters

### Step 5: Add Footer (if needed)
- Reference issues: `Fixes #123`, `Closes #456`
- Breaking changes: `BREAKING CHANGE: description`
- Co-authors: `Co-authored-by: Name <email>`

## Examples

### Minimal Example
```
fix: correct typo in README
```

### Common Use Case
```
feat(api): add pagination to user list endpoint

Add limit and offset query parameters to /api/users
to support pagination. Default limit is 50 users.

Closes #234
```

### Advanced Pattern (Breaking Change)
```
refactor(auth)!: change JWT token structure

Modify JWT payload to include additional claims for
role-based access control. This requires all existing
tokens to be regenerated.

BREAKING CHANGE: Existing auth tokens will be invalid
after this change. Users will need to re-authenticate.

Closes #567
Co-authored-by: Jane Dev <jane@example.com>
```

## Checklist

- [ ] Commit type correctly chosen (feat/fix/docs/etc)
- [ ] Subject uses imperative mood ("add" not "added")
- [ ] Subject is ≤50 characters
- [ ] Subject doesn't end with period
- [ ] Body explains what and why (if needed)
- [ ] Body lines wrapped at 72 characters
- [ ] Related issues referenced in footer
- [ ] Breaking changes clearly marked

## References

See [references.md](references.md) for additional resources.

## Common Pitfalls

**Mistake 1: Using past tense**
- Wrong: "Added login feature"
- Right: "add login feature"
- Fix: Use imperative mood (as if giving a command)

**Mistake 2: Too vague**
- Wrong: "fix bug"
- Right: "fix null pointer error in user profile loader"
- Fix: Be specific about what and where

**Mistake 3: Combining unrelated changes**
- Wrong: One commit with auth changes + API changes + docs
- Right: Separate commits for each logical change
- Fix: Use `git add -p` to stage related changes separately

**Mistake 4: Writing for yourself, not others**
- Wrong: "WIP", "stuff", "oops"
- Right: Descriptive message explaining the change
- Fix: Imagine reading this in 6 months - will you understand it?
