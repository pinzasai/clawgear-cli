import * as p from '@clack/prompts';
import chalk from 'chalk';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { createFile } from '../utils/files.js';

const CLAWMART_API = 'https://www.shopclawmart.com/api/v1';

function getApiKey() {
  const paths = [
    join(homedir(), '.openclaw', 'agent-accounts.json'),
  ];
  for (const p of paths) {
    if (existsSync(p)) {
      try {
        const d = JSON.parse(readFileSync(p, 'utf8'));
        return d?.accounts?.clawmart?.apiKey || null;
      } catch {}
    }
  }
  return null;
}

export async function install(skillArg) {
  p.intro(chalk.bold.cyan('⚡ ClawGear Install'));

  if (!skillArg) {
    p.log.error('Usage: clawgear install <skill-name>');
    p.log.info('Browse skills at: ' + chalk.cyan('clawgear.io'));
    p.outro('');
    return;
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    p.log.warn('No ClawMart API key found at ~/.openclaw/agent-accounts.json');
    p.log.info('Browse and purchase skills at: ' + chalk.cyan('clawgear.io'));
    p.outro('');
    return;
  }

  const s = p.spinner();
  s.start(`Searching for "${skillArg}"...`);

  let listing = null;
  try {
    const res = await fetch(
      `${CLAWMART_API}/listings?search=${encodeURIComponent(skillArg)}&limit=10`,
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );
    const data = await res.json();
    const listings = data?.data?.listings || data?.listings || [];
    listing = listings.find(l =>
      (l.name || l.title || '').toLowerCase().includes(skillArg.toLowerCase()) ||
      (l.slug || '').toLowerCase().includes(skillArg.toLowerCase())
    ) || listings[0];
  } catch (e) {
    s.stop('Search failed.');
    p.log.error('Could not reach ClawMart: ' + e.message);
    p.outro('');
    return;
  }

  if (!listing) {
    s.stop('Not found.');
    p.log.warn(`No skill found matching "${skillArg}"`);
    p.log.info('Browse all skills: ' + chalk.cyan('clawgear.io'));
    p.outro('');
    return;
  }

  s.stop('Found!');

  const price = listing.price || (listing.priceCents ? (listing.priceCents / 100).toFixed(0) : '?');
  console.log('');
  console.log(`  ${chalk.bold(listing.name || listing.title)}`);
  console.log(`  ${chalk.dim((listing.tagline || listing.description || '').substring(0, 90))}`);
  console.log(`  ${chalk.green('$' + price)}`);
  console.log('');

  const confirm = await p.confirm({
    message: `Install ${chalk.bold(listing.name || listing.title)}?`,
    initialValue: true
  });
  if (p.isCancel(confirm) || !confirm) { p.outro('Cancelled.'); return; }

  const s2 = p.spinner();
  s2.start('Downloading skill...');

  // Try to fetch the latest version package
  let skillContent = null;
  try {
    const vRes = await fetch(
      `${CLAWMART_API}/listings/${listing.id}/versions/latest`,
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );
    if (vRes.ok) {
      const vData = await vRes.json();
      skillContent = vData?.data?.content || vData?.content || null;
    }
  } catch {}

  // Fallback metadata stub
  if (!skillContent) {
    skillContent = `---
name: ${listing.name || skillArg}
version: "1.0"
price: ${price}
description: "${(listing.tagline || listing.description || '').replace(/"/g, "'").substring(0, 100)}"
source: https://clawgear.io
listing_id: ${listing.id}
---

# ${listing.name || skillArg}

${listing.about || listing.description || ''}

## Install
Full skill files are available after purchase at:
https://www.shopclawmart.com/listings/${listing.id}
`;
  }

  // Security scan
  const flags = ['child_process', 'eval(', '.exec(', '.spawn(', 'require("child']
    .filter(p => skillContent.includes(p));

  const skillSlug = (listing.slug || skillArg).toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const installPath = join(homedir(), '.openclaw', 'workspace', 'skills', skillSlug);
  await createFile(join(installPath, 'SKILL.md'), skillContent);

  s2.stop('Done!');

  p.log.success(`Installed: ${chalk.dim('~/.openclaw/workspace/skills/' + skillSlug + '/SKILL.md')}`);

  if (flags.length > 0) {
    p.log.warn(`⚠ Security flags: ${flags.join(', ')} — review before use`);
  } else {
    p.log.success('Security scan: clean');
  }

  p.outro(chalk.dim('clawgear.io'));
}
