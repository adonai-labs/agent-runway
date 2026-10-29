import chalk from 'chalk';
import ora from 'ora';
import { getAvailableStacks, installFromConfig } from '../utils';
import { requireInstallation } from './installation';

interface AddOptions {
  global?: boolean;
}

export async function addCommand(stack: string, options: AddOptions = {}) {
  const projectRoot = process.cwd();
  const installation = await requireInstallation(projectRoot, Boolean(options.global));
  const { config, isGlobal } = installation;
  console.log(chalk.cyan(isGlobal ? 'Adding to global installation\n' : 'Adding to project installation\n'));

  const availableStacks = getAvailableStacks();
  if (!availableStacks.some((s) => s.id === stack)) {
    console.log(chalk.red(`Stack "${stack}" not found.`));
    console.log(chalk.gray(`Available stacks: ${availableStacks.map((s) => s.id).join(', ')}`));
    process.exit(1);
  }

  if (config.stacks.includes(stack)) {
    console.log(chalk.yellow(`Stack "${stack}" is already installed ${isGlobal ? 'globally' : 'in this project'}.`));
    return;
  }

  const spinner = ora(`Adding ${stack} stack...`).start();
  try {
    config.stacks.push(stack);
    await installFromConfig(projectRoot, config, isGlobal);
    await installation.save();

    spinner.succeed(chalk.green(`Stack "${stack}" added successfully!`));
    console.log(
      chalk.gray(isGlobal ? 'This stack will now be available in ALL Cursor projects.' : 'Reload your editor to activate the new rules and skills.')
    );
  } catch (error) {
    spinner.fail(chalk.red('Failed to add stack'));
    console.error(error);
    process.exit(1);
  }
}
