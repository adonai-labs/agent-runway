#!/usr/bin/env node
// Installs every target x mode x stack combination into temp projects and checks the
// installed output, not the sources: every relative markdown link and every referenced
// framework path must resolve, and no {{placeholder}} may survive. This is what a
// user's agent actually reads, so broken references here are broken workflows.
import os from 'os';
import path from 'path';
import fs from 'fs-extra';
import { type InstallTarget, type WorkflowMode, installFromConfig, newConfig, getAvailableStacks } from './utils';

interface Combo {
  target: InstallTarget;
  mode: WorkflowMode;
  stacks: string[];
  isGlobal?: boolean;
}

// Paths in backticks are checked when they start with one of these prefixes.
const CHECKED_PREFIXES = [
  '.cursor/',
  '~/.cursor/',
  '.claude/',
  '.github/skills',
  '.github/prompts',
  '.github/agents',
  '.github/instructions',
  '.agent-runway/skills',
  '.agent-runway/rules',
  '.agent-runway/config',
  '.agent-runway/memory/',
  '../',
  './',
];

const SCANNED_ROOTS: Record<InstallTarget, string[]> = {
  cursor: ['.cursor/commands', '.cursor/agents', '.cursor/skills', '.cursor/rules'],
  claude: ['.claude/commands', '.claude/agents', '.claude/skills', '.agent-runway/rules', 'CLAUDE.md'],
  vscode: ['.github/prompts', '.github/agents', '.github/skills', '.github/instructions', '.github/copilot-instructions.md'],
};

async function listFiles(target: string): Promise<string[]> {
  if (!(await fs.pathExists(target))) return [];
  const stat = await fs.stat(target);
  if (stat.isFile()) return target.endsWith('.md') || target.endsWith('.mdc') ? [target] : [];
  const out: string[] = [];
  for (const entry of await fs.readdir(target)) out.push(...(await listFiles(path.join(target, entry))));
  return out;
}

// Removes fenced code blocks: examples inside them are illustrative, not references.
function stripCodeFences(content: string): string {
  return content.replace(/```[\s\S]*?```/g, '').replace(/~~~[\s\S]*?~~~/g, '');
}

function isPlaceholderPath(ref: string): boolean {
  return /[<>*{}[\]$|]/.test(ref) || /\s/.test(ref);
}

function resolveRef(ref: string, file: string, projectRoot: string, homeDir: string): string {
  if (ref.startsWith('~/')) return path.join(homeDir, ref.slice(2));
  if (ref.startsWith('../') || ref.startsWith('./')) return path.resolve(path.dirname(file), ref);
  if (ref.startsWith('.') && !ref.startsWith('..')) return path.join(projectRoot, ref);
  return path.resolve(path.dirname(file), ref);
}

async function checkFile(file: string, projectRoot: string, homeDir: string): Promise<string[]> {
  const problems: string[] = [];
  const raw = await fs.readFile(file, 'utf-8');
  const rel = path.relative(file.startsWith(homeDir) && !file.startsWith(projectRoot) ? homeDir : projectRoot, file);

  const placeholder = raw.match(/\{\{(skills|rules|config)\}\}/);
  if (placeholder) problems.push(`${rel}: unresolved ${placeholder[0]}`);

  const content = stripCodeFences(raw);

  for (const match of content.matchAll(/\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
    const target = match[1].split('#')[0];
    if (!target || /^[a-z]+:/i.test(target) || isPlaceholderPath(target)) continue;
    if (!(await fs.pathExists(resolveRef(target, file, projectRoot, homeDir)))) {
      problems.push(`${rel}: broken link (${match[1]})`);
    }
  }

  for (const match of content.matchAll(/`([^`\n]+)`/g)) {
    const ref = match[1].trim().replace(/[.,:;)]+$/, '');
    if (isPlaceholderPath(ref) || !CHECKED_PREFIXES.some((p) => ref.startsWith(p))) continue;
    // Bare relative names like `./foo` in prose are only checked when they look like files.
    if ((ref.startsWith('./') || ref.startsWith('../')) && !/\.(md|mdc)$/.test(ref)) continue;
    if (!(await fs.pathExists(resolveRef(ref, file, projectRoot, homeDir)))) {
      problems.push(`${rel}: missing path \`${ref}\``);
    }
  }

  return problems;
}

// Assigning undefined to process.env.X stores the string "undefined", so delete instead.
function restoreEnv(name: string, value: string | undefined): void {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

async function checkCombo(combo: Combo): Promise<string[]> {
  const originalCwd = process.cwd();
  // os.homedir() reads HOME on macOS/Linux and USERPROFILE on Windows. Override both so the
  // global-install case can never write to the real home directory of whoever runs the test.
  const originalHome = process.env.HOME;
  const originalUserProfile = process.env.USERPROFILE;
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'agent-runway-links-'));
  const projectRoot = path.join(tempRoot, 'project');
  const homeDir = path.join(tempRoot, 'home');
  await fs.ensureDir(projectRoot);
  await fs.ensureDir(homeDir);

  try {
    process.env.HOME = homeDir;
    process.env.USERPROFILE = homeDir;
    process.chdir(projectRoot);
    await installFromConfig(projectRoot, newConfig(combo.stacks, [combo.target], combo.mode, combo.isGlobal), combo.isGlobal);

    const base = combo.isGlobal ? homeDir : projectRoot;
    const roots = SCANNED_ROOTS[combo.target].map((r) => path.join(base, r));
    roots.push(path.join(projectRoot, 'AGENTS.md'), path.join(projectRoot, '.agent-runway', 'config'));

    const problems: string[] = [];
    for (const root of roots) {
      for (const file of await listFiles(root)) problems.push(...(await checkFile(file, projectRoot, homeDir)));
    }
    return problems;
  } finally {
    process.chdir(originalCwd);
    restoreEnv('HOME', originalHome);
    restoreEnv('USERPROFILE', originalUserProfile);
    await fs.remove(tempRoot);
  }
}

async function main(): Promise<void> {
  const allStacks = getAvailableStacks().map((s) => s.id);
  const stackSets = [[], ...allStacks.map((s) => [s]), allStacks];
  const combos: Combo[] = [];
  for (const target of ['cursor', 'claude', 'vscode'] as InstallTarget[]) {
    for (const mode of ['lite', 'structured'] as WorkflowMode[]) {
      for (const stacks of stackSets) combos.push({ target, mode, stacks });
    }
  }
  combos.push({ target: 'cursor', mode: 'structured', stacks: allStacks, isGlobal: true });

  const failures = new Map<string, string[]>();
  for (const combo of combos) {
    const label = `${combo.isGlobal ? 'global-' : ''}${combo.target}/${combo.mode}/${combo.stacks.join('+') || 'core'}`;
    const problems = await checkCombo(combo);
    for (const problem of problems) failures.set(problem, [...(failures.get(problem) ?? []), label]);
  }

  if (failures.size > 0) {
    console.error(`\nx Installed output has ${failures.size} broken reference(s):\n`);
    for (const [problem, labels] of [...failures.entries()].sort()) {
      const where = labels.length > 3 ? `${labels.slice(0, 3).join(', ')} +${labels.length - 3} more` : labels.join(', ');
      console.error(`  ${problem}\n      in ${where}`);
    }
    process.exit(1);
  }

  console.log(`ok installed links: ${combos.length} target/mode/stack combinations clean`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
