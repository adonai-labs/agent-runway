#!/usr/bin/env node
import fs from 'fs-extra';
import path from 'path';

interface ValidationError {
  file: string;
  issue: string;
}

// Parses the YAML subset used in this project's frontmatter.
// Normalizes CRLF to LF first so the regex works on Windows-authored files.
// Handles: string values (with or without quotes), boolean true/false, extra keys.
function parseFrontmatter(content: string): Record<string, unknown> | null {
  const normalized = content.replace(/\r\n/g, '\n');
  const match = normalized.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

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

async function walkDir(dir: string, ext: string): Promise<string[]> {
  const results: string[] = [];
  if (!(await fs.pathExists(dir))) return results;

  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await walkDir(fullPath, ext)));
    } else if (entry.name.endsWith(ext)) {
      results.push(fullPath);
    }
  }
  return results;
}

// Validates all .mdc files: required frontmatter fields description, globs, alwaysApply.
// Extra fields (id, category) are permitted.
async function validateMdcFiles(packageRoot: string): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];

  const coreRulesDir = path.join(packageRoot, 'src/core/rules');
  const stacksDir = path.join(packageRoot, 'src/stacks');

  const mdcFiles = [
    ...(await walkDir(coreRulesDir, '.mdc')),
    ...(await walkDir(stacksDir, '.mdc')),
  ];

  for (const file of mdcFiles) {
    const content = await fs.readFile(file, 'utf-8');
    const fm = parseFrontmatter(content);
    const rel = path.relative(packageRoot, file);

    if (!fm) {
      errors.push({ file: rel, issue: 'Missing or malformed frontmatter' });
      continue;
    }
    if (typeof fm.description !== 'string' || !fm.description) {
      errors.push({ file: rel, issue: 'Missing required field: description' });
    }
    if (fm.globs === undefined) {
      errors.push({ file: rel, issue: 'Missing required field: globs' });
    }
    if (typeof fm.alwaysApply !== 'boolean') {
      errors.push({ file: rel, issue: `Field alwaysApply must be boolean, got: ${JSON.stringify(fm.alwaysApply)}` });
    }
  }

  return errors;
}

// Validates all SKILL.md files: required frontmatter fields name, description.
async function validateSkillFiles(packageRoot: string): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];

  const coreSkillsDir = path.join(packageRoot, 'src/core/skills');
  const stacksDir = path.join(packageRoot, 'src/stacks');

  const allMdFiles = [
    ...(await walkDir(coreSkillsDir, '.md')),
    ...(await walkDir(stacksDir, '.md')),
  ];
  const skillFiles = allMdFiles.filter((f) => path.basename(f) === 'SKILL.md');

  for (const file of skillFiles) {
    const content = await fs.readFile(file, 'utf-8');
    const fm = parseFrontmatter(content);
    const rel = path.relative(packageRoot, file);

    if (!fm) {
      errors.push({ file: rel, issue: 'Missing or malformed frontmatter' });
      continue;
    }
    if (typeof fm.name !== 'string' || !fm.name) {
      errors.push({ file: rel, issue: 'Missing required field: name' });
    }
    if (typeof fm.description !== 'string' || !fm.description) {
      errors.push({ file: rel, issue: 'Missing required field: description' });
    }
  }

  return errors;
}

// Validates command files: every .cursor/skills/<name>/ reference must resolve to a known skill.
// Checks src/core/skills/<name>/ first, then src/stacks/*/skill-<name>/ as fallback.
async function validateCommandFiles(packageRoot: string): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];

  const commandsDir = path.join(packageRoot, 'src/core/commands');
  const coreSkillsDir = path.join(packageRoot, 'src/core/skills');
  const stacksDir = path.join(packageRoot, 'src/stacks');

  const knownSkills = new Set<string>();

  if (await fs.pathExists(coreSkillsDir)) {
    const coreEntries = await fs.readdir(coreSkillsDir, { withFileTypes: true });
    for (const e of coreEntries) {
      if (e.isDirectory()) knownSkills.add(e.name);
    }
  }

  if (await fs.pathExists(stacksDir)) {
    const stackEntries = await fs.readdir(stacksDir, { withFileTypes: true });
    for (const stackEntry of stackEntries) {
      if (!stackEntry.isDirectory()) continue;
      const stackPath = path.join(stacksDir, stackEntry.name);
      const stackFiles = await fs.readdir(stackPath, { withFileTypes: true });
      for (const f of stackFiles) {
        if (f.isDirectory() && f.name.startsWith('skill-')) {
          knownSkills.add(f.name.replace('skill-', ''));
        }
      }
    }
  }

  const commandFiles = await walkDir(commandsDir, '.md');

  for (const file of commandFiles) {
    const content = await fs.readFile(file, 'utf-8');
    const rel = path.relative(packageRoot, file);

    const skillRefs = [...content.matchAll(/`\.cursor\/skills\/([^/`]+)\//g)];
    const seenSkills = new Set<string>();

    for (const match of skillRefs) {
      const skillName = match[1];
      if (seenSkills.has(skillName)) continue;
      seenSkills.add(skillName);

      if (!knownSkills.has(skillName)) {
        errors.push({ file: rel, issue: `References unknown skill: ${skillName}` });
      }
    }
  }

  return errors;
}

