import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import {
  findProjectConfig,
  loadConfig,
  saveConfig,
  getAvailableStacks,
  copyStacks,
  copyNeutralSkills,
  copyClaude,
  copyVscode,
  copyStackSpecTemplates,
  getGlobalCursorDir,
  resolveConfigPath,
  normalizeWorkflowMode,
} from '../utils';

interface AddOptions {
  global?: boolean;
}

export async function addCommand(stack: string, options: AddOptions = {}) {
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
    console.log(chalk.cyan('Adding to global installation\n'));
  } else {
    const result = await findProjectConfig(projectRoot);
    if (!result) {
      console.log(chalk.red('Agent Runway is not initialized in this project. Run `agent-runway init` first.'));
      process.exit(1);
    }
    configDir = result.configDir;
    config = result.config;
    console.log(chalk.cyan('Adding to project installation\n'));
  }

  const availableStacks = getAvailableStacks();
  if (!availableStacks.some((s) => s.id === stack)) {
    console.log(chalk.red(`Stack "${stack}" not found.`));
    console.log(chalk.gray(`Available stacks: ${availableStacks.map((s) => s.id).join(', ')}`));
    process.exit(1);
  }

  if (config.stacks.includes(stack)) {
    const location = isGlobal ? 'globally' : 'in this project';
    console.log(chalk.yellow(`Stack "${stack}" is already installed ${location}.`));
    return;
  }

  const spinner = ora(`Adding ${stack} stack...`).start();

  try {
    const targets = config.targets ?? ['cursor'];
    const mode = normalizeWorkflowMode(config.mode);
    const installsCursor = isGlobal || targets.includes('cursor');
    const installsClaude = !isGlobal && targets.includes('claude');
    const installsVscode = !isGlobal && targets.includes('vscode');
    const cursorDir = isGlobal ? configDir : path.join(projectRoot, '.cursor');
    const updatedStacks = [...config.stacks, stack];

    if (installsCursor) {
      await copyStacks(cursorDir, updatedStacks);
    }
    if (installsClaude) {
      await copyNeutralSkills(projectRoot, updatedStacks, mode);
      await copyClaude(projectRoot, updatedStacks, mode);
    }
    if (installsVscode) {
      await copyVscode(projectRoot, updatedStacks, mode);
    }
    if (!isGlobal) {
      await copyStackSpecTemplates(projectRoot, [stack]);
    }

    config.stacks.push(stack);
    await saveConfig(configDir, config);

    spinner.succeed(chalk.green(`Stack "${stack}" added successfully!`));

    if (isGlobal) {
      console.log(chalk.gray('This stack will now be available in ALL Cursor projects.'));
    } else {
      console.log(chalk.gray('Reload Cursor window or restart Claude Code to activate the new rules.'));
    }
  } catch (error) {
    spinner.fail(chalk.red('Failed to add stack'));
    console.error(error);
    process.exit(1);
  }
}
