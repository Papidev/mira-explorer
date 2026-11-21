---
name: pr-generation
description: Use when the user asks to create, open, update, prepare, or describe a GitHub pull request for this repository.
---

# PR Generation

Follow the shared Mira [pr-generation](../../../node_modules/@mira/shared/skills/pr-generation/SKILL.md) skill (run `pnpm install` first if `node_modules` is missing) for the title, body format, issue links, state, assignment and GitHub identity, then apply the Explorer steps below.

Use the repo-local [push-branch](../push-branch/SKILL.md) skill when publishing the branch for a pull request.

## Base Branch Alignment

Before opening every PR, fetch `origin/main` and verify that
`git merge-base --is-ancestor origin/main HEAD` succeeds. If the branch is behind,
merge `origin/main` into the current branch, resolve any conflicts, and run the
required checks on the aligned branch before publishing it and opening the PR.
Repeat the fetch and ancestry check immediately before creating the PR; if main
advanced again, align the branch and rerun the affected checks first.

## Generated Data

Before preparing the release or opening any PR, follow the generated-data rule in
[Commits & PR Hygiene](../../../AGENTS.md#commits--pr-hygiene). Inspect the checkout
of the PR branch for uncommitted Stories, People, and POI metadata, including
modified tracked files and untracked files. Use
`git ls-files --others --exclude-standard` to list untracked files that are not
ignored. Commit all this content with ordinary `git add`, respecting `.gitignore`
and never force-adding ignored files. Verify that none remains only local before
opening the PR, whether working in the main checkout or a worktree.

## Application Version

After branch alignment, follow [Application versions](../../../README.md#application-versions)
before running the required checks and publishing the PR:

- For application changes, add an English Changeset describing the change and its patch, minor, or major increment.
- Run `pnpm release:version` to consume pending changesets. Include the generated `package.json` version and `CHANGELOG.md` in the PR; an unconsumed changeset is not release-ready.
- Apply the documentation and CI/release automation exemptions in [Application versions](../../../README.md#application-versions); dependency manifests and lockfiles still require a release.
- Reuse an already prepared increment rather than bumping twice. If another release merged, regenerate from the updated base and preserve its changelog history.
- Run `pnpm release:check origin/main` when application, dependency, version, changelog, or release automation changes make release validation relevant; skip it for documentation or agent-instruction-only updates.
- Preserve `0.1.0` for the initial tracked release. Subsequent application PRs require one increment unless covered by the documented exemptions.

## Verification

Choose local verification using [Testing & Verification](../../../AGENTS.md#testing--verification).
