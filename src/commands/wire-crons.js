import * as p from '@clack/prompts';
import chalk from 'chalk';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import { findWorkspaceRoot } from '../utils/detect.js';

const TIME_TO_CRON = {
  '7am':  '0 7 * * *',
  '11am': '0 11 * * *',
  '3pm':  '0 15 * * *',
  '7pm':  '0 19 * * *',
  '11pm': '0 23 * * *',
  '9am':  '0 9 * * *',
  '9am_monday': '0 9 * * 1',
};

function parseYml(content) {
  const cfg = {};
  for (const line of content.split('\n')) {
    const m = line.match(/^(\w+):\s*"?([^"#\n]+)"?\s*$/);
    if (m) cfg[m[1].trim()] = m[2].trim();
    // Parse schedule array
    const schedM = line.match(/schedule:\s*\[([^\]]+)\]/);
    if (schedM) {
      cfg.schedule = schedM[1].split(',').map(s => s.trim().replace(/['"]/g, ''));
    }
  }
  return cfg;
}

export async function wireCrons() {
  const cwd = process.cwd();
  p.intro(chalk.bold.cyan('⚡ ClawGear Wire Crons'));

  // Find .clawgear.yml
  const ymlPath = join(cwd, '.clawgear.yml');
  if (!existsSync(ymlPath)) {
    p.log.error('.clawgear.yml not found. Run: clawgear init first.');
    p.outro('');
    return;
  }

  const cfg = parseYml(readFileSync(ymlPath, 'utf8'));
  const { project, channel, group, schedule } = cfg;

  if (!project) {
    p.log.error('.clawgear.yml is missing "project" field.');
    p.outro('');
    return;
  }

  if (!channel || channel === 'none') {
    p.log.info('Channel is set to "none" — no crons to wire.');
    p.outro('');
    return;
  }

  const times = Array.isArray(schedule) ? schedule : (schedule ? [schedule] : ['9am']);
  const groupId = group ? group.replace(/^-+/, match => match) : '';

  if (!groupId) {
    p.log.warn('No group ID set in .clawgear.yml. Crons will be wired without a delivery target.');
  }

  p.log.info(`Project: ${chalk.bold(project)}`);
  p.log.info(`Channel: ${chalk.bold(channel)} ${groupId ? chalk.dim(groupId) : ''}`);
  p.log.info(`Schedule: ${chalk.bold(times.join(', '))}`);
  console.log('');

  const confirm = await p.confirm({
    message: `Wire ${times.length} reporting cron(s) via OpenClaw?`,
    initialValue: true
  });
  if (p.isCancel(confirm) || !confirm) { p.outro('Cancelled.'); return; }

  // Check openclaw is available
  let openclawAvailable = false;
  try {
    execSync('which openclaw', { stdio: 'pipe' });
    openclawAvailable = true;
  } catch {}

  const workspaceRoot = findWorkspaceRoot(cwd) || cwd;
  const commands = [];

  for (const time of times) {
    const cronExpr = TIME_TO_CRON[time];
    if (!cronExpr) { p.log.warn(`Unknown schedule time: ${time}, skipping.`); continue; }

    const cronName = `${project}-${time}-report`;
    const message = `You are the CEO reporting on the ${project} project. Read projects/${project}/TASKS.md and projects/${project}/MEMORY.md. Send a concise update: what shipped, what's next, any blockers. 5 bullets max. Direct, no fluff.`;

    const cmd = [
      'openclaw cron add',
      `--name "${cronName}"`,
      `--cron "${cronExpr}"`,
      `--tz "America/Los_Angeles"`,
      `--session isolated`,
      `--message "${message.replace(/"/g, '\\"')}"`,
      `--announce`,
      `--channel ${channel}`,
      groupId ? `--to "${groupId}"` : ''
    ].filter(Boolean).join(' \\\n  ');

    commands.push({ name: cronName, cmd });
  }

  if (openclawAvailable) {
    const s = p.spinner();
    let wired = 0;
    for (const { name, cmd } of commands) {
      s.start(`Wiring ${name}...`);
      try {
        execSync(cmd, { stdio: 'pipe', cwd: workspaceRoot });
        s.stop(`${name} ✅`);
        wired++;
      } catch (e) {
        s.stop(`${name} ❌`);
        p.log.warn(`Failed: ${e.message?.substring(0, 100)}`);
        p.log.info('Run manually:\n' + cmd);
      }
    }
    p.log.success(`${wired}/${commands.length} crons wired.`);
  } else {
    p.log.warn('openclaw not found in PATH. Run these commands manually:');
    for (const { cmd } of commands) {
      console.log('\n' + chalk.dim(cmd));
    }
  }

  p.outro(chalk.dim('clawgear.io'));
}
