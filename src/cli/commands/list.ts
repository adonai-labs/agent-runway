import chalk from 'chalk';
import { findProjectConfig, getAvailableStacks } from '../utils';
import { PRESETS } from '../presets';

export async function listCommand() {
  const projectRoot = process.cwd();
  const availableStacks = getAvailableStacks();
  const projectConfig = await findProjectConfig(projectRoot);

  // Check if initialized
  if (!projectConfig) {
    console.log(chalk.blue('\nAvailable Presets:\n'));
    PRESETS.filter((p) => p.id !== 'custom' && p.id !== 'exit').forEach((preset) => {
      console.log(`  ${preset.emoji} ${chalk.green(preset.name)}`);
      console.log(`    ${chalk.gray(preset.description)}`);
      if (preset.stacks.length > 0) {
        console.log(`    ${chalk.gray(`Includes: ${preset.stacks.join(', ')}`)}`);
      } else {
        console.log(`    ${chalk.gray('Includes: core rules only')}`);
      }
      console.log();
    });

    console.log(chalk.blue('Available Stacks:\n'));
    availableStacks.forEach((stack) => {
      console.log(`  ${chalk.green('-')} ${stack.name} - ${chalk.gray(stack.description)}`);
    });
    console.log(chalk.gray('\nRun `agent-runway init` to get started.\n'));
    return;
  }

  const { config } = projectConfig;

  console.log(chalk.blue('\nInstalled Targets:\n'));
  console.log(chalk.gray(`  ${config.targets.join(', ')}`));

  console.log(chalk.blue('Installed Stacks:\n'));
  if (config.stacks.length === 0) {
    console.log(chalk.gray('  No stacks installed yet.\n'));
  } else {
    config.stacks.forEach((stackId) => {
      const stack = availableStacks.find((s) => s.id === stackId);
      console.log(`  ${chalk.green('-')} ${stack?.name || stackId} (${stackId})`);
    });
  }

  console.log(chalk.blue('Available Stacks:\n'));
  availableStacks
    .filter((stack) => !config.stacks.includes(stack.id))
    .forEach((stack) => {
      console.log(`  ${chalk.gray('-')} ${stack.name} (${stack.id})`);
    });

  console.log(chalk.gray('\nUse `agent-runway add <stack>` to install a stack.\n'));
}
