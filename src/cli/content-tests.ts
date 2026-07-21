#!/usr/bin/env node
import os from 'os';
import path from 'path';
import fs from 'fs-extra';
import assert from 'assert';
import { initCommand } from './commands/init';
import { addCommand } from './commands/add';
import { removeCommand } from './commands/remove';
import { updateCommand } from './commands/update';
import { upgradeCommand } from './commands/upgrade';
import { collectMetrics } from './commands/metrics';
import { normalizeTargets, getPackageVersion, compareVersions } from './utils';

// Pure-function checks
function testNormalizeTargets(): void {
  assert.deepStrictEqual(normalizeTargets('cursor'), ['cursor']);
  assert.deepStrictEqual(normalizeTargets('both'), ['cursor', 'claude']);
  assert.deepStrictEqual(normalizeTargets('all'), ['cursor', 'claude', 'vscode']);
  assert.deepStrictEqual(normalizeTargets('cursor,cursor,claude'), ['cursor', 'claude']);
  assert.deepStrictEqual(normalizeTargets('nonsense'), ['cursor']);
  console.log('ok content:normalizeTargets');
}

function testCompareVersions(): void {
  assert.strictEqual(compareVersions('1.4.1', '1.5.0'), -1);
  assert.strictEqual(compareVersions('1.5.0', '1.4.1'), 1);
  assert.strictEqual(compareVersions('1.4.1', '1.4.1'), 0);
  assert.strictEqual(compareVersions('1.10.0', '1.9.9'), 1);
  assert.strictEqual(compareVersions('2.0.0', '1.99.99'), 1);
  console.log('ok content:compareVersions');
}

function testPackageVersion(): void {
  const pkg = fs.readJsonSync(path.join(__dirname, '..', 'package.json'));
  assert.strictEqual(getPackageVersion(), String(pkg.version));
  console.log('ok content:packageVersion');
}

// Install-time checks
async function withTempInstall(
  run: (root: string) => Promise<void>,
  stacks = 'node,typescript',
  target: 'cursor' | 'claude' | 'vscode' = 'cursor'
): Promise<void> {
  const originalCwd = process.cwd();
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'agent-runway-content-'));
  try {
    process.chdir(tempRoot);
    await initCommand({ yes: true, scope: 'project', target, stacks });
    await run(tempRoot);
  } finally {
    process.chdir(originalCwd);
    await fs.remove(tempRoot);
  }
}

async function testSkillInjection(): Promise<void> {
  await withTempInstall(async (root) => {
    const skillPath = path.join(root, '.cursor', 'skills', 'code-review', 'SKILL.md');
    const content = await fs.readFile(skillPath, 'utf-8');
    assert.ok(await fs.pathExists(path.join(root, '.cursor', 'skills', 'council', 'SKILL.md')), 'structured installs council');

    assert.ok(content.includes('[searches-node.md](searches-node.md)'), 'node search ref injected');
    assert.ok(content.includes('[searches-typescript.md](searches-typescript.md)'), 'typescript search ref injected');
    assert.ok(content.includes('[commands-node.md](commands-node.md)'), 'node command ref injected');

    // Markers must survive so subsequent updates remain idempotent.
    assert.ok(content.includes('<!-- ar:searches:start -->'), 'searches marker preserved');
    assert.ok(content.includes('<!-- ar:commands:end -->'), 'commands marker preserved');
  });
  console.log('ok content:skillInjection');
}

async function testConfigVersion(): Promise<void> {
  await withTempInstall(async (root) => {
    const config = await fs.readJson(path.join(root, '.cursor', 'agent-runway.json'));
    assert.strictEqual(config.version, getPackageVersion(), 'config version matches package version');
  });
  console.log('ok content:configVersion');
}

