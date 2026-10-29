import chalk from 'chalk';
import path from 'path';
import fs from 'fs-extra';
import { getAgentRunwayDir } from '../utils';
import { type Metrics, collectMetrics, listMdFiles, parseBlocks } from './metrics';

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
  metrics?: Metrics;
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

  return { profile, findings, passed, metrics };
}

// Markdown report for pull request summaries (GitHub step summary or a PR comment).
export function formatCiMarkdown(result: CiCheckResult, projectRoot: string): string {
  const status = result.passed ? (result.findings.length === 0 ? 'Passed' : 'Passed with warnings') : 'Failed';
  const lines = [`## Agent Runway governance: ${status}`, '', `Profile: \`${result.profile}\``, ''];

  if (result.findings.length === 0) {
    lines.push('No governance findings.');
  } else {
    lines.push('| Severity | Code | Finding | File |', '| --- | --- | --- | --- |');
    for (const f of result.findings) {
      const file = f.file ? `\`${path.relative(projectRoot, f.file)}\`` : '';
      lines.push(`| ${f.severity} | \`${f.code}\` | ${f.message.replace(/\|/g, '\\|')} | ${file} |`);
    }
  }

  const gates = result.metrics?.gates ?? [];
  if (gates.length > 0) {
    lines.push('', '### Gate outcomes', '', '| Gate | Passed | Total | Blocking |', '| --- | --- | --- | --- |');
    for (const g of gates) lines.push(`| ${g.gate} | ${g.pass} | ${g.total} | ${g.blocking} |`);
  }

  return `${lines.join('\n')}\n`;
}

export async function ciCheckCommand(options: { profile?: string; json?: boolean; format?: string }): Promise<void> {
  const profile: CiProfile = options.profile === 'strict' ? 'strict' : 'light';
  const projectRoot = process.cwd();
  const result = await runCiCheck(projectRoot, profile);

  // In GitHub Actions, publish the report on the run summary page as well.
  if (process.env.GITHUB_STEP_SUMMARY) {
    await fs.appendFile(process.env.GITHUB_STEP_SUMMARY, formatCiMarkdown(result, projectRoot));
  }

  if (options.format === 'markdown') {
    process.stdout.write(formatCiMarkdown(result, projectRoot));
    if (!result.passed) process.exit(1);
    return;
  }

  if (options.json || options.format === 'json') {
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
