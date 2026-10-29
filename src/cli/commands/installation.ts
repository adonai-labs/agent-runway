import chalk from 'chalk';
import fs from 'fs-extra';
import {
  type Config,
  findProjectConfig,
  getGlobalCursorDir,
  loadConfig,
  resolveConfigPath,
  saveConfig,
  saveProjectConfig,
} from '../utils';

export interface Installation {
  config: Config;
  isGlobal: boolean;
  save: () => Promise<void>;
}

// Loads the project (or global) installation, exiting with guidance when none exists.
export async function requireInstallation(projectRoot: string, isGlobal: boolean): Promise<Installation> {
  if (isGlobal) {
    const globalDir = getGlobalCursorDir();
    if (!(await fs.pathExists(await resolveConfigPath(globalDir)))) {
      console.log(chalk.red('No global installation found. Run `agent-runway init --global` first.'));
      process.exit(1);
    }
    const config = await loadConfig(globalDir);
    return { config, isGlobal, save: () => saveConfig(globalDir, config) };
  }

  const result = await findProjectConfig(projectRoot);
  if (!result) {
    console.log(chalk.red('Agent Runway is not initialized in this project. Run `agent-runway init` first.'));
    process.exit(1);
  }
  const { config } = result;
  return { config, isGlobal, save: () => saveProjectConfig(projectRoot, config) };
}
