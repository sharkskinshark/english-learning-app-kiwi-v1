---
name: github-vercel-deploy-maintenance-lite
description: Quick daily workflow for local workspace -> GitHub -> Vercel auto deployment. Use for routine updates, small fixes, and smoke-check releases. Always run Git sync parity checks first before push/deploy.
---

# GitHub to Vercel Maintenance (Lite)

## Goal
Daily deployment with minimal steps and explicit safety gates.

## Gate 0: Git Sync Parity (MUST BE FIRST)
Run first, before any auth/push/deploy command:
1. git fetch origin --prune
2. git status --short --branch
3. git rev-parse HEAD
4. git rev-parse origin/main
5. git rev-list --left-right --count HEAD...origin/main

Decision rules:
1. ahead only: continue.
2. behind only: sync first, then re-run Gate 0.
3. diverged: resolve integration first, then re-run Gate 0.
4. dirty tree: stage/commit/stash intentionally before push.

Stop condition: if Gate 0 is not complete or branch state is unclear, stop.

## Main Flow
1. Auth and linkage
	- gh auth status
	- vercel whoami
	- git remote -v

2. Commit and push
	- Commit intended files only.
	- git push -u origin main

3. Verify auto deploy
	- vercel list <project-name>
	- Confirm latest deployment is Ready.
	- vercel inspect <deployment-url>

## Incident Fast Path
If latest deployment is Error:
1. vercel inspect <deployment-url>
2. vercel build (local reproduce)
3. Fix highest-probability mismatches first:
	- package.json build script
	- vercel.json output/build settings
	- HTML/CSS/JS selector mismatch
4. Push fix and re-check Ready.

## Output Contract
1. Status summary
2. Findings
3. Actions taken
4. Verification evidence
5. Next options

## Documentation Sync Rule
When SKILL behavior changes, update README.md in the same folder.

Update README when:
1. Gate logic changes.
2. Git command set changes.
3. Deployment/triage behavior changes.
4. Maintenance rationale changes.

Do not update README for wording-only edits.

PowerShell quick commands:
1. Add-Content .\README.md "- $(Get-Date -Format 'yyyy-MM-dd'): 更新 SKILL.md（請補摘要）"
2. code .\README.md
