# Codex multi-agent development playbook for Mira

Status: proposed workflow, documentation-only pilot. This does **not** authorize implementation of backlog features or deployment.

## Goal and boundaries

Use multiple Codex coding sessions to deliver small, reviewed changes to Mira Explorer. This is **developer workflow orchestration**, not a proposal to add AI agents to the visitor product, Story Workflow, or runtime.

This playbook adapts the general Codex development workflow to [Mira's product vision](product/vision.md), [domain context](../CONTEXT.md), [repository instructions](../AGENTS.md), and [issue-tracker conventions](agents/issue-tracker.md). It supplements, never overrides, those sources. Read them first.

Repositories:
- **Papidev/mira-explorer**: Next.js 16, React 19, TypeScript, MapLibre, visitor UI, online content APIs, tests and deployment.
- **Papidev/mira-admin**: private editorial generation and admin workflows. It may not be accessible in every agent environment; never assume access or copy private assets into a public workspace.
- Shared [Mira Project](https://github.com/users/Papidev/projects/2) tracks work. Put cross-repository product specifications in Explorer and implementation issues in the owning repository.

Do not add an agent framework, API SDK, automation daemon, MCP server, or CI dependency solely to implement this playbook. Start with separate Codex sessions and existing Git/GitHub tooling.

## Existing constraints to preserve

1. Follow AGENTS.md, including explicit Papidev GitHub identity verification, branch/PR hygiene, worktree lifecycle, selective checks, and pnpm-only commands.
2. Read CONTEXT.md, product vision, relevant ADRs, and the actual issue/comments before architecture or UX work. Use canonical POI, POI Marker, POI Preview, Story, Person, and Publication terminology.
3. Never commit secrets, .env files, local Tailwind Plus/Catalyst reference catalogs, licensed materials, or private admin artifacts. Never perform live content writes, migrations, deployments, or changes to publication semantics without separate authorization.
4. Preserve online-publication precedence, removal semantics, server-only credentials, the 60-second read cache, and the distinction between local public snapshots and online content.
5. Keep product copy in English; use accessible, user-centric UI tests. Use Changesets and version checks when an application change requires them. A documentation-only PR needs a diff review, not a full application build.
6. An agent cannot merge its own work or approve a production deployment. The human owner retains final scope, review, merge and release decisions.

## Minimal operating model

Use **one coordinator and up to two specialist sessions** at first. Roles are task assignments, not permanently installed autonomous bots.

| Role | Allowed work | Deliverable | Write scope |
| --- | --- | --- | --- |
| Coordinator (human + primary Codex session) | Read issue, plan slice, identify dependencies, assign file ownership, integrate findings, review final diff | Task brief, acceptance matrix, integration decision | Integration branch only |
| Explorer / architecture reviewer | Inspect domain, existing components, contracts and ADRs; identify risks and likely files | Short evidence-based design note | Read-only |
| Implementer | Build one approved, bounded vertical slice with tests where warranted | Branch/PR with focused diff and check evidence | Own isolated worktree/branch |
| Independent reviewer | Check requirements, regressions, security, a11y, tests and version policy | Findings with file references and severity | Read-only |

The coordinator may combine roles for small tasks. Parallelism is valuable only when the work is independent. **Never assign concurrent writers to the same files or shared worktree.** A separate Codex session is not automatically an isolated filesystem; use an explicitly created Git worktree for independent writing tasks.

## Task contract (copy into each Codex session)

**Issue and branch:** link the approved GitHub issue; state target repository, base branch and assigned worktree.

**Objective:** one visitor- or maintainer-observable outcome, not a broad refactor.

**In scope:** explicit behavior and owned files/directories.

**Out of scope:** neighboring features, schema migrations, deployments, source regeneration, unrelated formatting and dependency upgrades.

**Required reading:** AGENTS.md, CONTEXT.md, product vision, relevant ADRs, issue body and comments, and existing tests.

**Acceptance criteria:** observable behavior, error cases, keyboard/a11y behavior when relevant, and release/version expectations.

**Verification:** smallest justified checks and the risk each check addresses; report passes, failures and intentionally skipped checks.

**Handoff:** changed files, commits/PR, decisions, remaining risks, and anything needing human approval.

The coordinator must reject vague assignments such as “improve the map” or “make the whole app more accessible.” Split them into independently reviewable slices first.

## Concrete pilot: Issue #240, Story mentions linking to published POIs

Use [#240](https://github.com/Papidev/mira-explorer/issues/240) **only when the owner confirms it is prioritized and not already being implemented**. The issue specifies a deterministic, unambiguous first slice: published POI names mentioned in Story prose become links to the destination Story/marker without regenerating Story Content. It belongs to Mira Explorer; do not involve Mira Admin for this slice.

### Phase A — Parallel read-only investigation

**Session A, domain/data reviewer:** trace published POI identities, local/online merging, destination lookup, duplicate names and filters. Confirm how the existing map opens a Story by stable POI ID. Deliver likely integration points and non-negotiable invariants. No edits.

**Session B, UI/test reviewer:** trace Markdown rendering, existing Person links, keyboard behavior, POI selection, map centering and current tests. Deliver a minimal behavioral test matrix. No edits.

The coordinator reconciles findings into a file-ownership map and chooses one thin vertical slice. If both investigations propose changes to the same shared component, do not start parallel implementation there.

### Phase B — One implementation writer

Assign one Codex implementer a dedicated worktree and branch. The first slice should cover exact, unambiguous whole-name matching in one city, stable destination IDs, and accessible activation while preserving existing Markdown links and Person navigation. Do not introduce fuzzy/AI matching, new aliases, a database schema, or a new route.

Implement one end-to-end behavior before expanding to all Story topics and filter states. Add behavioral tests for the new logic where meaningful; avoid asserting implementation internals. Reuse existing components and patterns.

### Phase C — Independent review, then integration

A second session reviews the diff **without editing**. Its checklist:
- published-only destinations, ambiguous names and stable identity;
- online/local publication precedence and no Story regeneration;
- existing Markdown/Person links, keyboard activation, and focus;
- temporarily revealing filtered-out destinations without mutating user filters;
- regressions, test gaps, overbroad refactors and release/version requirements.

The implementer addresses findings. The coordinator reviews the final diff, checks the issue acceptance matrix, confirms the correct Changeset/version treatment, and opens or updates a PR. Merge remains a human decision after required CI checks.

## Worktree and session setup

These are **illustrative Git commands**, not an automated orchestration feature. Follow AGENTS.md's identity, synchronization and local-resource instructions before running them.

    git fetch origin main
    git worktree add ../mira-issue-240 -b feat/story-poi-links origin/main

Run the implementation Codex session **inside** that worktree. Run the read-only reviewers against a stable branch/commit, not a mutable implementation checkout. When multiple independent writers are truly justified, create a distinct worktree and branch for each, assign disjoint file ownership, and integrate sequentially through reviewed PRs. Do not cherry-pick blindly over changes to the same module.

Worktrees do not automatically replicate ignored environment files, shared data, licensed references or local processes. Follow the existing Worktree Lifecycle guidance and verify dependencies before starting. Stop worktree processes after merge; follow repository cleanup policy.

## Reusable prompts

### Coordinator

> Read AGENTS.md, CONTEXT.md, docs/product/vision.md, docs/agents/domain.md, and the linked issue/comments. Do not edit files yet. Propose the smallest independently testable vertical slice, its acceptance criteria, likely file ownership, parallel read-only investigations, and integration risks. Respect Mira's existing release and worktree conventions. Ask for approval before expanding scope.

### Domain reviewer

> Investigate only the published POI identity, content-source precedence and map-selection behavior relevant to issue #240. Do not modify files. Report concrete file paths, evidence, edge cases, existing tests and uncertainties. Do not propose changing publication semantics.

### UI/test reviewer

> Investigate only Story Markdown, Person links, accessibility, POI navigation and filter behavior relevant to issue #240. Do not modify files. Produce a concise user-observable test matrix and likely integration points. Do not duplicate the domain review.

### Implementer

> Implement the coordinator-approved slice of issue #240 in this assigned worktree only. Follow AGENTS.md, product vision and domain context. Keep the diff focused, use pnpm, preserve existing UI and publication invariants, and run only checks justified by changed behavior. Do not deploy, merge or perform live writes. Hand off the diff, verification evidence and unresolved risks.

### Independent reviewer

> Review this branch against issue #240 and Mira's AGENTS.md/CONTEXT.md. Do not edit files. Prioritize correctness, regressions, security, keyboard accessibility, tests and release policy. Return actionable findings with file paths and severity; distinguish blockers from suggestions.

## Proposed adoption sequence

| Window | Action | Evidence of success |
| --- | --- | --- |
| Week 1 | Run two read-only Codex investigations on one prioritized issue; establish a shared task contract | Two concise findings reports, no duplicate work or unapproved edits |
| Week 2 | Implement one vertical slice in a dedicated worktree and request independent review | Focused PR, issue-linked acceptance matrix, recorded checks |
| Weeks 3–4 | Repeat on another independent slice only if the pilot improved outcomes | Fewer review cycles or lower elapsed time without increased regressions |
| Later | Consider repo-local skills for repeated review/release tasks, or scripted orchestration | A demonstrable recurring need, tests and maintenance owner |

Record per pilot: issue/PR links, agent sessions and approximate cost, elapsed time, human review time, number of review findings, CI failures, rework and escaped defects. Compare with a recent similar single-session change. If coordination overhead dominates, reduce agents rather than scaling them.

## Codex versus custom orchestration

- **Supported convention:** Codex recognizes AGENTS.md; repository-specific workflow documents are optional. Keep AGENTS.md concise and use focused linked docs for details.
- **Practical baseline:** manually start separate Codex coding sessions with bounded prompts and Git worktrees. This works without a custom multi-agent runtime.
- **Optional future capability:** investigate the currently available Codex product's native delegation/parallel execution only after checking its current official documentation and local version. Do not assume an OpenAI API multi-agent feature is automatically a Codex CLI or Codex app feature.
- **Not part of this pilot:** OpenAI Agents SDK, Responses API agent trees, custom MCP orchestration, autonomous issue picking, auto-merging, production access, or unattended deployments.

## References

- [Codex workflow cookbook](https://developers.openai.com/cookbook/examples/codex/iterating-development-workflows-with-codex)
- [OpenAI: rethinking skills and prompts](https://developers.openai.com/blog/rethinking-skills-and-prompts-for-gpt-6-astra)
- [OpenAI: using skills for OSS maintenance](https://developers.openai.com/blog/skills-agents-sdk)
- [Mira issue tracker conventions](agents/issue-tracker.md)
- [Mira issue #240](https://github.com/Papidev/mira-explorer/issues/240)
