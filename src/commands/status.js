import * as p from '@clack/prompts';
import chalk from 'chalk';
import { existsSync, readdirSync, statSync, readFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

export async function status() {
  const cwd = process.cwd();
  p.intro(chalk.bold.cyan('⚡ ClawGear Status'));

  // Memory sync
  const syncScript = join(cwd, 'scripts/memory-sync.sh');
  if (existsSync(syncScript)) {
    try {
      execSync(`bash ${syncScript}`, { stdio: 'pipe' });
      p.log.success('Memory sync: ' + chalk.green('all synced'));
    } catch {
      p.log.warn('Memory sync: ' + chalk.yellow('drift detected — run: bash scripts/memory-sync.sh'));
    }
  }

  console.log('');

  // Projects
  const projectsDir = join(cwd, 'projects');
  if (!existsSync(projectsDir)) {
    p.log.info('No projects/ directory found. Run: clawgear init');
    p.outro('');
    return;
  }

  const projects = readdirSync(projectsDir).filter(f =>
    statSync(join(projectsDir, f)).isDirectory()
  );

  if (projects.length === 0) {
    p.log.info('No projects found. Run: clawgear init to add projects.');
    p.outro('');
    return;
  }

  console.log(`  ${chalk.bold(projects.length + ' project(s)')}\n`);

  for (const proj of projects) {
    const pd = join(projectsDir, proj);
    const cfgPath = join(pd, '.clawgear.yml');
    const tasksPath = join(pd, 'TASKS.md');

    let channel = 'not configured';
    let schedule = '';
    if (existsSync(cfgPath)) {
      const cfg = readFileSync(cfgPath, 'utf8');
      const chanMatch = cfg.match(/channel:\s*(\S+)/);
      const grpMatch = cfg.match(/group:\s*"?([^"\n]+)"?/);
      const schedMatch = cfg.match(/schedule:\s*(\[.+\])/);
      if (chanMatch) channel = chanMatch[1] + (grpMatch ? ` ${grpMatch[1]}` : '');
      if (schedMatch) schedule = schedMatch[1];
    }

    let lastUpdated = 'never';
    if (existsSync(tasksPath)) {
      const mtime = statSync(tasksPath).mtime;
      const diff = Date.now() - mtime.getTime();
      const hours = Math.floor(diff / 3600000);
      lastUpdated = hours < 1 ? 'just now' : hours < 24 ? `${hours}h ago` : `${Math.floor(hours/24)}d ago`;
    }

    console.log(`  ${chalk.bold.white(proj)}`);
    console.log(`    Channel:      ${chalk.cyan(channel)}`);
    if (schedule) console.log(`    Reports:      ${chalk.dim(schedule)}`);
    console.log(`    TASKS.md:     last updated ${chalk.dim(lastUpdated)}`);
    console.log('');
  }

  p.outro(chalk.dim('clawgear.io'));
}