// Validates relative markdown links inside all .md files under skills/.
// Skips absolute URLs, anchor-only links, runtime paths, and known install-time assets.
async function validateSkillInternalRefs(packageRoot: string): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];

  const coreSkillsDir = path.join(packageRoot, 'src/core/skills');
  const stacksDir = path.join(packageRoot, 'src/stacks');

  // Build set of cross-stack skill names installed from stacks (e.g. dotnet-core).
  // These are referenced as ../skillName/ from core skills and only exist at runtime.
  const crossStackSkills = new Set<string>();
  if (await fs.pathExists(stacksDir)) {
    const stackEntries = await fs.readdir(stacksDir, { withFileTypes: true });
    for (const stackEntry of stackEntries) {
      if (!stackEntry.isDirectory()) continue;
      const stackPath = path.join(stacksDir, stackEntry.name);
      const stackFiles = await fs.readdir(stackPath, { withFileTypes: true });
      for (const f of stackFiles) {
        if (f.isDirectory() && f.name.startsWith('skill-')) {
          crossStackSkills.add(f.name.replace('skill-', ''));
        }
      }
    }
  }

  const mdFiles = [
    ...(await walkDir(coreSkillsDir, '.md')),
    ...(await walkDir(stacksDir, '.md')),
  ];

  for (const file of mdFiles) {
    const content = await fs.readFile(file, 'utf-8');
    const dir = path.dirname(file);
    const rel = path.relative(packageRoot, file);

    const linkMatches = [...content.matchAll(/\[(?:[^\]]+)\]\(([^)]+\.md)\)/g)];

    for (const match of linkMatches) {
      const linkPath = match[1].split('#')[0];
      if (!linkPath) continue;
      if (linkPath.startsWith('http') || linkPath.startsWith('#')) continue;
      if (linkPath.includes('.cursor/') || linkPath.includes('.agent-runway/')) continue;

      // searches-*.md and commands-*.md are generated at install time by the CLI.
      // They don't exist in the source tree but are valid at runtime.
      const basename = path.basename(linkPath);
      if (/^(searches|commands)-/.test(basename)) continue;

      // ../skillName/ refs that point to cross-stack skills only exist at runtime.
      const crossStackMatch = linkPath.match(/^\.\.\/([^/]+)\//);
      if (crossStackMatch && crossStackSkills.has(crossStackMatch[1])) continue;

      const resolvedPath = path.resolve(dir, linkPath);
      if (!(await fs.pathExists(resolvedPath))) {
        errors.push({ file: rel, issue: `Broken internal reference: ${linkPath}` });
      }
    }
  }

  return errors;
}

// Validates each stack directory has the minimum required files.
async function validateStackCompleteness(packageRoot: string): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];

  const stacksDir = path.join(packageRoot, 'src/stacks');
  if (!(await fs.pathExists(stacksDir))) return errors;

  const stackEntries = await fs.readdir(stacksDir, { withFileTypes: true });

  for (const stackEntry of stackEntries) {
    if (!stackEntry.isDirectory()) continue;

    const stackPath = path.join(stacksDir, stackEntry.name);
    const stackName = stackEntry.name;
    const files = await fs.readdir(stackPath);

    if (!files.some((f) => f.endsWith('.mdc'))) {
      errors.push({ file: `src/stacks/${stackName}`, issue: 'No .mdc rule file found' });
    }
    if (!files.includes('code-review-searches.md')) {
      errors.push({ file: `src/stacks/${stackName}`, issue: 'Missing required file: code-review-searches.md' });
    }
    if (!files.includes('code-review-commands.md')) {
      errors.push({ file: `src/stacks/${stackName}`, issue: 'Missing required file: code-review-commands.md' });
    }
  }

  return errors;
}

async function main(): Promise<void> {
  // dist/validate.js → __dirname is dist/, so .. is the package root
  const packageRoot = path.join(__dirname, '..');

  console.log('Validating Agent Runway content...\n');

  const allErrors: ValidationError[] = [
    ...(await validateMdcFiles(packageRoot)),
    ...(await validateSkillFiles(packageRoot)),
    ...(await validateCommandFiles(packageRoot)),
    ...(await validateSkillInternalRefs(packageRoot)),
    ...(await validateStackCompleteness(packageRoot)),
  ];

  if (allErrors.length === 0) {
    console.log('✅ All content valid\n');
    process.exit(0);
  }

  console.error(`❌ Found ${allErrors.length} validation error(s):\n`);
  for (const error of allErrors) {
    console.error(`  ${error.file}\n    → ${error.issue}\n`);
  }
  process.exit(1);
}

main().catch((err) => {
  console.error('Validation script failed unexpectedly:', err);
  process.exit(1);
});
