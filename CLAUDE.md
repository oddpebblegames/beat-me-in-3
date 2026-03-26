# CLAUDE.md

You are an autonomous engineering agent. When given a project prompt, execute the following plan end-to-end without waiting for user input between steps. All work is committed to `AIAgent/*` branches only.

---

## EXECUTION PLAN

### Phase 0 — Bootstrap

```
[ ] Read and parse the project prompt in full
[ ] Infer: language, framework, architecture, scope
[ ] Verify git is initialized — if not, run: git init
[ ] Confirm working tree is clean before proceeding
```

If git is not clean, stash changes and note it. Never proceed on a dirty tree.

---

### Phase 1 — Documentation

**Output:** `docs/` directory with the following files.

```
docs/
  overview.md       — purpose, scope, tech stack, key decisions
  architecture.md   — system design, component map (Mermaid), data flow
  api.md            — interfaces, contracts, auth, errors (if applicable)
  setup.md          — prerequisites, install, run, test instructions
```

**Execution:**
```
[ ] mkdir -p docs
[ ] Write docs/overview.md
[ ] Write docs/architecture.md
[ ] Write docs/api.md
[ ] Write docs/setup.md
[ ] git checkout -b AIAgent/phase-1-docs
[ ] git add docs/
[ ] git commit -m "docs: generate project documentation"
```

**Exit check:** All four files exist and are non-empty. Commit SHA logged.

---

### Phase 2 — Product Roadmap

**Output:** `docs/ROADMAP.md`

Structure:
```
# Roadmap
## Vision
## Phase 1 — MVP         (core functionality, walking skeleton)
## Phase 2 — Growth      (integrations, performance, UX)
## Phase 3 — Scale       (reliability, observability, polish)
## Deferred              (explicit out-of-scope items)
```

**Execution:**
```
[ ] Derive phases directly from the project prompt — no generic filler
[ ] Write docs/ROADMAP.md
[ ] git checkout -b AIAgent/phase-2-roadmap
[ ] git add docs/ROADMAP.md
[ ] git commit -m "docs: add product roadmap"
```

**Exit check:** ROADMAP.md contains at minimum Vision + 2 phases grounded in the prompt.

---

### Phase 3 — Task Breakdown

**Output:** `docs/TASKS.md`

**Task rules:**
- Every task is independently committable (one logical unit of work)
- Tasks are ordered by dependency — unblocked tasks first
- Every task has an explicit branch name and definition of done
- Task IDs are sequential: `T001`, `T002`, ...

**Task schema:**
```
### T001 · [TYPE] Title
Branch:  AIAgent/T001-short-description
Deps:    — (or T00X, T00Y)
Done:    Specific, verifiable completion condition
```

Types: `SETUP` `FEAT` `FIX` `TEST` `DOCS` `REFACTOR` `INFRA`

**Execution:**
```
[ ] Enumerate all tasks required to deliver the roadmap MVP
[ ] Assign types, dependencies, and branch names
[ ] Write docs/TASKS.md
[ ] git checkout -b AIAgent/phase-3-tasks
[ ] git add docs/TASKS.md
[ ] git commit -m "docs: add task breakdown"
```

**Exit check:** Every task has a branch name. No circular dependencies. Tasks cover MVP scope.

---

### Phase 4 — Sprint Plan

**Output:** `docs/SPRINTS.md`

**Sprint rules:**
- Sprint 1 = setup and foundations only
- Last sprint = tests, docs, final polish
- Each sprint has a named goal and a task list
- Sprint size: 5–10 tasks, or one delivery milestone

**Sprint schema:**
```
## Sprint N — Title
Goal:   One sentence outcome
Tasks:  T001, T002, T003
```

**Execution:**
```
[ ] Group tasks from TASKS.md into sprints respecting dependency order
[ ] Assign sprint goals derived from ROADMAP.md phases
[ ] Write docs/SPRINTS.md
[ ] git checkout -b AIAgent/phase-4-sprints
[ ] git add docs/SPRINTS.md
[ ] git commit -m "docs: add sprint plan"
```

**Exit check:** All tasks from TASKS.md appear in exactly one sprint. No task is orphaned.

---

### Phase 5 — Sprint Execution

**For each sprint, for each task — in order:**

```
[ ] Announce:  → Starting T00X: [title]
[ ] Checkout:  git checkout -b AIAgent/T00X-description
[ ] Implement: complete the task fully per its definition of done
[ ] Verify:    confirm the definition of done is met
[ ] Stage:     git add .
[ ] Commit:    git commit -m "<type>(T00X): <imperative description>"
[ ] Log:       ✓ T00X committed — AIAgent/T00X-description
```

Move to the next task only after the current task is committed.

**Commit format:** [Conventional Commits](https://www.conventionalcommits.org/)
```
<type>(T00X): <what was done>
```
Examples:
```
feat(T004): add JWT authentication middleware
test(T009): add unit tests for order service
chore(T001): scaffold project and install dependencies
```

**Sprint boundary:**
```
[ ] All sprint tasks committed
[ ] Log: ✓ Sprint N complete — [goal]
```

---

## CONSTRAINTS

```
BRANCH RULE     All commits → AIAgent/* only. Never touch main/master/dev.
COMMIT RULE     One task = one commit. No batching.
ORDER RULE      Docs → Roadmap → Tasks → Sprints → Execution. No skipping.
DEPS RULE       Never start a task with an incomplete dependency.
DONE RULE       A task is not complete until committed.
CLEAN RULE      Never commit to a dirty working tree from a prior task.
```

---

## COMPLETION REPORT

When all sprints are done, output:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  EXECUTION COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Docs        →  docs/{overview,architecture,api,setup,ROADMAP,TASKS,SPRINTS}.md
  Branches    →  AIAgent/* (list all)
  Commits     →  [total count]
  Sprints     →  [N] completed
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
