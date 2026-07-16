import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import {
  findProjectConfig,
  loadConfig,
  copyCore,
  cleanupLegacyCursorMemory,
  copyStacks,
  copyNeutralSkills,
  copyClaude,
  copyVscode,
  ensureProjectScaffold,
  getGlobalCursorDir,
  resolveConfigPath,
  normalizeWorkflowMode,
} from '../utils';

interface UpdateOptions {
  global?: boolean;
}

export async function updateCommand(options: UpdateOptions = {}) {
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
    console.log(chalk.cyan('📍 Updating global installation\n'));
  } else {
    const result = await findProjectConfig(projectRoot);
    if (!result) {
      console.log(chalk.red('Agent Runway is not initialized in this project. Run `agent-runway init` first.'));
      process.exit(1);
    }
    configDir = result.configDir;
    config = result.config;
    console.log(chalk.cyan('📁 Updating project installation\n'));
  }

  const spinner = ora('Updating Agent Runway...').start();

  try {
    const targets = config.targets ?? ['cursor'];
    const mode = normalizeWorkflowMode(config.mode);
    const installsCursor = isGlobal || targets.includes('cursor');
    const installsClaude = !isGlobal && targets.includes('claude');
    const installsVscode = !isGlobal && targets.includes('vscode');

    if (installsCursor) {
      spinner.text = 'Updating core files...';
      await copyCore(configDir, mode);
      await cleanupLegacyCursorMemory(configDir);

      if (config.stacks.length > 0) {
        spinner.text = `Updating stacks: ${config.stacks.join(', ')}...`;
        await copyStacks(configDir, config.stacks);
      }
    }

    if (installsClaude) {
      spinner.text = 'Updating Claude Code support...';
      await copyNeutralSkills(projectRoot, config.stacks, mode);
      await copyClaude(projectRoot, config.stacks, mode);
    }

    if (installsVscode) {
      spinner.text = 'Updating VS Code support...';
      await copyVscode(projectRoot, config.stacks, mode);
    }

    if (!isGlobal) {
      spinner.text = 'Refreshing project scaffold...';
      await ensureProjectScaffold(projectRoot);
    }

    spinner.succeed(chalk.green('Agent Runway updated successfully!'));

    if (isGlobal) {
      console.log(chalk.gray('Global installation updated - affects ALL Cursor projects.'));
    } else {
      const targetLabel = targets.join(' + ');
      console.log(chalk.gray(`Updated: ${targetLabel}. Reload your editor to apply changes.`));
    }
  } catch (error) {
    spinner.fail(chalk.red('Update failed'));
    console.error(error);
    process.exit(1);
  }
}
