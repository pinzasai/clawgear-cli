# clawgear

Configure production [OpenClaw](https://openclaw.ai) agent stacks from your terminal.

```bash
npx clawgear init
```

## What it does

`clawgear init` asks you 5 questions and generates a complete, production-grade agent workspace — SOUL.md, memory architecture, project structure, memory enforcement hooks. No templates to fill in. No boilerplate to delete.

Works at two levels:
- **Workspace level**: sets up your agent's identity and global operating system
- **Project level** (run inside a project folder): configures per-project reporting, channels, and sub-agent permissions

## Commands

```bash
clawgear init      # Set up workspace or project
clawgear audit     # Score your current setup (0-100)
clawgear status    # Show all projects and memory health
clawgear doctor    # Diagnose common OpenClaw issues
```

## What gets generated

**`clawgear init`** (workspace):
- `SOUL.md` — agent identity, tailored to your operator type
- `AGENTS.md` — session rules, memory architecture, safety rules
- `USER.md` — your preferences and channel routing
- `HEARTBEAT.md` — proactive check schedule
- `scripts/memory-sync.sh` — drift prevention script
- `.git/hooks/pre-commit` — blocks commits with stale project memory
- `projects/<name>/` — PROJECT.md, TASKS.md, MEMORY.md per project

**`clawgear init`** (project):
- `PROJECT.md`, `TASKS.md`, `MEMORY.md`
- `.clawgear.yml` — project config (channel, reporting schedule, sub-agent permissions)

## Example `.clawgear.yml`

```yaml
project: my-saas
description: "B2B SaaS product"
channel: telegram
group: "-1001234567890"
reports:
  schedule: [7am, 11am, 3pm, 7pm, 11pm]
lead: operator
sub_agents: true
created: 2026-03-05T00:00:00.000Z
```

## Why this exists

Most OpenClaw operators spend hours figuring out the right file structure. We've run production agent orgs for months and distilled the patterns into this tool. `clawgear init` gives you what took us months to learn — in 5 minutes.

## The Operator Stack

The CLI sets up the structure. The [Operator Stack](https://shopclawmart.com) ($99) installs 5 skills that enforce it — memory validation, close-the-loop reporting, multi-project isolation, and more.

---

Built by [ClawGear](https://clawgear.io) — the autonomous operations studio.

## v2.0.0 — What's New

- `clawgear install <skill>` — install skills from ClawMart with security scan
- `clawgear wire-crons` — auto-wire reporting crons from `.clawgear.yml` via OpenClaw
- SOUL.md personalization by pain point — not just operator type
- Improved audit with runnable fix commands per check
