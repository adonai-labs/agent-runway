import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { getAvailableStacks as getStacksFromPresets } from '../presets';

export type InstallTarget = 'cursor' | 'claude' | 'vscode';
export type InstallTargetInput = InstallTarget | 'both' | 'all';

export interface Stack {
  id: string;
  name: string;
  description: string;
  recommended?: boolean;
}

export interface Config {
  version: string;
  stacks: string[];
  targets: InstallTarget[];
  installedAt: string;
  updatedAt?: string;
  isGlobal?: boolean;
}

const NEW_CONFIG_FILENAME = 'agent-runway.json';
const LEGACY_CONFIG_FILENAME = 'cursor-runway.json';

export function getGlobalCursorDir(): string {
  return path.join(os.homedir(), '.cursor');
}

export function getCursorDir(projectRoot: string, isGlobal: boolean): string {
  return isGlobal ? getGlobalCursorDir() : path.join(projectRoot, '.cursor');
}

export function getClaudeDir(projectRoot: string): string {
  return path.join(projectRoot, '.claude');
}

export function getVscodeDir(projectRoot: string): string {
  return path.join(projectRoot, '.github');
}

export function getAgentRunwayDir(projectRoot: string): string {
  return path.join(projectRoot, '.agent-runway');
}

function appendTarget(targets: InstallTarget[], target: InstallTarget): void {
  if (!targets.includes(target)) {
    targets.push(target);
  }
}

export function normalizeTargets(
  value: unknown,
  fallback: InstallTarget[] = ['cursor']
): InstallTarget[] {
  const rawTargets = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',')
      : fallback;

  const targets: InstallTarget[] = [];

  for (const rawTarget of rawTargets) {
    const target = String(rawTarget).trim().toLowerCase();
    if (!target) continue;

    if (target === 'both') {
      appendTarget(targets, 'cursor');
      appendTarget(targets, 'claude');
      continue;
    }

    if (target === 'all') {
      appendTarget(targets, 'cursor');
      appendTarget(targets, 'claude');
      appendTarget(targets, 'vscode');
      continue;
    }

    if (target === 'cursor' || target === 'claude' || target === 'vscode') {
      appendTarget(targets, target);
    }
  }

  return targets.length > 0 ? targets : [...fallback];
}

export async function hasGlobalInstallation(): Promise<boolean> {
  const globalDir = getGlobalCursorDir();
  const newConfigPath = path.join(globalDir, NEW_CONFIG_FILENAME);
  const legacyConfigPath = path.join(globalDir, LEGACY_CONFIG_FILENAME);
  return (await fs.pathExists(newConfigPath)) || (await fs.pathExists(legacyConfigPath));
}

export async function hasProjectInstallation(projectRoot: string): Promise<boolean> {
  // Check cursor-based install
  const cursorConfig = path.join(projectRoot, '.cursor', NEW_CONFIG_FILENAME);
  const cursorLegacy = path.join(projectRoot, '.cursor', LEGACY_CONFIG_FILENAME);
  if ((await fs.pathExists(cursorConfig)) || (await fs.pathExists(cursorLegacy))) return true;

  // Check claude-only install (config lives in .agent-runway/)
  const agentConfig = path.join(projectRoot, '.agent-runway', NEW_CONFIG_FILENAME);
  return fs.pathExists(agentConfig);
}

export async function resolveConfigPath(cursorDir: string): Promise<string> {
  const newConfigPath = path.join(cursorDir, NEW_CONFIG_FILENAME);
  if (await fs.pathExists(newConfigPath)) return newConfigPath;

  const legacyConfigPath = path.join(cursorDir, LEGACY_CONFIG_FILENAME);
  if (await fs.pathExists(legacyConfigPath)) return legacyConfigPath;

  return newConfigPath;
}

