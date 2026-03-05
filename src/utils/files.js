import { writeFile, mkdir, chmod } from 'fs/promises';
import { dirname } from 'path';

/**
 * Write a file, creating parent directories as needed.
 */
export async function createFile(filePath, content) {
  const dir = dirname(filePath);
  await mkdir(dir, { recursive: true });
  await writeFile(filePath, content, 'utf8');
}

/**
 * Make a file executable (chmod +x).
 */
export async function makeExecutable(filePath) {
  await chmod(filePath, 0o755);
}

/**
 * Ensure a directory exists (mkdir -p).
 */
export async function ensureDir(dirPath) {
  await mkdir(dirPath, { recursive: true });
}
