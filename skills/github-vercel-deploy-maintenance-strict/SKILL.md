---
name: github-vercel-deploy-maintenance-strict
description: Strict production workflow for local workspace -> GitHub -> Vercel with safety gates, conflict control, rollback readiness, and evidence-based verification. Use for critical updates, incidents, regressions, and high-confidence releases.
---

# GitHub to Vercel Maintenance (Strict)

## Purpose
High-confidence release and maintenance process with explicit safety controls.

## Gate 0: Git Sync and Freshness Validation (MUST BE FIRST)
Run first. No exceptions.

Commands:
1. git fetch origin --prune
2. git status --short --branch
3. git rev-parse --abbrev-ref HEAD
4. git rev-parse HEAD
5. git rev-parse origin/main
6. git rev-list --left-right --count HEAD...origin/main

Decision policy:
1. ahead only: continue.
2. behind only: pull/rebase/merge first, then re-run Gate 0.
3. diverged: create backup branch, merge safely, resolve conflicts, then re-run Gate 0.
4. dirty working tree: explicitly decide what to commit/stash before push.

If Gate 0 fails or is incomplete, stop all deploy steps.

## Gate 1: Auth and Integration Validation
1. gh auth status
2. git remote -v
3. vercel whoami
4. vercel project inspect <project-name>

## Gate 2: Controlled Change Scope
1. Confirm intended files only.
2. Avoid unrelated files in commit.
3. Use clear commit message for traceability.

## Release Execution
1. Commit scoped changes.
2. Push target branch (default main): git push -u origin main
3. Verify deployment creation: vercel list <project-name>
4. Verify deployment health: status Ready
5. Verify alias mapping: vercel inspect <deployment-url>

## Incident Triage (Deploy Error or Runtime Regression)
1. Collect evidence
	- vercel inspect <deployment-url>
	- vercel list <project-name>

2. Reproduce locally
	- vercel build

3. Diagnose by priority
	- package.json build command mismatch
	- vercel.json output/build mismatch
	- merge conflict leftovers
	- CSS parse breaks (unclosed comment/block)
	- HTML/CSS/JS selector mismatch
	- full-screen loader/animation not restoring main content

4. Apply minimal fix and re-verify
	- Local build pass
	- Push
	- Deployment Ready
	- Alias confirms latest deployment

## Rollback Readiness
1. Record current production deployment URL before risky changes.
2. Keep previous known-good commit hash.
3. If incident persists, revert with focused commit and redeploy.

## Reporting Contract
Always output in this order:
1. Gate results (0 -> 1 -> 2)
2. Current release state
3. Findings by severity
4. Actions and commands executed
5. Verification evidence
6. Recommended next actions

## Required Evidence Checklist
1. Git parity result (ahead/behind/diverged counts)
2. Current HEAD and origin/main hashes
3. Push result (branch updated)
4. Latest deployment status
5. Production alias mapping

## Documentation Sync Rule
When SKILL behavior changes, update README.md in the same folder.

Update README when:
1. Gate 0/1/2 logic changes.
2. Git command set changes.
3. Incident/rollback behavior changes.
4. Core rationale changes.

Do not update README for wording-only edits.

PowerShell quick commands:
1. Add-Content .\README.md "- $(Get-Date -Format 'yyyy-MM-dd'): 更新 SKILL.md（請補摘要）"
2. code .\README.md
