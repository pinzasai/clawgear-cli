#!/usr/bin/env node
import { init } from '../src/commands/init.js';
import { audit } from '../src/commands/audit.js';
import { status } from '../src/commands/status.js';
import { doctor } from '../src/commands/doctor.js';
import { install } from '../src/commands/install.js';
import { wireCrons } from '../src/commands/wire-crons.js';

async function main() {
  const [,, cmd, ...args] = process.argv;

  switch (cmd) {
    case 'init':        await init(); break;
    case 'audit':       await audit(); break;
    case 'status':      await status(); break;
    case 'doctor':      await doctor(); break;
    case 'install':     await install(args[0]); break;
    case 'wire-crons':  await wireCrons(); break;
    case '--version':
    case '-v':
      console.log('2.0.0'); break;
    default:
      console.log(`
  clawgear v2.0.0 — Configure production OpenClaw agent stacks

  Commands:
    init          Set up your agent workspace (or project)
    audit         Score your current setup (0-100)
    status        Show all projects and memory health
    doctor        Diagnose common OpenClaw issues
    install       Install a skill from ClawMart
    wire-crons    Wire reporting crons from .clawgear.yml

  Examples:
    npx clawgear init
    npx clawgear install close-the-loop-system
    npx clawgear audit
    npx clawgear wire-crons   (run inside a project folder)

  clawgear.io
`);
  }
}

main().catch(err => { console.error(err.message); process.exit(1); });
