import * as p from '@clack/prompts';
import chalk from 'chalk';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

export async function doctor() {
  const cwd = process.cwd();
  p.intro(chalk.bold.cyan('⚡ ClawGear Doctor'));

  const ok  = (msg) => console.log(`  ${chalk.green('✅')}  ${msg}`);
  const warn = (msg) => console.log(`  ${chalk.yellow('⚠️')}  ${msg}`);
  const err  = (msg) => console.log(`  ${chalk.red('❌')}  ${msg}`);

  // OpenClaw installed?
  try {
    execSync('which openclaw', { stdio: 'pipe' });
    const ver = execSync('openclaw --version 2>/dev/null || echo "installed"', { encoding: 'utf8' }).trim();
    ok(`OpenClaw installed: ${ver}`);
  } catch {
    err('OpenClaw not found in PATH. Install from: openclaw.ai');
  }

  // Gateway running?
  try {
    execSync('curl -sf http://localhost:18789/health', { stdio: 'pipe', timeout: 3000 });
    ok('OpenClaw gateway: running (port 18789)');
  } catch {
    warn('OpenClaw gateway not responding on port 18789. Run: openclaw gateway start');
  }

  // Workspace files
  ok('clawgear CLI: working');
  existsSync(join(cwd, 'SOUL.md'))     ? ok('SOUL.md found')    : warn('SOUL.md missing — run: clawgear init');
  existsSync(join(cwd, 'AGENTS.md'))   ? ok('AGENTS.md found')  : warn('AGENTS.md missing — run: clawgear init');
  existsSync(join(cwd, 'HEARTBEAT.md'))? ok('HEARTBEAT.md found'): warn('HEARTBEAT.md missing — run: clawgear init');

  // Memory sync
  const syncScript = join(cwd, 'scripts/memory-sync.sh');
  if (existsSync(syncScript)) {
    try {
      execSync(`bash ${syncScript}`, { stdio: 'pipe' });
      ok('Memory sync: clean');
    } catch {
      warn('Memory sync: drift detected. Run: bash scripts/memory-sync.sh');
    }
  } else {
    warn('scripts/memory-sync.sh missing — run: clawgear init');
  }

  // Projects with invalid yml
  const projectsDir = join(cwd, 'projects');
  if (existsSync(projectsDir)) {
    try {
      const { readdirSync, statSync } = await import('fs');
      const projects = readdirSync(projectsDir).filter(f =>
        statSync(join(projectsDir, f)).isDirectory()
      );
      for (const proj of projects) {
        const yml = join(projectsDir, proj, '.clawgear.yml');
        if (!existsSync(yml)) {
          warn(`${proj}: no .clawgear.yml — run: cd projects/${proj} && clawgear init`);
        } else {
          const content = readFileSync(yml, 'utf8');
          if (!content.includes('project:') || !content.includes('channel:')) {
            warn(`${proj}: .clawgear.yml missing required fields`);
          } else {
            ok(`${proj}: .clawgear.yml valid`);
          }
        }
      }
    } catch {}
  }

  p.outro(chalk.dim('clawgear.io'));
}
