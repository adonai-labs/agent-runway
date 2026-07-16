import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import {
  findProjectConfig,
  saveConfig,
  copyCore,
  cleanupLegacyCursorMemory,
  copyStacks,
  copyNeutralSkills,
  copyClaude,
  copyVscode,
  ensureProjectScaffold,
  copyStackSpecTemplates,
  normalizeWorkflowMode,
} from '../utils';

interface UpgradeOptions {
  to?: string;
}

export async function upgradeCommand(options: UpgradeOptions = {}) {
  const projectRoot = process.cwd();
  const mode = normalizeWorkflowMode(options.to ?? 'structured');

  if (mode !== 'structured') {
    console.log(chalk.red('Only upgrade to `structured` is supported right now.'));
    process.exit(1);
  }

  const result = await findProjectConfig(projectRoot);
  if (!result) {
    console.log(chalk.red('Agent Runway is not initialized in this project. Run `agent-runway init` first.'));
    process.exit(1);
  }

  const { configDir, config } = result;
  const currentMode = normalizeWorkflowMode(config.mode);

  if (currentMode === 'structured') {
    console.log(chalk.yellow('This project is already using Structured mode.'));
    return;
  }

  const spinner = ora('Upgrading Agent Runway to Structured mode...').start();

  try {
    const targets = config.targets ?? ['cursor'];
    const installsCursor = targets.includes('cursor');
    const installsClaude = targets.includes('claude');
    const installsVscode = targets.includes('vscode');
    const cursorDir = path.join(projectRoot, '.cursor');

    if (installsCursor) {
      spinner.text = 'Installing Structured Cursor assets...';
      await copyCore(cursorDir, 'structured');
      await cleanupLegacyCursorMemory(cursorDir);
      if (config.stacks.length > 0) {
        await copyStacks(cursorDir, config.stacks);
      }
    }

    if (installsClaude) {
      spinner.text = 'Installing Structured Claude Code assets...';
      await copyNeutralSkills(projectRoot, config.stacks, 'structured');
      await copyClaude(projectRoot, config.stacks, 'structured');
    }

    if (installsVscode) {
      spinner.text = 'Installing Structured VS Code assets...';
      await copyVscode(projectRoot, config.stacks, 'structured');
    }

    spinner.text = 'Refreshing project scaffold...';
    await ensureProjectScaffold(projectRoot);
    await copyStackSpecTemplates(projectRoot, config.stacks);

    config.mode = 'structured';
    await saveConfig(configDir, config);

    spinner.succeed(chalk.green('Agent Runway upgraded to Structured mode successfully!'));
    console.log(chalk.gray('Existing memory, logs, checkpoints, and docs were preserved.'));
    console.log(chalk.gray('Reload your editor to apply the new workflow assets.'));
  } catch (error) {
    spinner.fail(chalk.red('Upgrade failed'));
    console.error(error);
    process.exit(1);
  }
}
