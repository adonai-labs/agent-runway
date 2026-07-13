import chalk from 'chalk';
import path from 'path';
import fs from 'fs-extra';
import { getAgentRunwayDir } from '../utils';

// Passing status token per gate (everything else counts as not-passing).
const PASS_TOKEN: Record<string, string> = {
  'ticket-eval': 'yes',
  'po-eval': 'yes',
  review: 'approve',
  contrarian: 'go',
};

export interface GateStat {
  gate: string;
  total: number;
  pass: number;
  blocking: number;
}

export interface Metrics {
  gates: GateStat[];
  acPending: number;
  runs: {
    total: number;
    build: { pass: number; fail: number; skipped: number };
    test: { pass: number; fail: number; skipped: number };
    lint: { pass: number; fail: number; skipped: number };
    retries: number;
    deviations: number;
    avgTimeToGreen: number | null;
    memoryRefs: { title: string; count: number }[];
  };
}

// Extracts every fenced block whose first content line equals `marker`,
// returning each block's flat `key: value` lines as a record.
export function parseBlocks(content: string, marker: string): Record<string, string>[] {
  const lines = content.split(/\r?\n/);
  const blocks: Record<string, string>[] = [];
  let i = 0;

  while (i < lines.length) {
    if (lines[i].trim().startsWith('```')) {
      const body: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        body.push(lines[i]);
        i++;
      }
      i++; // skip closing fence

      const firstContent = body.find((l) => l.trim().length > 0);
      if (firstContent && firstContent.trim() === marker) {
        const rec: Record<string, string> = {};
        for (const line of body) {
          const t = line.trim();
          if (!t || t === marker) continue;
          const idx = t.indexOf(':');
          if (idx === -1) continue;
          rec[t.slice(0, idx).trim()] = t.slice(idx + 1).trim();
        }
        blocks.push(rec);
      }
    } else {
      i++;
    }
  }

  return blocks;
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

function bumpGate(
  bucket: { pass: number; fail: number; skipped: number },
  value: string | undefined
): void {
  if (value === 'pass') bucket.pass++;
  else if (value === 'fail') bucket.fail++;
  else if (value === 'skipped') bucket.skipped++;
}

// Aggregates verdict blocks (specs) and run headers (logs) under .agent-runway.
export async function collectMetrics(agentRunwayDir: string): Promise<Metrics> {
  const specsDir = path.join(agentRunwayDir, 'specs');
  const logsDir = path.join(agentRunwayDir, 'logs');

  const specFiles = await listMdFiles(specsDir);
  const logFiles = await listMdFiles(logsDir);

  const gateMap = new Map<string, GateStat>();
  let acPending = 0;

  for (const file of specFiles) {
    const content = await fs.readFile(file, 'utf-8');

    for (const v of parseBlocks(content, '# agent-runway:verdict')) {
      const gate = v.gate;
      if (!gate) continue;
      const stat = gateMap.get(gate) ?? { gate, total: 0, pass: 0, blocking: 0 };
      stat.total++;
      if (v.status && v.status === PASS_TOKEN[gate]) stat.pass++;
      stat.blocking += Number.parseInt(v.blocking ?? '0', 10) || 0;
      gateMap.set(gate, stat);
    }

    acPending += (content.match(/Verified by:\s*pending/gi) ?? []).length;
  }

  const build = { pass: 0, fail: 0, skipped: 0 };
  const test = { pass: 0, fail: 0, skipped: 0 };
  const lint = { pass: 0, fail: 0, skipped: 0 };
  let retries = 0;
  let deviations = 0;
  const greenTimes: number[] = [];
  const memoryRefCounts = new Map<string, number>();
  let runTotal = 0;

  for (const file of logFiles) {
    const content = await fs.readFile(file, 'utf-8');
    for (const r of parseBlocks(content, '# agent-runway:run')) {
      runTotal++;
      bumpGate(build, r.build);
      bumpGate(test, r.test);
      bumpGate(lint, r.lint);
      retries += Number.parseInt(r.retries ?? '0', 10) || 0;
      deviations += Number.parseInt(r.deviations ?? '0', 10) || 0;

      const ttg = Number.parseInt(r.time_to_green_min ?? '', 10);
      if (!Number.isNaN(ttg)) greenTimes.push(ttg);

      for (const raw of (r.memory_refs ?? '').split(',')) {
        const title = raw.trim();
        if (!title) continue;
        memoryRefCounts.set(title, (memoryRefCounts.get(title) ?? 0) + 1);
      }
    }
  }

  return {
    gates: [...gateMap.values()].sort((a, b) => a.gate.localeCompare(b.gate)),
    acPending,
    runs: {
      total: runTotal,
      build,
      test,
      lint,
      retries,
      deviations,
      avgTimeToGreen: greenTimes.length
        ? Math.round(greenTimes.reduce((s, n) => s + n, 0) / greenTimes.length)
        : null,
      memoryRefs: [...memoryRefCounts.entries()]
        .map(([title, count]) => ({ title, count }))
        .sort((a, b) => b.count - a.count),
    },
  };
}

function pct(pass: number, total: number): string {
  if (total === 0) return '-';
  return `${Math.round((pass / total) * 100)}%`;
}

export async function metricsCommand(): Promise<void> {
  const projectRoot = process.cwd();
  const agentRunwayDir = getAgentRunwayDir(projectRoot);

  if (!(await fs.pathExists(agentRunwayDir))) {
    console.log(chalk.yellow('\nNo .agent-runway/ folder found. Run `agent-runway init` first.\n'));
    return;
  }

  const metrics = await collectMetrics(agentRunwayDir);

  console.log(chalk.blue.bold('\nAgent Runway Metrics\n'));

  console.log(chalk.bold('Gates'));
  if (metrics.gates.length === 0) {
    console.log(chalk.gray('  No verdict blocks found under .agent-runway/specs/'));
  } else {
    console.log(chalk.gray('  Gate          Pass rate   Pass/Total   Blocking'));
    for (const g of metrics.gates) {
      const name = g.gate.padEnd(13);
      const rate = pct(g.pass, g.total).padStart(9);
      const passTotal = `${g.pass}/${g.total}`.padStart(11);
      const blocking = String(g.blocking).padStart(9);
      console.log(`  ${name}${rate}${passTotal}${blocking}`);
    }
  }

  console.log(chalk.bold('\nAcceptance criteria'));
  const acColour = metrics.acPending > 0 ? chalk.yellow : chalk.green;
  console.log(`  ${acColour(`${metrics.acPending} pending`)} (criteria with no verifying test)`);

  console.log(chalk.bold('\nAutonomous runs'));
  const r = metrics.runs;
  if (r.total === 0) {
    console.log(chalk.gray('  No run headers found under .agent-runway/logs/'));
  } else {
    console.log(`  Runs: ${r.total}`);
    console.log(
      `  Build ${pct(r.build.pass, r.total)} | Test ${pct(r.test.pass, r.total)} | Lint ${pct(r.lint.pass, r.total)}`
    );
    console.log(`  Retries: ${r.retries} | Deviations: ${r.deviations}` + (r.avgTimeToGreen !== null ? ` | Avg time-to-green: ${r.avgTimeToGreen} min` : ''));

    if (r.memoryRefs.length > 0) {
      console.log(chalk.bold('\nMemory usage'));
      for (const m of r.memoryRefs) {
        console.log(`  ${String(m.count).padStart(3)}x  ${m.title}`);
      }
    }
  }

  console.log();
}