// Finds the project config regardless of whether it was installed for cursor or claude-only.
// Returns the config dir and loaded config, or null if no installation found.
export async function findProjectConfig(
  projectRoot: string
): Promise<{ configDir: string; config: Config } | null> {
  // Cursor-based install
  const cursorDir = path.join(projectRoot, '.cursor');
  const cursorConfigPath = await resolveConfigPath(cursorDir);
  if (await fs.pathExists(cursorConfigPath)) {
    const raw = await fs.readJson(cursorConfigPath);
    const config: Config = { ...raw, targets: normalizeTargets(raw.targets, ['cursor']) };
    return { configDir: cursorDir, config };
  }

  // Claude-only install
  const agentRunwayDir = path.join(projectRoot, '.agent-runway');
  const agentConfigPath = path.join(agentRunwayDir, NEW_CONFIG_FILENAME);
  if (await fs.pathExists(agentConfigPath)) {
    const raw = await fs.readJson(agentConfigPath);
    const config: Config = { ...raw, targets: normalizeTargets(raw.targets, ['claude']) };
    return { configDir: agentRunwayDir, config };
  }

  return null;
}

export function getAvailableStacks(): Stack[] {
  return getStacksFromPresets();
}

// ─── Cursor install ───────────────────────────────────────────────────────────

export async function copyCore(cursorDir: string): Promise<void> {
  const packageRoot = path.join(__dirname, '../..');
  const coreSource = path.join(packageRoot, 'src/core');

  await fs.copy(path.join(coreSource, 'commands'), path.join(cursorDir, 'commands'), { overwrite: true });
  await fs.copy(path.join(coreSource, 'skills'), path.join(cursorDir, 'skills'), { overwrite: true });
  await fs.copy(path.join(coreSource, 'rules'), path.join(cursorDir, 'rules'), { overwrite: true });
  await fs.copy(path.join(coreSource, 'agents'), path.join(cursorDir, 'agents'), { overwrite: true });
  await fs.copy(path.join(coreSource, 'config'), path.join(cursorDir, 'config'), { overwrite: true });
}

// Memory is now neutral and project-scoped at .agent-runway/memory.
// Keep this cleanup to avoid duplicated legacy state in .cursor/memory.
export async function cleanupLegacyCursorMemory(cursorDir: string): Promise<void> {
  const legacyMemoryDir = path.join(cursorDir, 'memory');
  if (await fs.pathExists(legacyMemoryDir)) {
    await fs.remove(legacyMemoryDir);
  }
}

export async function copyStacks(cursorDir: string, stacks: string[]): Promise<void> {
  const packageRoot = path.join(__dirname, '../..');
  const stacksSource = path.join(packageRoot, 'src/stacks');

  for (const stack of stacks) {
    const stackPath = path.join(stacksSource, stack);

    if (!(await fs.pathExists(stackPath))) {
      console.warn(`Warning: Stack "${stack}" not found at ${stackPath}`);
      continue;
    }

    const files = await fs.readdir(stackPath);
    for (const file of files) {
      if (file.endsWith('.mdc')) {
        await fs.copy(path.join(stackPath, file), path.join(cursorDir, 'rules', file), { overwrite: true });
      }
    }

    if (await fs.pathExists(path.join(stackPath, 'code-review-searches.md'))) {
      await fs.copy(
        path.join(stackPath, 'code-review-searches.md'),
        path.join(cursorDir, 'skills/code-review', `searches-${stack}.md`),
        { overwrite: true }
      );
    }

    if (await fs.pathExists(path.join(stackPath, 'code-review-commands.md'))) {
      await fs.copy(
        path.join(stackPath, 'code-review-commands.md'),
        path.join(cursorDir, 'skills/code-review', `commands-${stack}.md`),
        { overwrite: true }
      );
    }

    const dirs = await fs.readdir(stackPath, { withFileTypes: true });
    for (const dir of dirs) {
      if (dir.isDirectory() && dir.name.startsWith('skill-')) {
        const skillName = dir.name.replace('skill-', '');
        await fs.copy(
          path.join(stackPath, dir.name),
          path.join(cursorDir, 'skills', skillName),
          { overwrite: true }
        );
      }
    }
  }

  await updateCodeReviewSkillAt(path.join(cursorDir, 'skills'), stacks);
}

