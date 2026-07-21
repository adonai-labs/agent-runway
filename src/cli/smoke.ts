#!/usr/bin/env node
import os from 'os';
import path from 'path';
import fs from 'fs-extra';
import { initCommand } from './commands/init';

type SmokeCase = {
  name: string;
  target: 'cursor' | 'claude' | 'vscode';
  preset?: string;
  expectedPaths: string[];
  forbiddenPaths?: string[];
};

const BASE_EXPECTED = [
  '.agent-runway/memory',
  '.agent-runway/memory/execution-memory.md',
  '.agent-runway/memory/reasoning-memory.md',
  '.agent-runway/specs',
  '.agent-runway/config',
  '.agent-runway/workflows',
  '.agent-runway/logs',
  '.agent-runway/docs',
];

const CASES: SmokeCase[] = [
  {
    name: 'vibe-lite-cursor',
    target: 'cursor',
    preset: 'vibe-lite',
    expectedPaths: [
      ...BASE_EXPECTED,
      '.cursor/commands',
      '.cursor/skills/start/SKILL.md',
      '.cursor/skills/express/SKILL.md',
      '.cursor/skills/checkpoint/SKILL.md',
      '.cursor/skills/learning/SKILL.md',
      '.cursor/skills/safety-check/SKILL.md',
      '.cursor/skills/council/SKILL.md',
      '.cursor/skills/code-review/SKILL.md',
      '.cursor/skills/code-review/templates.md',
      '.cursor/rules/engineering-principles.mdc',
      '.cursor/rules/engineering-security.mdc',
      '.cursor/rules/testing.mdc',
      '.cursor/agent-runway.json',
    ],
    forbiddenPaths: [
      '.cursor/commands/start.md',
      '.cursor/agents/review.md',
      '.cursor/skills/lead/SKILL.md',
      '.cursor/rules/api-design.mdc',
    ],
  },
  {
    name: 'cursor',
    target: 'cursor',
    expectedPaths: [
      ...BASE_EXPECTED,
      '.cursor/commands',
      '.cursor/commands/autonomous-lead.md',
      '.cursor/skills',
      '.cursor/skills/checkpoint/SKILL.md',
      '.cursor/skills/council/SKILL.md',
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
      '.claude/commands/autonomous-lead.md',
      '.claude/agents',
      'CLAUDE.md',
      '.agent-runway/skills',
      '.agent-runway/skills/checkpoint/SKILL.md',
      '.agent-runway/skills/learning/SKILL.md',
      '.agent-runway/skills/council/SKILL.md',
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
      '.github/prompts/autonomous-lead.prompt.md',
      '.github/agents',
      '.github/skills',
      '.github/skills/checkpoint/SKILL.md',
      '.github/skills/learning/SKILL.md',
      '.github/skills/council/SKILL.md',
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
      preset: testCase.preset ?? 'node-typescript',
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
