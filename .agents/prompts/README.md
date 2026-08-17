# Agent Prompts

Project-specific agent prompts, review rubrics, and task framing live here.
Keep prompts short and link to canonical guides instead of copying policy.

Four prompts are installed with the scaffold and own the lifecycle between them:

- `expand-prd.md` — judges whether a PRD is workable (problem, users, primary
  flow, testable acceptance criteria, non-goals) and, only when it is not,
  writes `docs/prd/<name>.expanded.md` beside the untouched original. Runs
  before the lifecycle is instantiated, so nothing downstream is built against
  a one-sentence PRD.
- `instantiate-lifecycle.md` — PRD to `docs/lifecycle/plan.md` and the
  per-step checklists. Decides *what done means*. Writes no application code.
- `work-lifecycle.md` — works that plan one step at a time until every item is
  resolved. Builds the product; never edits the plan or checklists to fit it.
- `work-dev-cycle.md` — foreman prompt for the essential PRD-to-live-web-app
  cycle. Skips research, GTM, sales, release tagging, and day-2 operations.

This product owns its copies. Editing one changes how agents behave here and
nowhere else.
