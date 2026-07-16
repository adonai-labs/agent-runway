import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import {
  type InstallTarget,
  getAvailableStacks,
  normalizeTargets,
  copyCore,
  cleanupLegacyCursorMemory,
  copyStacks,
  copyNeutralSkills,
  copyClaude,
  copyVscode,
  copyStackSpecTemplates,
  ensureProjectScaffold,
  createConfig,
  getCursorDir,
  getGlobalCursorDir,
  hasGlobalInstallation,
  resolveConfigPath,
  normalizeWorkflowMode,
  type WorkflowMode,
} from '../utils';
import { PRESETS, getPreset } from '../presets';

interface InitOptions {
  stacks?: string;
  preset?: string;
  yes?: boolean;
  global?: boolean;
  target?: string;
  scope?: string;
}

async function ensureProjectStructure(projectRoot: string): Promise<void> {
  await ensureProjectScaffold(projectRoot);
}

export async function initCommand(options: InitOptions) {
  console.log(chalk.blue.bold('\n🚀 Agent Runway Initialization\n'));

  const projectRoot = process.cwd();
  const hasExplicitInstallOptions = Boolean(options.stacks || options.preset || options.target);
  const isGlobal = await resolveInstallScope(options, hasExplicitInstallOptions);
  const cursorDir = getCursorDir(projectRoot, isGlobal);

  // Global installs are always Cursor-only
  if (isGlobal) {
    console.log(chalk.cyan(`📍 Installing globally in: ${getGlobalCursorDir()}`));
    console.log(chalk.yellow('⚠️  This will affect ALL Cursor projects on this machine\n'));

    const { confirm } = await inquirer.prompt([
      { type: 'confirm', name: 'confirm', message: 'Continue with global installation?', default: false },
    ]);
    if (!confirm) {
      console.log(chalk.yellow('Installation cancelled.'));
      return;
    }
  } else {
    console.log(chalk.cyan(`📁 Installing in project: ${projectRoot}\n`));
    if (await hasGlobalInstallation()) {
      console.log(chalk.gray('ℹ️  Global installation detected - project rules will take priority\n'));
    }
  }

  // Check if already initialized
  const configPath = await resolveConfigPath(cursorDir);
  const agentRunwayConfig = path.join(projectRoot, '.agent-runway', 'agent-runway.json');
  const alreadyInitialized =
    (await fs.pathExists(configPath)) || (!isGlobal && (await fs.pathExists(agentRunwayConfig)));

  if (alreadyInitialized) {
    const location = isGlobal ? 'globally' : 'in this project';
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `Agent Runway is already initialized ${location}. Reinitialize?`,
        default: false,
      },
    ]);
    if (!confirm) {
      console.log(chalk.yellow('Initialization cancelled.'));
      return;
    }
  }

  // ── Target selection (project installs only) ──────────────────────────────
  let targets: InstallTarget[];

  if (isGlobal) {
    targets = normalizeTargets(options.target ?? 'cursor');
    const unsupportedGlobalTargets = targets.filter((target) => target !== 'cursor');
    if (unsupportedGlobalTargets.length > 0) {
      console.log(chalk.red('Global installs currently support Cursor only.'));
      console.log(chalk.gray('Use `--scope project` for Claude Code or VS Code support.'));
      process.exit(1);
    }
  } else if (options.target) {
    targets = normalizeTargets(options.target);
  } else if (options.yes) {
    targets = ['cursor'];
  } else {
    targets = await promptTargetSelection();
  }

  // ── Stack selection ───────────────────────────────────────────────────────
  let selectedStacks: string[];
  let selectedMode: WorkflowMode = 'structured';

  if (options.stacks) {
    selectedStacks = options.stacks.split(',').map((s) => s.trim());
    selectedMode = 'structured';
  } else if (options.preset) {
    const preset = getPreset(options.preset);
    if (!preset) {
      console.log(chalk.red(`Preset "${options.preset}" not found.`));
      console.log(chalk.gray(`Available presets: ${PRESETS.map((p) => p.id).join(', ')}`));
      process.exit(1);
    }
    if (preset.id === 'exit') {
      console.log(chalk.yellow('Initialization cancelled.'));
      return;
    }
    selectedStacks = preset.stacks;
    selectedMode = normalizeWorkflowMode(preset.mode);
    console.log(chalk.blue(`Using preset: ${preset.emoji} ${preset.name}`));
  } else if (options.yes) {
    const recommended = PRESETS.find((p) => p.recommended);
    selectedStacks = recommended?.stacks || [];
    selectedMode = normalizeWorkflowMode(recommended?.mode);
    if (recommended) {
      console.log(chalk.blue(`Using recommended preset: ${recommended.emoji} ${recommended.name}`));
    }
  } else {
    const selected = await promptPresetSelection();
    selectedStacks = selected.stacks;
    selectedMode = selected.mode;
  }

  // ── Installation ─────────────────────────────────────────────────────────
  const spinner = ora('Installing Agent Runway...').start();
  const installsCursor = targets.includes('cursor');
  const installsClaude = targets.includes('claude');
  const installsVscode = targets.includes('vscode');

  try {
    if (installsCursor) {
      await fs.ensureDir(cursorDir);
      spinner.text = 'Copying core framework files...';
      await copyCore(cursorDir, selectedMode);
      await cleanupLegacyCursorMemory(cursorDir);

      if (selectedStacks.length > 0) {
        spinner.text = `Installing stacks: ${selectedStacks.join(', ')}...`;
        await copyStacks(cursorDir, selectedStacks);
      }
    }

    if (installsClaude) {
      spinner.text = 'Installing Claude Code support...';
      await copyNeutralSkills(projectRoot, selectedStacks, selectedMode);
      await copyClaude(projectRoot, selectedStacks, selectedMode);
    }

    if (installsVscode) {
      spinner.text = 'Installing VS Code support...';
      await copyVscode(projectRoot, selectedStacks, selectedMode);
    }

    // Config lives in .cursor/ for cursor installs, .agent-runway/ for claude-only
    const configDir = installsCursor ? cursorDir : path.join(projectRoot, '.agent-runway');
    spinner.text = 'Creating configuration...';
    await createConfig(configDir, selectedStacks, isGlobal, targets, selectedMode);

    spinner.text = 'Creating project structure...';
    await ensureProjectStructure(projectRoot);
    spinner.text = 'Copying stack spec templates...';
    await copyStackSpecTemplates(projectRoot, selectedStacks);

    spinner.succeed(chalk.green('Agent Runway installed successfully!'));

    if (isGlobal) {
      console.log(chalk.blue('\n✅ Global installation complete!\n'));
      console.log(chalk.gray(`Location: ${cursorDir}`));
      console.log(chalk.gray(`Project scaffold: ${path.join(projectRoot, '.agent-runway')}`));
      console.log(chalk.gray('These rules will apply to ALL Cursor projects\n'));
    } else {
      const targetLabel = targets.join(' + ');
      console.log(chalk.blue(`\n📋 Installed for: ${chalk.bold(targetLabel)}\n`));

      if (installsCursor) {
        console.log(chalk.gray('Cursor: open the project and run Developer: Reload Window'));
        console.log(chalk.gray(selectedMode === 'lite' ? 'Then invoke @start or @express from the installed skills' : 'Then run /start and describe what you want to do'));
      }
      if (installsClaude) {
        console.log(chalk.gray(selectedMode === 'lite' ? 'Claude Code: reference .agent-runway/skills/<skill>/SKILL.md directly' : 'Claude Code: run /start or any /command in your project'));
      }
      if (installsVscode) {
        console.log(chalk.gray(selectedMode === 'lite' ? 'VS Code: reload the window, then reference .github/skills/<skill>/SKILL.md' : 'VS Code: reload the window, then use Agent Runway prompt files such as /start'));
      }
      console.log();
    }

    console.log(chalk.gray(`Mode: ${selectedMode}`));
    if (selectedStacks.length > 0) {
      console.log(chalk.gray(`Installed stacks: ${selectedStacks.join(', ')}`));
    }
  } catch (error) {
    spinner.fail(chalk.red('Installation failed'));
    console.error(error);
    process.exit(1);
  }
}