export async function copyStackSpecTemplates(projectRoot: string, stacks: string[]): Promise<void> {
  if (stacks.length === 0) return;

  const packageRoot = path.join(__dirname, '../..');
  const stacksSource = path.join(packageRoot, 'src/stacks');
  const destinationRoot = path.join(projectRoot, '.agent-runway', 'config', 'spec-templates');

  await fs.ensureDir(destinationRoot);

  for (const stack of stacks) {
    const source = path.join(stacksSource, stack, 'spec-templates');
    if (!(await fs.pathExists(source))) continue;
    await fs.copy(source, path.join(destinationRoot, stack), { overwrite: true });
  }
}

export async function copyDocsScaffold(projectRoot: string): Promise<void> {
  const packageRoot = path.join(__dirname, '../..');
  const docsSource = path.join(packageRoot, 'src/core/docs');
  const docsDestination = path.join(projectRoot, '.agent-runway', 'docs');

  if (!(await fs.pathExists(docsSource))) return;

  await fs.ensureDir(docsDestination);
  await fs.copy(docsSource, docsDestination, { overwrite: false, errorOnExist: false });
}

// Rewrites code-review SKILL.md to inject stack-specific search/command references.
// skillsDir is either .cursor/skills or .agent-runway/skills.
async function updateCodeReviewSkillAt(skillsDir: string, stacks: string[]): Promise<void> {
  const skillPath = path.join(skillsDir, 'code-review/SKILL.md');
  let content = await fs.readFile(skillPath, 'utf-8');

  const searchReferences = stacks
    .map((s) => `   - ${s}: [searches-${s}.md](searches-${s}.md)`)
    .join('\n');

  const commandReferences = stacks
    .map((s) => `   - ${s}: [commands-${s}.md](commands-${s}.md)`)
    .join('\n');

  content = content.replace(
    /#### 2a — Run All Mandatory Searches[\s\S]*?Execute every enabled search/,
    `#### 2a — Run All Mandatory Searches

Execute universal searches from [systematic-searches-base.md](systematic-searches-base.md).

Then execute stack-specific searches:
${searchReferences}

Execute every enabled search`
  );

  content = content.replace(
    /### Phase 1 — Initial Assessment[\s\S]*?Determine if.*can be executed/,
    `### Phase 1 — Initial Assessment

Classify each file in scope by layer and risk level.

Run build and test commands for your stack:
${commandReferences}

Determine if build and test can be executed`
  );

  await fs.writeFile(skillPath, content, 'utf-8');
}

// ─── Claude Code install ──────────────────────────────────────────────────────

// Copies core skills and stack-specific skills to .agent-runway/skills/,
// which is the neutral location referenced by Claude Code commands.
export async function copyNeutralSkills(projectRoot: string, stacks: string[]): Promise<void> {
  await copySkillsToDir(path.join(projectRoot, '.agent-runway', 'skills'), stacks);
}

async function copySkillsToDir(skillsDest: string, stacks: string[]): Promise<void> {
  const packageRoot = path.join(__dirname, '../..');
  const coreSkillsSource = path.join(packageRoot, 'src/core/skills');
  const stacksSource = path.join(packageRoot, 'src/stacks');

  await fs.ensureDir(skillsDest);
  await fs.copy(coreSkillsSource, skillsDest, { overwrite: true });

  for (const stack of stacks) {
    const stackPath = path.join(stacksSource, stack);
    if (!(await fs.pathExists(stackPath))) continue;

    // Copy stack skill-* directories
    const dirs = await fs.readdir(stackPath, { withFileTypes: true });
    for (const dir of dirs) {
      if (dir.isDirectory() && dir.name.startsWith('skill-')) {
        const skillName = dir.name.replace('skill-', '');
        await fs.copy(path.join(stackPath, dir.name), path.join(skillsDest, skillName), { overwrite: true });
      }
    }

    // Copy code-review extensions alongside the skill files
    const codeReviewDest = path.join(skillsDest, 'code-review');
    if (await fs.pathExists(path.join(stackPath, 'code-review-searches.md'))) {
      await fs.copy(
        path.join(stackPath, 'code-review-searches.md'),
        path.join(codeReviewDest, `searches-${stack}.md`),
        { overwrite: true }
      );
    }
    if (await fs.pathExists(path.join(stackPath, 'code-review-commands.md'))) {
      await fs.copy(
        path.join(stackPath, 'code-review-commands.md'),
        path.join(codeReviewDest, `commands-${stack}.md`),
        { overwrite: true }
      );
    }
  }

  await updateCodeReviewSkillAt(skillsDest, stacks);
}

