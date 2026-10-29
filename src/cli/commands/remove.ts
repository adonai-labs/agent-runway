import chalk from 'chalk';
import ora from 'ora';
import { installFromConfig } from '../utils';
import { requireInstallation } from './installation';

interface RemoveOptions {
  global?: boolean;
}

export async function removeCommand(stack: string, options: RemoveOptions = {}) {
  const projectRoot = process.cwd();
  const installation = await requireInstallation(projectRoot, Boolean(options.global));
  const { config, isGlobal } = installation;
  console.log(chalk.cyan(isGlobal ? 'Removing from global installation\n' : 'Removing from project installation\n'));

  if (!config.stacks.includes(stack)) {
    console.log(chalk.yellow(`Stack "${stack}" is not installed.`));
    return;
  }

  const spinner = ora(`Removing ${stack} stack...`).start();
  try {
    config.stacks = config.stacks.filter((s) => s !== stack);
    await installFromConfig(projectRoot, config, isGlobal);
    await installation.save();
    spinner.succeed(chalk.green(`Stack "${stack}" removed successfully!`));
  } catch (error) {
    spinner.fail(chalk.red('Failed to remove stack'));
    console.error(error);
    process.exit(1);
  }
}
