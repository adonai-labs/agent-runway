import chalk from 'chalk';
import path from 'path';
import {
  findProjectConfig,
  loadConfig,
  getGlobalCursorDir,
  getPackageVersion,
  compareVersions,
  hasGlobalInstallation,
  hasProjectInstallation,
} from '../utils';

// Warns when installed framework files are older than the running CLI.
function warnIfBehind(label: string, installedVersion: string | undefined, cliVersion: string): void {
  if (!installedVersion) return;
  if (compareVersions(installedVersion, cliVersion) < 0) {
    console.log(
      chalk.yellow(
        `   ${label} is on v${installedVersion}, CLI is v${cliVersion} - run \`agent-runway update\``
      )
    );
  }
}

export async function statusCommand() {
  const projectRoot = process.cwd();
  const globalDir = getGlobalCursorDir();
  const cliVersion = getPackageVersion();

  const hasGlobal = await hasGlobalInstallation();
  const hasProject = await hasProjectInstallation(projectRoot);

  console.log(chalk.blue.bold('\nAgent Runway Status\n'));

  if (hasGlobal) {
    const globalConfig = await loadConfig(globalDir);
    console.log(chalk.green('OK Global Installation'));
    console.log(chalk.gray(`   Location: ${globalDir}`));
    console.log(chalk.gray(`   Installed: ${new Date(globalConfig.installedAt).toLocaleDateString()}`));
    if (globalConfig.updatedAt) {
      console.log(chalk.gray(`   Updated: ${new Date(globalConfig.updatedAt).toLocaleDateString()}`));
    }
    console.log(chalk.gray(`   Stacks: ${globalConfig.stacks.length > 0 ? globalConfig.stacks.join(', ') : 'core only'}`));
    warnIfBehind('Global install', globalConfig.version, cliVersion);
    console.log(chalk.yellow('   Applies to ALL Cursor projects\n'));
  } else {
    console.log(chalk.gray('- No global installation\n'));
  }

  if (hasProject) {
    const result = await findProjectConfig(projectRoot);
    if (result) {
      const { config } = result;
      const targets = config.targets ?? ['cursor'];
      const targetLabel = targets.join(', ');

      console.log(chalk.green('OK Project Installation'));
      console.log(chalk.gray(`   Location: ${result.configDir}`));
      console.log(chalk.gray(`   Targets: ${targetLabel}`));
      console.log(chalk.gray(`   Installed: ${new Date(config.installedAt).toLocaleDateString()}`));
      if (config.updatedAt) {
        console.log(chalk.gray(`   Updated: ${new Date(config.updatedAt).toLocaleDateString()}`));
      }
      console.log(chalk.gray(`   Stacks: ${config.stacks.length > 0 ? config.stacks.join(', ') : 'core only'}`));
      warnIfBehind('Project install', config.version, cliVersion);

      if (hasGlobal) {
        console.log(chalk.cyan('   Project rules override global rules\n'));
      } else {
        console.log();
      }
    }
  } else {
    console.log(chalk.gray('- No project installation\n'));
  }

  if (!hasGlobal && !hasProject) {
    console.log(chalk.yellow('No installations found. Run one of:'));
    console.log(chalk.gray('  agent-runway init              (project installation)'));
    console.log(chalk.gray('  agent-runway init --global     (global installation)\n'));
  } else if (hasGlobal && hasProject) {
    const globalConfig = await loadConfig(globalDir);
    const projectResult = await findProjectConfig(projectRoot);
    if (projectResult) {
      const globalStacks = new Set(globalConfig.stacks);
      const projectStacks = new Set(projectResult.config.stacks);
      const overlap = [...globalStacks].filter((s) => projectStacks.has(s));
      if (overlap.length > 0) {
        console.log(chalk.yellow('Stack Overlap:'));
        console.log(chalk.gray(`   ${overlap.join(', ')} exist in both global and project`));
        console.log(chalk.gray('   Project versions take priority\n'));
      }
    }
  }
}
