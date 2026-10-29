import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import chalk from 'chalk';
import { compareVersions } from './config';

const PACKAGE_NAME = '@adonai-labs/agent-runway';
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;
const CACHE_FILE = path.join(os.homedir(), '.config', 'agent-runway', 'update-check.json');

interface UpdateCache {
  checkedAt: number;
  latest?: string;
}

// Prints a one-line notice when npm has a newer release. Checks at most once a day,
// never in CI or non-interactive shells, and never delays or fails the CLI.
export async function notifyIfUpdateAvailable(currentVersion: string): Promise<void> {
  if (process.env.CI || process.env.NO_UPDATE_NOTIFIER || !process.stdout.isTTY) return;

  try {
    const cache: UpdateCache = (await fs.pathExists(CACHE_FILE)) ? await fs.readJson(CACHE_FILE) : { checkedAt: 0 };
    let latest = cache.latest;

    if (Date.now() - cache.checkedAt > CHECK_INTERVAL_MS) {
      const response = await fetch(`https://registry.npmjs.org/${PACKAGE_NAME}/latest`, {
        signal: AbortSignal.timeout(1500),
      });
      if (response.ok) latest = String(((await response.json()) as { version?: string }).version ?? '');
      await fs.outputJson(CACHE_FILE, { checkedAt: Date.now(), latest });
    }

    if (latest && compareVersions(currentVersion, latest) < 0) {
      console.log(
        chalk.yellow(`Agent Runway ${latest} is available (you have ${currentVersion}).`) +
          chalk.gray(` Run: npm install -D ${PACKAGE_NAME}@latest && npx agent-runway update`)
      );
    }
  } catch {
    // Best-effort only.
  }
}
