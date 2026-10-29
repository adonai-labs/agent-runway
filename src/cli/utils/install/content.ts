import fs from 'fs-extra';
import path from 'path';
import { CORE_SOURCE, STACKS_SOURCE } from '../paths';
import { type WorkflowMode } from '../config';
import { type PathContext, parseFrontmatter, replaceMarkerBlock, resolvePlaceholders } from '../markdown';

// Lite installs skills only (no commands or agents) and a minimal rule set.
// `shared` holds the policies and schemas the lite skills link to.
const LITE_CORE_SKILLS = new Set([
  'start',
  'express',
  'checkpoint',
  'learning',
  'safety-check',
  'code-review',
  'council',
  'shared',
]);
const LITE_CORE_RULES = new Set(['engineering-principles.mdc', 'engineering-security.mdc', 'testing.mdc']);

export const CONFIG_DIR = '.agent-runway/config';
export const NEUTRAL_RULES_DIR = '.agent-runway/rules';

// Each framework-managed directory records what Agent Runway wrote there, so updates
// replace only those entries and never touch user-authored skills, rules or agents.
const MANIFEST_FILE = '.agent-runway-managed.json';

// Entry names removed in earlier releases; used when a directory has no manifest yet.
const REMOVED_ENTRIES = [
  'dry-check.md',
  'self-review.md',
  'security-scan.md',
  'fast-lead.md',
  'dotnet.md',
  'spec.md',
  'ticket.md',
];

async function knownEntryNames(): Promise<string[]> {
  const names = new Set<string>(REMOVED_ENTRIES);
  for (const sub of ['skills', 'rules', 'commands', 'agents']) {
    for (const entry of await listEntries(path.join(CORE_SOURCE, sub))) names.add(entry.name);
  }
  for (const stack of await listEntries(STACKS_SOURCE)) {
    if (!stack.isDirectory()) continue;
    for (const entry of await listEntries(path.join(STACKS_SOURCE, stack.name))) {
      if (entry.name.endsWith('.mdc')) names.add(entry.name);
      if (entry.isDirectory() && entry.name.startsWith('skill-')) names.add(entry.name.replace('skill-', ''));
    }
  }
  return [...names];
}

// Removes the entries Agent Runway wrote last time, runs `write` (which returns the
// entry names it created), and records them. Without a manifest (installs made before
// 1.7) only entries whose names Agent Runway ships are removed.
export async function replaceManagedEntries(dir: string, write: () => Promise<string[]>): Promise<void> {
  await fs.ensureDir(dir);
  const manifestPath = path.join(dir, MANIFEST_FILE);
  const previous: string[] = (await fs.pathExists(manifestPath))
    ? ((await fs.readJson(manifestPath)).entries ?? [])
    : await knownEntryNames();

  for (const name of previous) {
    if (name && !name.includes('/') && !name.includes('..')) await fs.remove(path.join(dir, name));
  }

  const written = [...new Set(await write())].sort();
  if (written.length === 0) {
    await fs.remove(manifestPath);
    return;
  }
  await fs.writeJson(
    manifestPath,
    { note: 'Entries managed by Agent Runway. They are replaced by `agent-runway update`; other files here are left alone.', entries: written },
    { spaces: 2 }
  );
}

export function includeCoreSkill(name: string, mode: WorkflowMode): boolean {
  return mode === 'structured' || LITE_CORE_SKILLS.has(name);
}

export function includeCoreRule(fileName: string, mode: WorkflowMode): boolean {
  return mode === 'structured' || LITE_CORE_RULES.has(fileName);
}

function isTextContent(file: string): boolean {
  return file.endsWith('.md') || file.endsWith('.mdc');
}

// Copies a file or directory tree, resolving path placeholders in markdown files.
export async function copyResolved(source: string, dest: string, ctx: PathContext): Promise<void> {
  const stat = await fs.stat(source);
  if (stat.isDirectory()) {
    await fs.ensureDir(dest);
    for (const entry of await fs.readdir(source)) {
      await copyResolved(path.join(source, entry), path.join(dest, entry), ctx);
    }
    return;
  }

  await fs.ensureDir(path.dirname(dest));
  if (isTextContent(source)) {
    await fs.writeFile(dest, resolvePlaceholders(await fs.readFile(source, 'utf-8'), ctx), 'utf-8');
  } else {
    await fs.copy(source, dest, { overwrite: true });
  }
}

async function listEntries(dir: string): Promise<fs.Dirent[]> {
  if (!(await fs.pathExists(dir))) return [];
  return (await fs.readdir(dir, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name));
}

export interface SourceDoc {
  name: string;
  file: string;
  content: string;
  frontmatter: Record<string, unknown>;
}

async function readSourceDocs(dir: string): Promise<SourceDoc[]> {
  const docs: SourceDoc[] = [];
  for (const entry of await listEntries(dir)) {
    if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
    const file = path.join(dir, entry.name);
    const content = await fs.readFile(file, 'utf-8');
    docs.push({ name: path.basename(entry.name, '.md'), file, content, frontmatter: parseFrontmatter(content) });
  }
  return docs;
}

// Commands and agents are Structured-only workflow entrypoints.
export async function readCommands(mode: WorkflowMode): Promise<SourceDoc[]> {
  return mode === 'structured' ? readSourceDocs(path.join(CORE_SOURCE, 'commands')) : [];
}

