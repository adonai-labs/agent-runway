#!/usr/bin/env node
import os from 'os';
import path from 'path';
import fs from 'fs-extra';
import { initCommand } from './commands/init';

type SmokeCase = {
  name: string;
  target: 'cursor' | 'claude' | 'vscode';
  expectedPaths: string[];
  forbiddenPaths?: string[];
};

const BASE_EXPECTED = [
  '.agent-runway/memory',
  '.agent-runway/specs',
  '.agent-runway/config',
  '.agent-runway/workflows',
  '.agent-runway/docs',
];

const CASES: SmokeCase[] = [
  {
    name: 'cursor',
    target: 'cursor',
    expectedPaths: [
      ...BASE_EXPECTED,
      '.cursor/commands',
      '.cursor/skills',
      '.cursor/rules',
      '.cursor/agents',
      '.cursor/agent-runway.json',
    ],
  },
  {
    name: 'claude',
    target: 'claude',
    expectedPaths: [
      ...BASE_EXPECTED,
      '.claude/commands',
      '.claude/agents',
      'CLAUDE.md',
      '.agent-runway/skills',
      '.agent-runway/rules',
      '.agent-runway/agent-runway.json',
    ],
    forbiddenPaths: ['.cursor'],
  },
  {
    name: 'vscode',
    target: 'vscode',
    expectedPaths: [
      ...BASE_EXPECTED,
      '.github/copilot-instructions.md',
      '.github/instructions',
      '.github/prompts',
      '.github/agents',
      '.github/skills',
      '.agent-runway/rules',
      '.agent-runway/agent-runway.json',
    ],
    forbiddenPaths: ['.cursor', '.claude'],
  },
];

async function ensurePathsExist(root: string, paths: string[]): Promise<void> {
  for (const rel of paths) {
    const full = path.join(root, rel);
    if (!(await fs.pathExists(full))) {
      throw new Error(`Missing expected path: ${rel}`);
    }
  }
}

async function ensurePathsAbsent(root: string, paths: string[]): Promise<void> {
  for (const rel of paths) {
    const full = path.join(root, rel);
    if (await fs.pathExists(full)) {
      throw new Error(`Unexpected path present: ${rel}`);
    }
  }
}

async function runCase(testCase: SmokeCase): Promise<void> {
  const originalCwd = process.cwd();
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), `agent-runway-smoke-${testCase.name}-`));

  try {
    process.chdir(tempRoot);
    await initCommand({
      yes: true,
      scope: 'project',
      target: testCase.target,
      preset: 'node-typescript',
    });

    await ensurePathsExist(tempRoot, testCase.expectedPaths);
    if (testCase.forbiddenPaths) {
      await ensurePathsAbsent(tempRoot, testCase.forbiddenPaths);
    }
    console.log(`✅ smoke:${testCase.name}`);
  } finally {
    process.chdir(originalCwd);
    await fs.remove(tempRoot);
  }
}

async function main(): Promise<void> {
  for (const testCase of CASES) {
    await runCase(testCase);
  }
  console.log('\n✅ All smoke tests passed');
}

main().catch((error) => {
  console.error('\n❌ Smoke tests failed');
  console.error(error);
  process.exit(1);
});
