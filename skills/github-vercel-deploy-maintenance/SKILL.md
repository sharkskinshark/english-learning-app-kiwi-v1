---
name: github-vercel-deploy-maintenance
description: End-to-end workflow for local workspace deployment to GitHub and automatic deployment to Vercel, with fast triage for deployment failures and blank-screen regressions. Use this whenever users mention git push, github sync, vercel deploy, production not updating, deployment error, blank or large empty screen after deploy, PAT or gh auth, remote origin setup, or release maintenance.
---

# GitHub and Vercel Deploy Maintenance

## Goal
Ship local changes safely from workspace to GitHub, verify Vercel auto-deploy, and resolve deployment/runtime issues quickly.

## Required Inputs
1. Project root path
2. Target branch (default: main)
3. Vercel project name
4. Production alias or URL (if known)

## Safety Rules
1. Never ask users to paste PAT tokens in chat. Use terminal input only.
2. Prefer non-destructive git commands.
3. Do not force push unless user explicitly approves.
4. Before merge/rebase/push, capture current git status.
5. Reproduce deployment failures locally before changing build settings.

## Standard Workflow

### 1. Auth and linkage checks
Run these first:
1. gh auth status
2. git remote -v
3. vercel whoami
4. vercel project inspect <project-name>

### 2. Local git readiness
1. git status --short --branch
2. git fetch origin --prune
3. git rev-list --left-right --count HEAD...origin/main

Decision rules:
1. If clean and ahead only: push directly.
2. If diverged: create backup branch, stash local edits, merge origin/main safely.
3. If conflicts occur: resolve minimal files only, preserve existing app behavior.

### 3. Push
1. Commit staged files with clear message.
2. Push branch (usually main): git push -u origin main

### 4. Verify Vercel auto deploy
1. vercel list <project-name>
2. Confirm latest deployment reaches Ready.
3. vercel inspect <deployment-url> and verify aliases.

## Failure Triage Playbook
If latest deployment status is Error:
1. Inspect deployment details.
   - vercel inspect <deployment-url>
2. Reproduce locally.
   - vercel build
3. Fix likely root causes.
   - package.json build script mismatches actual app type
   - vercel.json output/build settings mismatch
   - merge artifact leftovers
   - CSS parser breaks (unclosed blocks/comments)
   - selector/id mismatch between HTML, CSS, and JS
4. Re-test locally and redeploy.

## Blank Screen and Large Empty Area Checks
Use this flow when the user reports large blank area after deploy:
1. Fetch production HTML and CSS with cache-busting query.
2. Verify primary content id matches JS selectors.
3. Check full-screen loaders and holiday overlays on startup.
4. Add a fail-safe that restores content visibility and removes stale loaders.
5. Redeploy and verify again.

## Output Format
Always report in this order:
1. Current status summary
2. Findings by severity
3. Actions taken
4. Verification evidence (key command results)
5. Numbered next-step options

## Command Reference
1. gh auth status
2. git remote -v
3. git status --short --branch
4. git fetch origin --prune
5. git rev-list --left-right --count HEAD...origin/main
6. git push -u origin main
7. vercel whoami
8. vercel project inspect <project-name>
9. vercel list <project-name>
10. vercel inspect <deployment-url>
11. vercel build

## Repository-Specific Notes
1. Root path: English Learning App
2. Common production alias: english-learning-app-beryl.vercel.app
3. Root deployment mode is static-site oriented.
4. Blocking holiday intro overlays should be opt-in, not default.