async function testLitePresetUpgradesToStructured(): Promise<void> {
  const originalCwd = process.cwd();
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'agent-runway-lite-'));
  try {
    process.chdir(tempRoot);
    await initCommand({ yes: true, scope: 'project', target: 'all', preset: 'vibe-lite' });

    const cursorConfigPath = path.join(tempRoot, '.cursor', 'agent-runway.json');
    const liteConfig = await fs.readJson(cursorConfigPath);
    assert.strictEqual(liteConfig.mode, 'lite', 'vibe-lite stores lite mode');
    assert.ok(await fs.pathExists(path.join(tempRoot, '.cursor', 'skills', 'safety-check', 'SKILL.md')), 'lite installs safety-check');
    assert.ok(await fs.pathExists(path.join(tempRoot, '.cursor', 'skills', 'learning', 'SKILL.md')), 'lite installs learning');
    assert.ok(await fs.pathExists(path.join(tempRoot, '.cursor', 'skills', 'council', 'SKILL.md')), 'lite installs council');
    assert.ok(await fs.pathExists(path.join(tempRoot, '.cursor', 'skills', 'code-review', 'SKILL.md')), 'lite installs code-review');
    assert.ok(!(await fs.pathExists(path.join(tempRoot, '.cursor', 'commands', 'start.md'))), 'lite does not install Cursor commands');
    assert.ok(!(await fs.pathExists(path.join(tempRoot, '.claude', 'commands', 'start.md'))), 'lite does not install Claude commands');
    assert.ok(!(await fs.pathExists(path.join(tempRoot, '.github', 'prompts', 'start.prompt.md'))), 'lite does not install VS Code prompts');

    await upgradeCommand({ to: 'structured' });

    const structuredConfig = await fs.readJson(cursorConfigPath);
    assert.strictEqual(structuredConfig.mode, 'structured', 'upgrade stores structured mode');
    assert.ok(await fs.pathExists(path.join(tempRoot, '.cursor', 'commands', 'start.md')), 'structured restores Cursor commands');
    assert.ok(await fs.pathExists(path.join(tempRoot, '.claude', 'commands', 'start.md')), 'structured restores Claude commands');
    assert.ok(await fs.pathExists(path.join(tempRoot, '.github', 'prompts', 'start.prompt.md')), 'structured restores VS Code prompts');
    assert.ok(await fs.pathExists(path.join(tempRoot, '.cursor', 'skills', 'lead', 'SKILL.md')), 'structured restores lead skill');
  } finally {
    process.chdir(originalCwd);
    await fs.remove(tempRoot);
  }
  console.log('ok content:liteUpgrade');
}

async function testClaudeMdContainsMaintainabilityRule(): Promise<void> {
  await withTempInstall(async (root) => {
    const content = await fs.readFile(path.join(root, 'CLAUDE.md'), 'utf-8');
    assert.ok(
      content.includes('Prefer files and classes under 600 lines'),
      'CLAUDE.md includes maintainability rule'
    );
  }, 'node,typescript', 'claude');
  console.log('ok content:claudeMaintainabilityRule');
}
async function testClaudeMdPreservesExistingContent(): Promise<void> {
  const originalCwd = process.cwd();
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'agent-runway-claude-merge-'));
  try {
    process.chdir(tempRoot);
    await fs.writeFile(path.join(tempRoot, 'CLAUDE.md'), ['# Existing Claude Rules', '', '- Keep my local instruction.', ''].join('\n'));

    await initCommand({ yes: true, scope: 'project', target: 'claude', stacks: 'node,typescript' });
    await updateCommand();

    const content = await fs.readFile(path.join(tempRoot, 'CLAUDE.md'), 'utf-8');
    assert.ok(content.includes('# Existing Claude Rules'), 'existing CLAUDE.md heading preserved');
    assert.ok(content.includes('- Keep my local instruction.'), 'existing CLAUDE.md instruction preserved');
    assert.ok(content.includes('<!-- agent-runway:claude:start -->'), 'Agent Runway block marker written');
    assert.ok(content.includes('Prefer files and classes under 600 lines'), 'generated Agent Runway rules included');
    assert.strictEqual((content.match(/agent-runway:claude:start/g) ?? []).length, 1, 'Agent Runway block is not duplicated');
  } finally {
    process.chdir(originalCwd);
    await fs.remove(tempRoot);
  }
  console.log('ok content:claudeMdPreservesExistingContent');
}

async function testAddPreservesExistingStackInjection(): Promise<void> {
  await withTempInstall(async (root) => {
    await addCommand('react');

    const skillPath = path.join(root, '.cursor', 'skills', 'code-review', 'SKILL.md');
    const content = await fs.readFile(skillPath, 'utf-8');

    assert.ok(content.includes('[searches-node.md](searches-node.md)'), 'node search ref preserved');
    assert.ok(content.includes('[searches-typescript.md](searches-typescript.md)'), 'typescript search ref preserved');
    assert.ok(content.includes('[searches-react.md](searches-react.md)'), 'react search ref added');
  });
  console.log('ok content:addPreservesInjection');
}

async function testRemoveRefreshesCursorArtifacts(): Promise<void> {
  await withTempInstall(async (root) => {
    await addCommand('react');
    await removeCommand('node');

    const skillPath = path.join(root, '.cursor', 'skills', 'code-review', 'SKILL.md');
    const content = await fs.readFile(skillPath, 'utf-8');

    assert.ok(!content.includes('[searches-node.md](searches-node.md)'), 'node search ref removed');
    assert.ok(content.includes('[searches-typescript.md](searches-typescript.md)'), 'typescript search ref preserved');
    assert.ok(content.includes('[searches-react.md](searches-react.md)'), 'react search ref preserved');
    assert.ok(!(await fs.pathExists(path.join(root, '.cursor', 'skills', 'node-core'))), 'node skill removed from cursor install');
    assert.ok(await fs.pathExists(path.join(root, '.cursor', 'skills', 'react-core')), 'react skill retained');
  }, 'node,typescript');
  console.log('ok content:removeRefreshesCursorArtifacts');
}

