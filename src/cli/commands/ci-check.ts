import chalk from 'chalk';
import path from 'path';
import fs from 'fs-extra';
import { getAgentRunwayDir } from '../utils';
import { collectMetrics, parseBlocks } from './metrics';

export type CiProfile = 'light' | 'strict';

export interface CiFinding {
  severity: 'error' | 'warning';
  code: string;
  message: string;
  file?: string;
}

export interface CiCheckResult {
  profile: CiProfile;
  findings: CiFinding[];
  passed: boolean;
}

async function listMdFiles(dir: string): Promise<string[]> {
  if (!(await fs.pathExists(dir))) return [];
  const out: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await listMdFiles(full)));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      out.push(full);
    }
  }
  return out;
}

async function specSlugs(specsDir: string): Promise<string[]> {
  if (!(await fs.pathExists(specsDir))) return [];
  const entries = await fs.readdir(specsDir, { withFileTypes: true });
  const slugs: string[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const specFile = path.join(specsDir, entry.name, 'spec.md');
    if (await fs.pathExists(specFile)) slugs.push(entry.name);
  }
  return slugs.sort();
}

async function slugHasVerdict(specsDir: string, slug: string): Promise<boolean> {
  const slugDir = path.join(specsDir, slug);
  const files = await listMdFiles(slugDir);
  for (const file of files) {
    const content = await fs.readFile(file, 'utf-8');
    if (parseBlocks(content, '# agent-runway:verdict').length > 0) return true;
  }
  return false;
}

async function autonomousRunLogs(agentRunwayDir: string): Promise<string[]> {
  const runsDir = path.join(agentRunwayDir, 'logs', 'autonomous-runs');
  return listMdFiles(runsDir);
}

export async function runCiCheck(
  projectRoot: string,
  profile: CiProfile = 'light'
): Promise<CiCheckResult> {
  const findings: CiFinding[] = [];
  const agentRunwayDir = getAgentRunwayDir(projectRoot);

  const push = (severity: CiFinding['severity'], code: string, message: string, file?: string) => {
    findings.push({ severity, code, message, file });
  };

  if (!(await fs.pathExists(agentRunwayDir))) {
    push('error', 'NO_SCAFFOLD', 'No .agent-runway/ folder found. Run `agent-runway init` first.');
    return { profile, findings, passed: profile === 'light' };
  }

  const specsDir = path.join(agentRunwayDir, 'specs');
  const metrics = await collectMetrics(agentRunwayDir);
  const slugs = await specSlugs(specsDir);

  if (slugs.length > 0 && metrics.gates.length === 0) {
    push(
      profile === 'strict' ? 'error' : 'warning',
      'GOVERNANCE_GAP',
      'Specs exist but no # agent-runway:verdict blocks were found — cannot distinguish clean delivery from skipped gates.'
    );
  }

  for (const slug of slugs) {
    const specFile = path.join(specsDir, slug, 'spec.md');
    if (!(await slugHasVerdict(specsDir, slug))) {
      push(
        profile === 'strict' ? 'error' : 'warning',
        'SPEC_WITHOUT_VERDICT',
        `Spec "${slug}" has no gate verdict blocks under .agent-runway/specs/${slug}/`,
        specFile
      );
    }
  }

  if (metrics.acPending > 0) {
    push(
      profile === 'strict' ? 'error' : 'warning',
      'AC_PENDING',
      `${metrics.acPending} acceptance criteria still have Verified by: pending`
    );
  }

  const runLogs = await autonomousRunLogs(agentRunwayDir);
  for (const file of runLogs) {
    const content = await fs.readFile(file, 'utf-8');
    if (parseBlocks(content, '# agent-runway:run').length === 0) {
      push(
        profile === 'strict' ? 'error' : 'warning',
        'RUN_LOG_WITHOUT_HEADER',
        'Autonomous run log is missing a # agent-runway:run header block',
        file
      );
    }
  }

  const hasErrors = findings.some((f) => f.severity === 'error');
  const passed = profile === 'light' ? true : !hasErrors;

  return { profile, findings, passed };
}

export async function ciCheckCommand(options: { profile?: string; json?: boolean }): Promise<void> {
  const profile: CiProfile = options.profile === 'strict' ? 'strict' : 'light';
  const result = await runCiCheck(process.cwd(), profile);

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    if (!result.passed) process.exit(1);
    return;
  }

  console.log(chalk.blue.bold('\n🔍 Agent Runway CI Check\n'));
  console.log(chalk.gray(`  Profile: ${profile}${profile === 'light' ? ' (warnings only, exit 0)' : ' (fail on violations)'}\n`));

  if (result.findings.length === 0) {
    console.log(chalk.green('  All checks passed.\n'));
    return;
  }

  for (const f of result.findings) {
    const icon = f.severity === 'error' ? chalk.red('x') : chalk.yellow('!');
    const label = f.severity === 'error' ? chalk.red(f.code) : chalk.yellow(f.code);
    const where = f.file ? chalk.gray(` (${path.relative(process.cwd(), f.file)})`) : '';
    console.log(`  ${icon} ${label}: ${f.message}${where}`);
  }

  console.log();
  if (!result.passed) {
    console.log(chalk.red('CI check failed. Fix the errors above or use --profile light for advisory mode.\n'));
    process.exit(1);
  }

  console.log(chalk.yellow('Advisory mode - warnings shown but exit code is 0. Use --profile strict in CI to enforce.\n'));
}