// Installs Claude Code commands, agents, rules, and generates CLAUDE.md.
export async function copyClaude(projectRoot: string, stacks: string[]): Promise<void> {
  const packageRoot = path.join(__dirname, '../..');
  const claudeDir = getClaudeDir(projectRoot);

  await fs.ensureDir(path.join(claudeDir, 'commands'));
  await fs.ensureDir(path.join(claudeDir, 'agents'));

  await fs.copy(path.join(packageRoot, 'src/core/claude-commands'), path.join(claudeDir, 'commands'), { overwrite: true });
  await fs.copy(path.join(packageRoot, 'src/core/claude-agents'), path.join(claudeDir, 'agents'), { overwrite: true });

  await copyRulesToAgentRunway(projectRoot, stacks);
  await generateClaudeMd(projectRoot, stacks);
}

// Copies all rule .mdc files to .agent-runway/rules/ so they can be referenced from CLAUDE.md.
async function copyRulesToAgentRunway(projectRoot: string, stacks: string[]): Promise<void> {
  const packageRoot = path.join(__dirname, '../..');
  const rulesDir = path.join(projectRoot, '.agent-runway', 'rules');
  await fs.ensureDir(rulesDir);

  await fs.copy(path.join(packageRoot, 'src/core/rules'), rulesDir, { overwrite: true });

  const stacksSource = path.join(packageRoot, 'src/stacks');
  for (const stack of stacks) {
    const stackPath = path.join(stacksSource, stack);
    if (!(await fs.pathExists(stackPath))) continue;
    const files = await fs.readdir(stackPath);
    for (const file of files) {
      if (file.endsWith('.mdc')) {
        await fs.copy(path.join(stackPath, file), path.join(rulesDir, file), { overwrite: true });
      }
    }
  }
}