async function testRemoveDeletesProjectSpecTemplates(): Promise<void> {
  await withTempInstall(async (root) => {
    await addCommand('react');
    const templateDir = path.join(root, '.agent-runway', 'config', 'spec-templates', 'react');
    assert.ok(await fs.pathExists(templateDir), 'react spec templates installed');

    await removeCommand('react');

    assert.ok(!(await fs.pathExists(templateDir)), 'react spec templates removed');
  }, 'typescript');
  console.log('ok content:removeDeletesSpecTemplates');
}
async function testUpdatePrunesStaleFiles(): Promise<void> {
  await withTempInstall(async (root) => {
    const staleFile = path.join(root, '.cursor', 'commands', '__stale__.md');
    await fs.writeFile(staleFile, '# stale command removed in a newer release\n');
    assert.ok(await fs.pathExists(staleFile), 'stale file created');

    await updateCommand({});

    assert.ok(!(await fs.pathExists(staleFile)), 'stale file pruned by update');
    assert.ok(await fs.pathExists(path.join(root, '.cursor', 'commands', 'review.md')), 'real command preserved');
  });
  console.log('ok content:updatePrunesStaleFiles');
}

async function testUpdateRecreatesScaffold(): Promise<void> {
  await withTempInstall(async (root) => {
    const logsDir = path.join(root, '.agent-runway', 'logs');
    const memoryFile = path.join(root, '.agent-runway', 'memory', 'execution-memory.md');

    // Simulate accidental deletion.
    await fs.remove(logsDir);
    await fs.remove(memoryFile);
    assert.ok(!(await fs.pathExists(logsDir)), 'logs dir deleted');
    assert.ok(!(await fs.pathExists(memoryFile)), 'memory file deleted');

    await updateCommand({});

    assert.ok(await fs.pathExists(logsDir), 'logs dir recreated by update');
    assert.ok(await fs.pathExists(memoryFile), 'memory file recreated by update');
  });
  console.log('ok content:updateRecreatesScaffold');
}

async function testCursorAgentParity(): Promise<void> {
  await withTempInstall(async (root) => {
    const agentsDir = path.join(root, '.cursor', 'agents');
    for (const name of ['review.md', 'architect.md', 'contrarian.md']) {
      assert.ok(await fs.pathExists(path.join(agentsDir, name)), `${name} installed as a Cursor agent`);
    }
  });
  console.log('ok content:cursorAgentParity');
}

async function testMetricsAggregates(): Promise<void> {
  await withTempInstall(async (root) => {
    const agentDir = path.join(root, '.agent-runway');

    const spec = [
      '# Demo',
      '',
      '## Acceptance Criteria',
      '- [ ] Foo - Verified by: pending',
      '- [ ] Bar - Verified by: pending',
      '',
      '```yaml',
      '# agent-runway:verdict',
      'gate: ticket-eval',
      'status: yes',
      'blocking: 0',
      'date: 2026-06-26',
      'artifact: demo',
      '```',
      '',
      '```yaml',
      '# agent-runway:verdict',
      'gate: review',
      'status: changes',
      'blocking: 2',
      'date: 2026-06-26',
      'artifact: demo',
      '```',
      '',
    ].join('\n');

    const runLog = [
      '# Run',
      '',
      '```yaml',
      '# agent-runway:run',
      'run_id: r1',
      'date: 2026-06-26',
      'task: demo',
      'classification: standard',
      'build: pass',
      'test: pass',
      'lint: fail',
      'retries: 2',
      'time_to_green_min: 10',
      'deviations: 1',
      'memory_refs: guardrail-a, guardrail-b',
      '```',
      '',
    ].join('\n');

    await fs.outputFile(path.join(agentDir, 'specs', 'demo', 'spec.md'), spec);
    await fs.outputFile(path.join(agentDir, 'logs', 'autonomous-runs', 'r1.md'), runLog);

    const metrics = await collectMetrics(agentDir);

    const ticketEval = metrics.gates.find((g) => g.gate === 'ticket-eval');
    const review = metrics.gates.find((g) => g.gate === 'review');
    assert.ok(ticketEval && ticketEval.total === 1 && ticketEval.pass === 1, 'ticket-eval pass counted');
    assert.ok(review && review.total === 1 && review.pass === 0 && review.blocking === 2, 'review blocking counted');
    assert.strictEqual(metrics.acPending, 2, 'pending acceptance criteria counted');

    assert.strictEqual(metrics.runs.total, 1, 'one run header parsed');
    assert.strictEqual(metrics.runs.build.pass, 1, 'build pass counted');
    assert.strictEqual(metrics.runs.lint.fail, 1, 'lint fail counted');
    assert.strictEqual(metrics.runs.retries, 2, 'retries summed');
    assert.strictEqual(metrics.runs.deviations, 1, 'deviations summed');
    assert.strictEqual(metrics.runs.avgTimeToGreen, 10, 'avg time-to-green computed');
    assert.strictEqual(metrics.runs.memoryRefs.length, 2, 'memory refs tallied');
  });
  console.log('ok content:metricsAggregates');
}

