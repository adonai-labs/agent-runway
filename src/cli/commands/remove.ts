import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import {
  findProjectConfig,
  loadConfig,
  saveConfig,
  copyCore,
  cleanupLegacyCursorMemory,
  copyStacks,
  copyNeutralSkills,
  copyClaude,
  copyVscode,
  removeStackSpecTemplate,
  getGlobalCursorDir,
  resolveConfigPath,
} from '../utils';

interface RemoveOptions {
  global?: boolean;
}

export async function removeCommand(stack: string, options: RemoveOptions = {}) {
  const projectRoot = process.cwd();
  const isGlobal = options.global || false;

  let configDir: string;
  let config: Awaited<ReturnType<typeof loadConfig>>;

  if (isGlobal) {
    const globalDir = getGlobalCursorDir();
    const configPath = await resolveConfigPath(globalDir);
    if (!(await fs.pathExists(configPath))) {
      console.log(chalk.red('No global installation found. Run `agent-runway init --global` first.'));
      process.exit(1);
    }
    configDir = globalDir;
    config = await loadConfig(globalDir);
    console.log(chalk.cyan('Removing from global installation\n'));
  } else {
    const result = await findProjectConfig(projectRoot);
    if (!result) {
      console.log(chalk.red('Agent Runway is not initialized in this project.'));
      process.exit(1);
    }
    configDir = result.configDir;
    config = result.config;
    console.log(chalk.cyan('Removing from project installation\n'));
  }

  if (!config.stacks.includes(stack)) {
    console.log(chalk.yellow(`Stack "${stack}" is not installed.`));
    return;
  }

  const spinner = ora(`Removing ${stack} stack...`).start();

  try {
    const updatedStacks = config.stacks.filter((s) => s !== stack);
    const targets = config.targets ?? ['cursor'];

    if (isGlobal || targets.includes('cursor')) {
      await copyCore(configDir);
      await cleanupLegacyCursorMemory(configDir);
      if (updatedStacks.length > 0) {
        await copyStacks(configDir, updatedStacks);
      }
    }
    if (!isGlobal && targets.includes('claude')) {
      await copyNeutralSkills(projectRoot, updatedStacks);
      await copyClaude(projectRoot, updatedStacks);
    }
    if (!isGlobal && targets.includes('vscode')) {
      await copyVscode(projectRoot, updatedStacks);
    }
    if (!isGlobal) {
      await removeStackSpecTemplate(projectRoot, stack);
    }

    config.stacks = updatedStacks;
    await saveConfig(configDir, config);

    spinner.succeed(chalk.green(`Stack "${stack}" removed successfully!`));
  } catch (error) {
    spinner.fail(chalk.red('Failed to remove stack'));
    console.error(error);
    process.exit(1);
  }
}
