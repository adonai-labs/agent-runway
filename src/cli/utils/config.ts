import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { PACKAGE_ROOT } from './paths';

export type InstallTarget = 'cursor' | 'claude' | 'vscode';
export type InstallTargetInput = InstallTarget | 'both' | 'all';
export type WorkflowMode = 'structured' | 'lite';

export interface Config {
  version: string;
  stacks: string[];
  targets: InstallTarget[];
  installedAt: string;
  updatedAt?: string;
  isGlobal?: boolean;
  mode?: WorkflowMode;
}

export const CONFIG_FILENAME = 'agent-runway.json';
const LEGACY_CONFIG_FILENAME = 'cursor-runway.json';

export function normalizeWorkflowMode(value: unknown): WorkflowMode {
  return value === 'lite' ? 'lite' : 'structured';
}

// Single source of truth for the version: the package.json shipped with this CLI.
let cachedVersion: string | undefined;
export function getPackageVersion(): string {
  if (cachedVersion) return cachedVersion;
  const pkg = fs.readJsonSync(path.join(PACKAGE_ROOT, 'package.json'));
  cachedVersion = String(pkg.version ?? '0.0.0');
  return cachedVersion;
}

// Compares dotted numeric versions (e.g. "1.4.1"). Returns -1 if a < b, 0 if equal, 1 if a > b.
export function compareVersions(a: string, b: string): number {
  const parse = (v: string) => v.split('.').map((n) => Number.parseInt(n, 10) || 0);
  const pa = parse(a);
  const pb = parse(b);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const da = pa[i] ?? 0;
    const db = pb[i] ?? 0;
    if (da < db) return -1;
    if (da > db) return 1;
  }
  return 0;
}

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

const KNOWN_TARGET_TOKENS = new Set(['cursor', 'claude', 'vscode', 'both', 'all']);

export function normalizeTargets(value: unknown, fallback: InstallTarget[] = ['cursor']): InstallTarget[] {
  const rawTargets = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : fallback;
  const targets: InstallTarget[] = [];
  const add = (target: InstallTarget) => {
    if (!targets.includes(target)) targets.push(target);
  };

  for (const rawTarget of rawTargets) {
    const target = String(rawTarget).trim().toLowerCase();
    if (target === 'both') {
      add('cursor');
      add('claude');
    } else if (target === 'all') {
      add('cursor');
      add('claude');
      add('vscode');
    } else if (target === 'cursor' || target === 'claude' || target === 'vscode') {
      add(target);
    }
  }

  return targets.length > 0 ? targets : [...fallback];
}

// Returns the raw target tokens normalizeTargets would silently drop (typos such as "claud").
export function findInvalidTargets(value: string): string[] {
  return value
    .split(',')
    .map((target) => target.trim().toLowerCase())
    .filter((target) => target && !KNOWN_TARGET_TOKENS.has(target));
}

function normalizeConfig(raw: Config, fallbackTargets: InstallTarget[]): Config {
  return {
    ...raw,
    stacks: Array.isArray(raw.stacks) ? raw.stacks : [],
    targets: normalizeTargets(raw.targets, fallbackTargets),
    mode: normalizeWorkflowMode(raw.mode),
  };
}

export async function resolveConfigPath(dir: string): Promise<string> {
  const configPath = path.join(dir, CONFIG_FILENAME);
  if (await fs.pathExists(configPath)) return configPath;

  const legacyConfigPath = path.join(dir, LEGACY_CONFIG_FILENAME);
  if (await fs.pathExists(legacyConfigPath)) return legacyConfigPath;

  return configPath;
}

export async function hasGlobalInstallation(): Promise<boolean> {
  return fs.pathExists(await resolveConfigPath(getGlobalCursorDir()));
}

export async function hasProjectInstallation(projectRoot: string): Promise<boolean> {
  return (await findProjectConfig(projectRoot)) !== null;
}

// Project config lives in .agent-runway/ for every target. Installs made before 1.7
// kept it in .cursor/ when Cursor was a target; those are still found and migrated
// on the next save.
export async function findProjectConfig(projectRoot: string): Promise<{ configDir: string; config: Config } | null> {
  const agentRunwayDir = getAgentRunwayDir(projectRoot);
  const configPath = path.join(agentRunwayDir, CONFIG_FILENAME);
  if (await fs.pathExists(configPath)) {
    return { configDir: agentRunwayDir, config: normalizeConfig(await fs.readJson(configPath), ['claude']) };
  }

  const legacyPath = await resolveConfigPath(path.join(projectRoot, '.cursor'));
  if (await fs.pathExists(legacyPath)) {
    return { configDir: agentRunwayDir, config: normalizeConfig(await fs.readJson(legacyPath), ['cursor']) };
  }

  return null;
}

export async function loadConfig(configDir: string): Promise<Config> {
  return normalizeConfig(await fs.readJson(await resolveConfigPath(configDir)), ['cursor']);
}

export function newConfig(stacks: string[], targets: InstallTarget[], mode: WorkflowMode, isGlobal = false): Config {
  return {
    version: getPackageVersion(),
    stacks,
    targets: normalizeTargets(targets),
    installedAt: new Date().toISOString(),
    isGlobal,
    mode: normalizeWorkflowMode(mode),
  };
}

export async function saveConfig(configDir: string, config: Config): Promise<void> {
  config.updatedAt = new Date().toISOString();
  config.targets = normalizeTargets(config.targets);
  config.mode = normalizeWorkflowMode(config.mode);
  await fs.ensureDir(configDir);
  await fs.writeJson(path.join(configDir, CONFIG_FILENAME), config, { spaces: 2 });
  await fs.remove(path.join(configDir, LEGACY_CONFIG_FILENAME));
}

// Writes the project config to .agent-runway/ and drops pre-1.7 copies under .cursor/.
export async function saveProjectConfig(projectRoot: string, config: Config): Promise<void> {
  await saveConfig(getAgentRunwayDir(projectRoot), config);
  const cursorDir = path.join(projectRoot, '.cursor');
  await fs.remove(path.join(cursorDir, CONFIG_FILENAME));
  await fs.remove(path.join(cursorDir, LEGACY_CONFIG_FILENAME));
}