async function testVerdictMarkersPresent(): Promise<void> {
  await withTempInstall(async (root) => {
    const skills = path.join(root, '.cursor', 'skills');
    const checks: [string, string][] = [
      [path.join(skills, 'ticket-eval', 'SKILL.md'), '# agent-runway:verdict'],
      [path.join(skills, 'po-eval', 'SKILL.md'), '# agent-runway:verdict'],
      [path.join(skills, 'contrarian', 'SKILL.md'), '# agent-runway:verdict'],
      [path.join(skills, 'code-review', 'templates.md'), '# agent-runway:verdict'],
      [
        path.join(root, '.agent-runway', 'docs', 'examples', 'autonomous-run-log-template.md'),
        '# agent-runway:run',
      ],
    ];
    for (const [file, marker] of checks) {
      const content = await fs.readFile(file, 'utf-8');
      assert.ok(content.includes(marker), `${marker} present in ${path.basename(file)}`);
    }
  });
  console.log('ok content:verdictMarkers');
}

async function testCiCheckStrict(): Promise<void> {
  await withTempInstall(async (root) => {
    const agentDir = path.join(root, '.agent-runway');
    await fs.outputFile(
      path.join(agentDir, 'specs', 'demo', 'spec.md'),
      ['# Demo', '', '- [ ] Foo - Verified by: pending', ''].join('\n')
    );

    const { runCiCheck } = await import('./commands/ci-check');
    const light = await runCiCheck(root, 'light');
    assert.ok(light.passed, 'light profile passes with warnings only');
    assert.ok(light.findings.length >= 2, 'light reports spec + governance findings');

    const strict = await runCiCheck(root, 'strict');
    assert.ok(!strict.passed, 'strict profile fails when verdicts missing');
    assert.ok(
      strict.findings.some((f) => f.code === 'GOVERNANCE_GAP'),
      'strict reports governance gap'
    );
  });
  console.log('ok content:ciCheckStrict');
}

async function testCiCheckClean(): Promise<void> {
  await withTempInstall(async (root) => {
    const agentDir = path.join(root, '.agent-runway');
    const spec = [
      '# Demo',
      '',
      '- [ ] Foo - Verified by: unit test in tests/foo.test.ts',
      '',
      '```yaml',
      '# agent-runway:verdict',
      'gate: ticket-eval',
      'status: yes',
      'blocking: 0',
      'date: 2026-06-26',
      'artifact: demo',
      '```',
      '',
    ].join('\n');
    await fs.outputFile(path.join(agentDir, 'specs', 'demo', 'spec.md'), spec);

    const { runCiCheck } = await import('./commands/ci-check');
    const strict = await runCiCheck(root, 'strict');
    assert.ok(strict.passed, 'strict passes when spec has verdict and no pending AC');
    assert.strictEqual(strict.findings.length, 0);
  });
  console.log('ok content:ciCheckClean');
}

async function main(): Promise<void> {
  testNormalizeTargets();
  testCompareVersions();
  testPackageVersion();
  await testSkillInjection();
  await testConfigVersion();
  await testLitePresetUpgradesToStructured();
  await testClaudeMdContainsMaintainabilityRule();
  await testClaudeMdPreservesExistingContent();
  await testAddPreservesExistingStackInjection();
  await testRemoveRefreshesCursorArtifacts();
  await testRemoveDeletesProjectSpecTemplates();
  await testUpdatePrunesStaleFiles();
  await testUpdateRecreatesScaffold();
  await testCursorAgentParity();
  await testMetricsAggregates();
  await testVerdictMarkersPresent();
  await testCiCheckStrict();
  await testCiCheckClean();
  console.log('\nok All content tests passed');
}

main().catch((error) => {
  console.error('\nx Content tests failed');
  console.error(error);
  process.exit(1);
});
