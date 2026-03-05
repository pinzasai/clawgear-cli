import * as p from '@clack/prompts';
import chalk from 'chalk';
import { existsSync, statSync, readdirSync } from 'fs';
import { join } from 'path';
import { readFileSync } from 'fs';

export async function audit() {
  const cwd = process.cwd();
  p.intro(chalk.bold.cyan('⚡ ClawGear Audit'));

  const checks = [];
  const check = (label, pass, fix) => {
    checks.push({ label, pass, fix });
    const icon = pass ? chalk.green('✅') : chalk.red('❌');
    console.log(`  ${icon}  ${label}`);
    if (!pass && fix) console.log(`      ${chalk.dim('→ ' + fix)}`);
  };

  // Workspace checks
  const soulPath = join(cwd, 'SOUL.md');
  const soulExists = existsSync(soulPath);
  const soulSize = soulExists ? statSync(soulPath).size : 0;
  check('SOUL.md present and substantive (>200 chars)', soulExists && soulSize > 200,
    'Run: clawgear init');

  check('AGENTS.md present', existsSync(join(cwd, 'AGENTS.md')),
    'Run: clawgear init');

  check('USER.md present', existsSync(join(cwd, 'USER.md')),
    'Run: clawgear init');

  check('HEARTBEAT.md configured', existsSync(join(cwd, 'HEARTBEAT.md')),
    'Run: clawgear init');

  const syncScript = join(cwd, 'scripts/memory-sync.sh');
  check('scripts/memory-sync.sh present and executable',
    existsSync(syncScript) && (statSync(syncScript).mode & 0o111) !== 0,
    'Run: clawgear init');

  check('.git/hooks/pre-commit installed',
    existsSync(join(cwd, '.git/hooks/pre-commit')),
    'Run: clawgear init (in a git repo)');

  const memoryDir = join(cwd, 'memory');
  const hasMemory = existsSync(memoryDir) && readdirSync(memoryDir).length > 0;
  check('memory/ directory has daily notes', hasMemory,
    'Daily notes are created automatically on first session');

  // Project checks
  const projectsDir = join(cwd, 'projects');
  const hasProjects = existsSync(projectsDir);
  check('projects/ directory exists', hasProjects, 'Run: clawgear init and add projects');

  if (hasProjects) {
    const projects = readdirSync(projectsDir).filter(f =>
      statSync(join(projectsDir, f)).isDirectory()
    );
    for (const proj of projects) {
      const pd = join(projectsDir, proj);
      check(`${proj}/PROJECT.md`, existsSync(join(pd, 'PROJECT.md')), `Create: projects/${proj}/PROJECT.md`);
      check(`${proj}/TASKS.md`, existsSync(join(pd, 'TASKS.md')), `Create: projects/${proj}/TASKS.md`);
      check(`${proj}/MEMORY.md`, existsSync(join(pd, 'MEMORY.md')), `Create: projects/${proj}/MEMORY.md`);
      check(`${proj}/.clawgear.yml`, existsSync(join(pd, '.clawgear.yml')),
        `cd projects/${proj} && clawgear init`);
    }
  }

  const passed = checks.filter(c => c.pass).length;
  const total = checks.length;
  const score = Math.round((passed / total) * 100);

  console.log('');
  const scoreColor = score >= 80 ? chalk.green : score >= 60 ? chalk.yellow : chalk.red;
  console.log(`  Score: ${scoreColor.bold(score + '/100')}  (${passed}/${total} checks passed)`);
  console.log('');

  if (score < 60) {
    p.log.warn('Your setup needs significant work. A Setup Audit will get you production-ready fast.');
    p.log.info('Book a Setup Audit → ' + chalk.cyan('mailto:audit@clawgear.io') + ' ($500)');
  } else if (score < 80) {
    p.log.warn('Solid start. The Operator Stack will close the gaps automatically.');
    p.log.info('Get the Operator Stack → ' + chalk.cyan('shopclawmart.com/listings/operator-stack') + ' ($99)');
  } else {
    p.log.success('Your setup is solid. For expert review: ' + chalk.cyan('audit@clawgear.io'));
  }

  p.outro(chalk.dim('Configured by ClawGear ⚡ clawgear.io'));
}
