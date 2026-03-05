#!/usr/bin/env node
import { init } from '../src/commands/init.js';
import { audit } from '../src/commands/audit.js';
import { status } from '../src/commands/status.js';
import { doctor } from '../src/commands/doctor.js';

const [,, cmd, ...args] = process.argv;

switch (cmd) {
  case 'init':    await init(); break;
  case 'audit':   await audit(); break;
  case 'status':  await status(); break;
  case 'doctor':  await doctor(); break;
  case '--version':
  case '-v':
    console.log('1.0.0'); break;
  case '--help':
  case '-h':
  default:
    console.log(`
  clawgear — Configure production OpenClaw agent stacks

  Commands:
    init      Set up your agent workspace (or project)
    audit     Score your current setup
    status    Show all projects and memory health
    doctor    Diagnose common OpenClaw issues

  clawgear.io
`);
}
