import { existsSync } from 'fs';
import { dirname, join } from 'path';

/**
 * Walk up from startDir (not including startDir itself) looking for SOUL.md.
 * Returns the directory path containing SOUL.md, or null if not found.
 */
export function findWorkspaceRoot(startDir = process.cwd()) {
  let current = dirname(startDir);

  while (true) {
    if (existsSync(join(current, 'SOUL.md'))) {
      return current;
    }
    const parent = dirname(current);
    if (parent === current) break; // filesystem root reached
    current = parent;
  }

  return null;
}

/**
 * Returns true if running at workspace level (no parent SOUL.md found).
 */
export function isWorkspaceLevel() {
  return findWorkspaceRoot() === null;
}
