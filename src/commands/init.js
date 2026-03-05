import * as p from '@clack/prompts';
import chalk from 'chalk';
import { join } from 'path';
import { existsSync } from 'fs';
import { createFile, makeExecutable, ensureDir } from '../utils/files.js';
import { isWorkspaceLevel, findWorkspaceRoot } from '../utils/detect.js';
import { SOUL, AGENTS, USER, HEARTBEAT, MEMORY_SYNC, PRE_COMMIT,
         PROJECT_MD, TASKS_MD, PROJECT_MEMORY, CLAWGEAR_YML } from '../templates/index.js';

export async function init() {
  const cwd = process.cwd();
  const workspaceRoot = findWorkspaceRoot(cwd);
  const isProjectLevel = workspaceRoot !== null;

  p.intro(chalk.bold.cyan('⚡ ClawGear') + '  The production OpenClaw stack, configured in minutes.');

  if (isProjectLevel) {
    await initProject(cwd, workspaceRoot);
  } else {
    await initWorkspace(cwd);
  }
}

async function initWorkspace(cwd) {
  p.log.info('Setting up a new agent workspace.');

  const answers = await p.group({
    name: () => p.text({
      message: "What's your agent's name?",
      placeholder: 'Pinzas',
      validate: v => v.trim() ? undefined : 'Name required'
    }),
    operatorType: () => p.select({
      message: 'What kind of operator are you?',
      options: [
        { value: 'founder', label: 'Founder', hint: 'Multiple projects, Telegram updates, full autonomy' },
        { value: 'solo',    label: 'Solo operator', hint: '1 agent handling everything' },
        { value: 'developer', label: 'Developer', hint: 'Code review, PR gates, coding agent patterns' },
        { value: 'team',    label: 'Team operator', hint: 'Multiple agents, dept heads, sub-agent orchestration' },
      ]
    }),
    pain: () => p.select({
      message: "Biggest pain right now?",
      options: [
        { value: 'memory',   label: 'Agent forgets things between sessions' },
        { value: 'silent',   label: 'Tasks get acknowledged but never finished' },
        { value: 'bleed',    label: 'Projects bleed into each other' },
        { value: 'fresh',    label: 'Starting fresh, no setup yet' },
      ]
    }),
    channels: () => p.multiselect({
      message: 'Which channels do you use?',
      options: [
        { value: 'Telegram', label: 'Telegram', hint: 'recommended' },
        { value: 'Discord',  label: 'Discord' },
        { value: 'WhatsApp', label: 'WhatsApp' },
      ],
      required: false
    }),
  }, { onCancel: () => { p.cancel('Setup cancelled.'); process.exit(0); } });

  let telegramId = '';
  let discordId = '';
  if (answers.channels.includes('Telegram')) {
    telegramId = await p.text({ message: 'Your Telegram chat ID?', placeholder: '1176440324' }) || '';
  }
  if (answers.channels.includes('Discord')) {
    discordId = await p.text({ message: 'Your Discord server ID?', placeholder: '123456789' }) || '';
  }

  const projects = [];
  p.log.info('Which projects are you running? (leave blank to finish)');
  while (true) {
    const proj = await p.text({ message: 'Project name', placeholder: projects.length === 0 ? 'my-project' : '(press enter to finish)' });
    if (p.isCancel(proj) || !proj || !proj.trim()) break;
    projects.push(proj.trim());
  }

  const s = p.spinner();
  s.start('Setting up your workspace...');

  const channelStr = answers.channels[0] || 'Telegram';
  const channelId = channelStr === 'Telegram' ? telegramId : discordId;

  await createFile(join(cwd, 'SOUL.md'), SOUL[answers.operatorType](answers.name));
  await createFile(join(cwd, 'AGENTS.md'), AGENTS(answers.name, channelStr, channelId));
  await createFile(join(cwd, 'USER.md'), USER(answers.name, channelStr, channelId, 'America/Los_Angeles'));
  await createFile(join(cwd, 'HEARTBEAT.md'), HEARTBEAT);
  await createFile(join(cwd, 'MEMORY.md'), `# MEMORY.md — ${answers.name}\n_Last updated: ${new Date().toISOString().split('T')[0]}_\n\n## About Me\nName: ${answers.name}\n\n## About My Human\n_Fill this in after your first session_\n`);

  const today = new Date().toISOString().split('T')[0];
  await createFile(join(cwd, `memory/${today}.md`), `# ${today}\n\n## Session Log\n_Agent workspace initialized with ClawGear_\n`);

  await createFile(join(cwd, 'scripts/memory-sync.sh'), MEMORY_SYNC);
  await makeExecutable(join(cwd, 'scripts/memory-sync.sh'));

  if (existsSync(join(cwd, '.git'))) {
    await createFile(join(cwd, '.git/hooks/pre-commit'), PRE_COMMIT);
    await makeExecutable(join(cwd, '.git/hooks/pre-commit'));
  }

  for (const proj of projects) {
    await createFile(join(cwd, `projects/${proj}/PROJECT.md`), PROJECT_MD(proj, ''));
    await createFile(join(cwd, `projects/${proj}/TASKS.md`), TASKS_MD(proj));
    await createFile(join(cwd, `projects/${proj}/MEMORY.md`), PROJECT_MEMORY(proj));
  }

  s.stop('Done!');

  p.log.success(chalk.green('SOUL.md') + ' — operator identity system');
  p.log.success(chalk.green('AGENTS.md') + ' — session rules and memory architecture');
  p.log.success(chalk.green('USER.md') + ' — your preferences wired in');
  p.log.success(chalk.green('HEARTBEAT.md') + ' — proactive checks configured');
  p.log.success(chalk.green('scripts/memory-sync.sh') + ' — drift prevention');
  if (existsSync(join(cwd, '.git'))) {
    p.log.success(chalk.green('.git/hooks/pre-commit') + ' — memory enforcement on every commit');
  }
  for (const proj of projects) {
    p.log.success(chalk.green(`projects/${proj}/`) + ' — PROJECT.md, TASKS.md, MEMORY.md');
  }

  const installStack = await p.confirm({
    message: chalk.bold('Install the Operator Stack to complete your setup?') + chalk.dim(' ($99 — 5 skills that enforce everything above)'),
    initialValue: false
  });

  if (!p.isCancel(installStack) && installStack) {
    const { exec } = await import('child_process');
    exec('open https://shopclawmart.com/listings/operator-stack');
    p.log.info('Opening ClawMart...');
  }

  p.outro(chalk.bold('Your agent is ready.') + '  Start with: ' + chalk.cyan('openclaw chat') + '\n\n  ' + chalk.dim('Configured by ClawGear ⚡ clawgear.io'));
}

