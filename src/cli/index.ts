#!/usr/bin/env node

import { Command } from 'commander';
import fs from 'fs-extra';
import path from 'path';
import updateNotifier from 'update-notifier';
import { initCommand } from './commands/init';
import { addCommand } from './commands/add';
import { removeCommand } from './commands/remove';
import { updateCommand } from './commands/update';
import { listCommand } from './commands/list';
import { statusCommand } from './commands/status';
import { metricsCommand } from './commands/metrics';
import { ciCheckCommand } from './commands/ci-check';
import { upgradeCommand } from './commands/upgrade';
import { getPackageVersion } from './utils';

// Notify (once per day, never in CI) when a newer version is published to npm.
try {
  const pkg = fs.readJsonSync(path.join(__dirname, '..', 'package.json'));
  updateNotifier({ pkg }).notify();
} catch {
  // Update check is best-effort; never block the CLI on it.
}

const program = new Command();

program
  .name('agent-runway')
  .description('AI-assisted development framework for coding agents')
  .version(getPackageVersion());

program
  .command('init')
  .description('Initialize Agent Runway in your project')
  .option('-s, --stacks <stacks>', 'Comma-separated list of stacks (node,typescript,react,dotnet,rust,electron)')
  .option('-p, --preset <preset>', 'Use a preset configuration (vibe-lite,node-typescript,web-fullstack-ts,dotnet-backend,electron-desktop,etc)')
  .option('-t, --target <target>', 'Agent environment: cursor, claude, vscode, both, all, or comma-separated targets')
  .option('--scope <scope>', 'Installation scope: project or global')
  .option('-g, --global', 'Install globally in ~/.cursor/ (same as --scope global)')
  .option('-y, --yes', 'Skip prompts and use recommended preset with project cursor target')
  .action(initCommand);

program
  .command('add <stack>')
  .description('Add a stack to your installation')
  .option('-g, --global', 'Add to global installation')
  .action(addCommand);

program
  .command('remove <stack>')
  .description('Remove a stack from your installation')
  .option('-g, --global', 'Remove from global installation')
  .action(removeCommand);

program
  .command('update')
  .description('Update Agent Runway while preserving your configuration')
  .option('-g, --global', 'Update global installation')
  .action(updateCommand);

program
  .command('upgrade')
  .description('Upgrade a Lite installation to Structured mode')
  .option('--to <mode>', 'Target mode (structured)', 'structured')
  .action(upgradeCommand);

program
  .command('list')
  .description('List installed stacks and available stacks')
  .action(listCommand);

program
  .command('status')
  .description('Show global and project installation status')
  .action(statusCommand);

program
  .command('metrics')
  .description('Aggregate gate verdicts and run logs into a delivery scorecard')
  .action(metricsCommand);

program
  .command('ci-check')
  .description('Validate governance artefacts under .agent-runway/ (optional CI enforcement)')
  .option('--profile <profile>', 'light (advisory, default) or strict (fail on violations)', 'light')
  .option('--json', 'Emit machine-readable JSON result')
  .action(ciCheckCommand);

program.parse(process.argv);
