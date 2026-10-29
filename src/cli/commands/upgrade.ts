import chalk from 'chalk';
import ora from 'ora';
import { getPackageVersion, installFromConfig, normalizeWorkflowMode } from '../utils';
import { requireInstallation } from './installation';

interface UpgradeOptions {
  to?: string;
}

export async function upgradeCommand(options: UpgradeOptions = {}) {
  const projectRoot = process.cwd();
  if (normalizeWorkflowMode(options.to ?? 'structured') !== 'structured') {
    console.log(chalk.red('Only upgrade to `structured` is supported right now.'));
    process.exit(1);
  }

  const installation = await requireInstallation(projectRoot, false);
  const { config } = installation;
  if (normalizeWorkflowMode(config.mode) === 'structured') {
    console.log(chalk.yellow('This project is already using Structured mode.'));
    return;
  }

  const spinner = ora('Upgrading Agent Runway to Structured mode...').start();
  try {
    config.mode = 'structured';
    config.version = getPackageVersion();
    await installFromConfig(projectRoot, config);
    await installation.save();

    spinner.succeed(chalk.green('Agent Runway upgraded to Structured mode successfully!'));
    console.log(chalk.gray('Existing memory, logs, checkpoints, and docs were preserved.'));
    console.log(chalk.gray('Reload your editor to apply the new workflow assets.'));
  } catch (error) {
    spinner.fail(chalk.red('Upgrade failed'));
    console.error(error);
    process.exit(1);
  }
}