// Parses .mdc frontmatter (same subset as validate.ts — no external dependency).
// Normalizes CRLF so it works on Windows-authored files.
function parseMdcFrontmatter(content: string): Record<string, unknown> {
  const normalized = content.replace(/\r\n/g, '\n');
  const match = normalized.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const result: Record<string, unknown> = {};
  for (const line of match[1].split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    if (!key) continue;
    let value: unknown = line.slice(colonIdx + 1).trim();
    if (value === 'true') value = true;
    else if (value === 'false') value = false;
    else if (typeof value === 'string') value = (value as string).replace(/^["']|["']$/g, '');
    result[key] = value;
  }
  return result;
}

function stripMdcFrontmatter(content: string): string {
  return content.replace(/\r\n/g, '\n').replace(/^---\n[\s\S]*?\n---\n?/, '').trim();
}

// Generates CLAUDE.md at the project root.
// Strategy: alwaysApply:true rules are inlined in full; alwaysApply:false rules get a
// one-line summary pointing to .agent-runway/rules/ for the full content.
export async function generateClaudeMd(projectRoot: string, stacks: string[]): Promise<void> {
  const packageRoot = path.join(__dirname, '../..');
  const coreRulesDir = path.join(packageRoot, 'src/core/rules');
  const stacksSource = path.join(packageRoot, 'src/stacks');

  const sections: string[] = [
    '# Agent Runway — Project Rules\n',
    '<!-- Generated by Agent Runway. Re-run `agent-runway update` to refresh. -->',
    '<!-- Full rule content is in `.agent-runway/rules/` for rules not inlined here. -->\n',
  ];

  // Core rules
  const coreRuleFiles = (await fs.readdir(coreRulesDir))
    .filter((f) => f.endsWith('.mdc'))
    .sort();

  for (const file of coreRuleFiles) {
    const content = await fs.readFile(path.join(coreRulesDir, file), 'utf-8');
    const fm = parseMdcFrontmatter(content);
    const body = stripMdcFrontmatter(content);
    const title = file.replace('.mdc', '');

    if (fm.alwaysApply === true) {
      sections.push(`## ${title}\n\n${body}\n`);
    } else {
      sections.push(
        `## ${title}\n\n> **${fm.description || title}**\n> Full rule: \`.agent-runway/rules/${file}\`\n`
      );
    }
  }

  // Stack rules (always summarized — all have alwaysApply: false)
  for (const stack of stacks) {
    const stackPath = path.join(stacksSource, stack);
    if (!(await fs.pathExists(stackPath))) continue;

    const mdcFiles = (await fs.readdir(stackPath)).filter((f) => f.endsWith('.mdc')).sort();
    if (mdcFiles.length === 0) continue;

    sections.push(`## Stack: ${stack}\n`);
    for (const file of mdcFiles) {
      const content = await fs.readFile(path.join(stackPath, file), 'utf-8');
      const fm = parseMdcFrontmatter(content);
      sections.push(
        `### ${file.replace('.mdc', '')}\n\n> **${fm.description || file}**\n> Full rule: \`.agent-runway/rules/${file}\`\n`
      );
    }
  }

  const claudeMdPath = path.join(projectRoot, 'CLAUDE.md');
  await fs.writeFile(claudeMdPath, sections.join('\n'), 'utf-8');
}

// --- VS Code install -------------------------------------------------------

export async function copyVscode(projectRoot: string, stacks: string[]): Promise<void> {
  const githubDir = getVscodeDir(projectRoot);

  await fs.ensureDir(path.join(githubDir, 'instructions'));
  await fs.ensureDir(path.join(githubDir, 'prompts'));
  await fs.ensureDir(path.join(githubDir, 'agents'));
  await fs.ensureDir(path.join(githubDir, 'skills'));

  await copySkillsToDir(path.join(githubDir, 'skills'), stacks);
  await copyRulesToAgentRunway(projectRoot, stacks);
  await generateVscodeInstructions(projectRoot, stacks);
  await generateVscodePrompts(projectRoot);
  await generateVscodeAgents(projectRoot);
}

async function getRuleFiles(packageRoot: string, stacks: string[]): Promise<string[]> {
  const files: string[] = [];
  const coreRulesDir = path.join(packageRoot, 'src/core/rules');

  if (await fs.pathExists(coreRulesDir)) {
    const coreFiles = (await fs.readdir(coreRulesDir))
      .filter((file) => file.endsWith('.mdc'))
      .sort()
      .map((file) => path.join(coreRulesDir, file));
    files.push(...coreFiles);
  }

  const stacksSource = path.join(packageRoot, 'src/stacks');
  for (const stack of stacks) {
    const stackPath = path.join(stacksSource, stack);
    if (!(await fs.pathExists(stackPath))) continue;

    const stackFiles = (await fs.readdir(stackPath))
      .filter((file) => file.endsWith('.mdc'))
      .sort()
      .map((file) => path.join(stackPath, file));
    files.push(...stackFiles);
  }

  return files;
}

function toYamlString(value: unknown): string {
  return JSON.stringify(String(value ?? ''));
}

export async function generateVscodeInstructions(projectRoot: string, stacks: string[]): Promise<void> {
  const packageRoot = path.join(__dirname, '../..');
  const githubDir = getVscodeDir(projectRoot);
  const instructionsDir = path.join(githubDir, 'instructions', 'agent-runway');

  await fs.emptyDir(instructionsDir);

  const alwaysOnSections: string[] = [
    '---',
    'applyTo: "**"',
    '---',
    '',
    '# Agent Runway',
    '',
    'Use the Agent Runway workflow assets installed in this repository:',
    '',
    '- Prompt files: `.github/prompts/*.prompt.md`',
    '- Skills: `.github/skills/<skill>/SKILL.md`',
    '- Custom agents: `.github/agents/*.agent.md`',
    '- Full rule copies: `.agent-runway/rules/`',
    '',
    'When a task matches an Agent Runway workflow, read the corresponding skill before planning or editing.',
  ];

  for (const file of await getRuleFiles(packageRoot, stacks)) {
    const content = await fs.readFile(file, 'utf-8');
    const fm = parseMdcFrontmatter(content);
    const body = stripMdcFrontmatter(content);
    const baseName = path.basename(file, '.mdc');

    if (fm.alwaysApply === true) {
      alwaysOnSections.push('', `## ${baseName}`, '', body);
      continue;
    }

    const description = String(fm.description || baseName);
    const globs = String(fm.globs || '**');
    const targetPath = path.join(instructionsDir, `${baseName}.instructions.md`);

    const instructionContent = [
      '---',
      `name: ${toYamlString(`Agent Runway: ${baseName}`)}`,
      `description: ${toYamlString(description)}`,
      `applyTo: ${toYamlString(globs)}`,
      '---',
      '',
      body,
      '',
    ].join('\n');

    await fs.writeFile(targetPath, instructionContent, 'utf-8');
  }

  await fs.writeFile(
    path.join(githubDir, 'copilot-instructions.md'),
    `${alwaysOnSections.join('\n')}\n`,
    'utf-8'
  );
}

export async function generateVscodePrompts(projectRoot: string): Promise<void> {
  const packageRoot = path.join(__dirname, '../..');
  const sourceDir = path.join(packageRoot, 'src/core/claude-commands');
  const promptsDir = path.join(getVscodeDir(projectRoot), 'prompts');

  await fs.ensureDir(promptsDir);

  const commandFiles = (await fs.readdir(sourceDir))
    .filter((file) => file.endsWith('.md'))
    .sort();

  for (const file of commandFiles) {
    const commandName = path.basename(file, '.md');
    const source = await fs.readFile(path.join(sourceDir, file), 'utf-8');
    const body = source.replace(/\.agent-runway\/skills/g, '.github/skills').trim();
    const prompt = [
      '---',
      `name: ${toYamlString(commandName)}`,
      `description: ${toYamlString(`Agent Runway ${commandName} workflow`)}`,
      'agent: agent',
      '---',
      '',
      body,
      '',
    ].join('\n');

    await fs.writeFile(path.join(promptsDir, `${commandName}.prompt.md`), prompt, 'utf-8');
  }
}

export async function generateVscodeAgents(projectRoot: string): Promise<void> {
  const packageRoot = path.join(__dirname, '../..');
  const sourceDir = path.join(packageRoot, 'src/core/claude-agents');
  const agentsDir = path.join(getVscodeDir(projectRoot), 'agents');

  await fs.ensureDir(agentsDir);

  const agentFiles = (await fs.readdir(sourceDir))
    .filter((file) => file.endsWith('.md'))
    .sort();

  for (const file of agentFiles) {
    const source = await fs.readFile(path.join(sourceDir, file), 'utf-8');
    const fm = parseMdcFrontmatter(source);
    const body = stripMdcFrontmatter(source).replace(/\.agent-runway\/skills/g, '.github/skills');
    const agentName = String(fm.name || path.basename(file, '.md'));
    const description = String(fm.description || `Agent Runway ${agentName} agent`);
    const agent = [
      '---',
      `name: ${toYamlString(`Agent Runway ${agentName}`)}`,
      `description: ${toYamlString(description)}`,
      "tools: ['search/codebase', 'search/usages', 'read/terminalLastCommand']",
      '---',
      '',
      body,
      '',
    ].join('\n');

    await fs.writeFile(path.join(agentsDir, `${agentName}.agent.md`), agent, 'utf-8');
  }
}

// ─── Config ───────────────────────────────────────────────────────────────────

export async function createConfig(
  configDir: string,
  stacks: string[],
  isGlobal: boolean = false,
  targets: InstallTarget[] = ['cursor']
): Promise<void> {
  const config: Config = {
    version: '1.0.0',
    stacks,
    targets: normalizeTargets(targets),
    installedAt: new Date().toISOString(),
    isGlobal,
  };
  await fs.ensureDir(configDir);
  await fs.writeJson(path.join(configDir, NEW_CONFIG_FILENAME), config, { spaces: 2 });
}

export async function loadConfig(configDir: string): Promise<Config> {
  const configPath = await resolveConfigPath(configDir);
  const raw = await fs.readJson(configPath);
  return { ...raw, targets: normalizeTargets(raw.targets, ['cursor']) };
}

export async function saveConfig(configDir: string, config: Config): Promise<void> {
  config.updatedAt = new Date().toISOString();
  config.targets = normalizeTargets(config.targets);
  await fs.writeJson(path.join(configDir, NEW_CONFIG_FILENAME), config, { spaces: 2 });
}