async function resolveInstallScope(options: InitOptions, hasExplicitInstallOptions: boolean): Promise<boolean> {
  if (options.global) return true;

  if (options.scope) {
    const scope = options.scope.trim().toLowerCase();
    if (scope === 'global') return true;
    if (scope === 'project') return false;

    console.log(chalk.red(`Invalid scope "${options.scope}".`));
    console.log(chalk.gray('Use `project` or `global`.'));
    process.exit(1);
  }

  if (options.yes || hasExplicitInstallOptions) {
    return false;
  }

  const { scope } = await inquirer.prompt([
    {
      type: 'list',
      name: 'scope',
      message: 'Where should Agent Runway be installed?',
      choices: [
        {
          name: `${chalk.bold('Project')} ${chalk.gray('- install in this repository (recommended for teams)')}`,
          value: 'project',
          short: 'Project',
        },
        {
          name: `${chalk.bold('Global')}  ${chalk.gray('- install in ~/.cursor for all Cursor projects')}`,
          value: 'global',
          short: 'Global',
        },
      ],
    },
  ]);

  return scope === 'global';
}

async function promptTargetSelection(): Promise<InstallTarget[]> {
  const { targets } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'targets',
      message: 'Which AI agent environment are you installing for?',
      choices: [
        {
          name: `${chalk.bold('Cursor')}      ${chalk.gray('- .cursor/ commands, rules, and skills')}`,
          value: 'cursor',
          checked: true,
        },
        {
          name: `${chalk.bold('Claude Code')} ${chalk.gray('- .claude/ commands, agents, and CLAUDE.md')}`,
          value: 'claude',
        },
        {
          name: `${chalk.bold('VS Code')}     ${chalk.gray('- .github/ Copilot instructions, prompts, agents, and skills')}`,
          value: 'vscode',
        },
      ],
    },
  ]);
  return normalizeTargets(targets);
}

async function promptPresetSelection(): Promise<{ stacks: string[]; mode: WorkflowMode }> {
  const { preset } = await inquirer.prompt([
    {
      type: 'list',
      name: 'preset',
      message: 'What type of project is this?',
      choices: PRESETS.map((p) => ({
        name: `${p.emoji} ${chalk.bold(p.name)} ${chalk.gray('- ' + p.description)}`,
        value: p.id,
        short: p.name,
      })),
      pageSize: 15,
    },
  ]);

  if (preset === 'exit') {
    console.log(chalk.yellow('Initialization cancelled.'));
    process.exit(0);
  }

  if (preset === 'custom') {
    const { stacks } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'stacks',
        message: 'Select your stack(s):',
        choices: getAvailableStacks().map((s) => ({
          name: `${s.name} ${chalk.gray('- ' + s.description)}`,
          value: s.id,
          checked: s.recommended,
        })),
      },
    ]);
    return { stacks, mode: 'structured' };
  }

  const selectedPreset = PRESETS.find((p) => p.id === preset);
  return { stacks: selectedPreset?.stacks || [], mode: normalizeWorkflowMode(selectedPreset?.mode) };
}
