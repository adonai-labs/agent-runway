import chalk from 'chalk';
import ora from 'ora';
import { getPackageVersion, installFromConfig } from '../utils';
import { requireInstallation } from './installation';

interface UpdateOptions {
  global?: boolean;
}

export async function updateCommand(options: UpdateOptions = {}) {
  const projectRoot = process.cwd();
  const installation = await requireInstallation(projectRoot, Boolean(options.global));
  const { config, isGlobal } = installation;
  console.log(chalk.cyan(isGlobal ? '📍 Updating global installation\n' : '📁 Updating project installation\n'));

  const spinner = ora('Updating Agent Runway...').start();
  try {
    await installFromConfig(projectRoot, config, isGlobal);

    // Record the framework version now on disk so `status` stops reporting drift.
    config.version = getPackageVersion();
    await installation.save();

    spinner.succeed(chalk.green('Agent Runway updated successfully!'));
    if (isGlobal) {
      console.log(chalk.gray('Global installation updated - affects ALL Cursor projects.'));
    } else {
      console.log(chalk.gray(`Updated: ${config.targets.join(' + ')}. Reload your editor to apply changes.`));
    }
  } catch (error) {
    spinner.fail(chalk.red('Update failed'));
    console.error(error);
    process.exit(1);
  }
}