async function initProject(cwd, workspaceRoot) {
  const defaultName = cwd.split('/').pop();
  p.log.info(`Workspace detected at ${workspaceRoot}. Setting up a project.`);

  const answers = await p.group({
    name: () => p.text({
      message: 'Project name?',
      initialValue: defaultName,
      validate: v => v.trim() ? undefined : 'Name required'
    }),
    desc: () => p.text({
      message: 'One-line description?',
      placeholder: 'What is this project?'
    }),
    channel: () => p.select({
      message: 'Where should this project report?',
      options: [
        { value: 'Telegram', label: 'Telegram group' },
        { value: 'Discord',  label: 'Discord channel' },
        { value: 'none',     label: 'No reporting' },
      ]
    }),
  }, { onCancel: () => { p.cancel('Setup cancelled.'); process.exit(0); } });

  let groupId = '';
  if (answers.channel === 'Telegram') {
    groupId = await p.text({ message: 'Telegram group ID?', placeholder: '-1001234567890' }) || '';
  } else if (answers.channel === 'Discord') {
    groupId = await p.text({ message: 'Discord channel ID?', placeholder: '123456789' }) || '';
  }

  const schedule = await p.select({
    message: 'Reporting frequency?',
    options: [
      { value: '5x daily (founder mode)', label: '5x daily', hint: '7am, 11am, 3pm, 7pm, 11pm' },
      { value: 'Daily summary',           label: 'Daily summary', hint: '9am' },
      { value: 'Weekly',                  label: 'Weekly', hint: 'Monday 9am' },
      { value: 'On-demand only',          label: 'On-demand only' },
    ]
  });

  const subAgents = await p.confirm({ message: 'Allow sub-agents for this project?', initialValue: true });

  const s = p.spinner();
  s.start('Creating project structure...');

  await createFile(join(cwd, 'PROJECT.md'), PROJECT_MD(answers.name, answers.desc));
  await createFile(join(cwd, 'TASKS.md'), TASKS_MD(answers.name));
  await createFile(join(cwd, 'MEMORY.md'), PROJECT_MEMORY(answers.name));
  await createFile(join(cwd, '.clawgear.yml'), CLAWGEAR_YML({
    name: answers.name, desc: answers.desc,
    channel: answers.channel, groupId,
    schedule: p.isCancel(schedule) ? 'Daily summary' : schedule,
    subAgents: !p.isCancel(subAgents) && subAgents
  }));

  s.stop('Done!');

  p.log.success(chalk.green('PROJECT.md') + ' — project context');
  p.log.success(chalk.green('TASKS.md') + ' — task tracker');
  p.log.success(chalk.green('MEMORY.md') + ' — project memory');
  p.log.success(chalk.green('.clawgear.yml') + ' — project config');

  p.outro(chalk.bold(`${answers.name} is configured.`) + '\n\n  ' + chalk.dim('Configured by ClawGear ⚡ clawgear.io'));
}