export async function readAgents(mode: WorkflowMode): Promise<SourceDoc[]> {
  return mode === 'structured' ? readSourceDocs(path.join(CORE_SOURCE, 'agents')) : [];
}

// Names of every skill an install would contain (core + stack skills).
export async function installedSkillNames(stacks: string[], mode: WorkflowMode): Promise<Set<string>> {
  const names = new Set<string>();
  for (const entry of await listEntries(path.join(CORE_SOURCE, 'skills'))) {
    if (entry.isDirectory() && includeCoreSkill(entry.name, mode)) names.add(entry.name);
  }
  for (const stack of stacks) {
    for (const entry of await listEntries(path.join(STACKS_SOURCE, stack))) {
      if (entry.isDirectory() && entry.name.startsWith('skill-')) names.add(entry.name.replace('skill-', ''));
    }
  }
  return names;
}

// Installs core skills, stack skills, and stack code-review extensions into skillsDir.
export async function installSkills(skillsDir: string, stacks: string[], mode: WorkflowMode, ctx: PathContext): Promise<void> {
  await replaceManagedEntries(skillsDir, async () => {
    const written: string[] = [];
    for (const entry of await listEntries(path.join(CORE_SOURCE, 'skills'))) {
      if (!entry.isDirectory() || !includeCoreSkill(entry.name, mode)) continue;
      await copyResolved(path.join(CORE_SOURCE, 'skills', entry.name), path.join(skillsDir, entry.name), ctx);
      written.push(entry.name);
    }

    const codeReviewDir = path.join(skillsDir, 'code-review');
    for (const stack of stacks) {
      const stackPath = path.join(STACKS_SOURCE, stack);
      if (!(await fs.pathExists(stackPath))) {
        console.warn(`Warning: Stack "${stack}" not found at ${stackPath}`);
        continue;
      }

      for (const entry of await listEntries(stackPath)) {
        if (entry.isDirectory() && entry.name.startsWith('skill-')) {
          const skillName = entry.name.replace('skill-', '');
          await copyResolved(path.join(stackPath, entry.name), path.join(skillsDir, skillName), ctx);
          written.push(skillName);
        }
      }

      for (const kind of ['searches', 'commands']) {
        const source = path.join(stackPath, `code-review-${kind}.md`);
        if ((await fs.pathExists(source)) && (await fs.pathExists(codeReviewDir))) {
          await copyResolved(source, path.join(codeReviewDir, `${kind}-${stack}.md`), ctx);
        }
      }
    }

    await injectStackReferences(path.join(codeReviewDir, 'SKILL.md'), stacks);
    return written;
  });
}

// Rewrites code-review SKILL.md so its marker blocks list the installed stack extensions.
async function injectStackReferences(skillPath: string, stacks: string[]): Promise<void> {
  if (!(await fs.pathExists(skillPath))) return;
  let content = await fs.readFile(skillPath, 'utf-8');

  const searches =
    stacks.length > 0
      ? stacks.map((s) => `- ${s}: [searches-${s}.md](searches-${s}.md)`).join('\n')
      : '- (no stack selected - universal searches only)';
  const commands =
    stacks.length > 0
      ? stacks.map((s) => `- ${s}: [commands-${s}.md](commands-${s}.md)`).join('\n')
      : "- (no stack selected - run your project's build and test commands)";

  content = replaceMarkerBlock(content, 'searches', searches);
  content = replaceMarkerBlock(content, 'commands', commands);
  await fs.writeFile(skillPath, content, 'utf-8');
}

// Ordered rule sources (core then stacks) for the given mode.
export async function ruleSources(stacks: string[], mode: WorkflowMode): Promise<string[]> {
  const files: string[] = [];
  for (const entry of await listEntries(path.join(CORE_SOURCE, 'rules'))) {
    if (entry.isFile() && entry.name.endsWith('.mdc') && includeCoreRule(entry.name, mode)) {
      files.push(path.join(CORE_SOURCE, 'rules', entry.name));
    }
  }
  for (const stack of stacks) {
    for (const entry of await listEntries(path.join(STACKS_SOURCE, stack))) {
      if (entry.isFile() && entry.name.endsWith('.mdc')) files.push(path.join(STACKS_SOURCE, stack, entry.name));
    }
  }
  return files;
}

export async function installRules(rulesDir: string, stacks: string[], mode: WorkflowMode, ctx: PathContext): Promise<void> {
  await replaceManagedEntries(rulesDir, async () => {
    const written: string[] = [];
    for (const file of await ruleSources(stacks, mode)) {
      await copyResolved(file, path.join(rulesDir, path.basename(file)), ctx);
      written.push(path.basename(file));
    }
    return written;
  });
}

// Spec templates are per stack; templates for stacks no longer installed are removed.
export async function installStackSpecTemplates(projectRoot: string, stacks: string[]): Promise<void> {
  const destinationRoot = path.join(projectRoot, CONFIG_DIR, 'spec-templates');

  for (const entry of await listEntries(STACKS_SOURCE)) {
    if (entry.isDirectory() && !stacks.includes(entry.name)) {
      await fs.remove(path.join(destinationRoot, entry.name));
    }
  }

  for (const stack of stacks) {
    const source = path.join(STACKS_SOURCE, stack, 'spec-templates');
    if (!(await fs.pathExists(source))) continue;
    await fs.copy(source, path.join(destinationRoot, stack), { overwrite: true });
  }
}
