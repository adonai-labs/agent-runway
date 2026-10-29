import fs from 'fs-extra';
import path from 'path';
import { type WorkflowMode } from '../config';
import {
  type PathContext,
  mergeGeneratedBlock,
  parseFrontmatter,
  resolvePlaceholders,
  stripFrontmatter,
  toYamlString,
} from '../markdown';
import {
  CONFIG_DIR,
  NEUTRAL_RULES_DIR,
  installRules,
  installSkills,
  readAgents,
  readCommands,
  replaceManagedEntries,
  ruleSources,
} from './content';

const VSCODE_CTX: PathContext = { skills: '.github/skills', rules: NEUTRAL_RULES_DIR, config: CONFIG_DIR };

const COPILOT_START = '<!-- agent-runway:copilot:start -->';
const COPILOT_END = '<!-- agent-runway:copilot:end -->';

// VS Code Copilot reads .github/copilot-instructions.md, .github/instructions/,
// .github/prompts/, .github/agents/ and .github/skills/.
export async function installVscode(projectRoot: string, stacks: string[], mode: WorkflowMode): Promise<void> {
  const githubDir = path.join(projectRoot, '.github');

  await installSkills(path.join(githubDir, 'skills'), stacks, mode, VSCODE_CTX);
  await installRules(path.join(projectRoot, NEUTRAL_RULES_DIR), stacks, mode, VSCODE_CTX);
  await generateInstructions(githubDir, stacks, mode);

  const promptsDir = path.join(githubDir, 'prompts');
  await replaceManagedEntries(promptsDir, async () => {
    const written: string[] = [];
    for (const command of await readCommands(mode)) {
      const description = command.frontmatter.description || `Agent Runway ${command.name} workflow`;
      const prompt = [
        '---',
        `name: ${toYamlString(command.name)}`,
        `description: ${toYamlString(description)}`,
        'agent: agent',
        '---',
        '',
        resolvePlaceholders(stripFrontmatter(command.content), VSCODE_CTX),
        '',
      ].join('\n');
      await fs.writeFile(path.join(promptsDir, `${command.name}.prompt.md`), prompt, 'utf-8');
      written.push(`${command.name}.prompt.md`);
    }
    return written;
  });

  const agentsDir = path.join(githubDir, 'agents');
  await replaceManagedEntries(agentsDir, async () => {
    const written: string[] = [];
    for (const source of await readAgents(mode)) {
      const agentName = String(source.frontmatter.name || source.name);
      const description = String(source.frontmatter.description || `Agent Runway ${agentName} agent`);
      const agent = [
        '---',
        `name: ${toYamlString(`Agent Runway ${agentName}`)}`,
        `description: ${toYamlString(description)}`,
        "tools: ['search/codebase', 'search/usages', 'read/terminalLastCommand']",
        '---',
        '',
        resolvePlaceholders(stripFrontmatter(source.content), VSCODE_CTX),
        '',
      ].join('\n');
      await fs.writeFile(path.join(agentsDir, `${agentName}.agent.md`), agent, 'utf-8');
      written.push(`${agentName}.agent.md`);
    }
    return written;
  });
}

// alwaysApply rules go into copilot-instructions.md (inside a marked block, so user
// instructions are preserved); the rest become scoped .instructions.md files.
async function generateInstructions(githubDir: string, stacks: string[], mode: WorkflowMode): Promise<void> {
  const instructionsDir = path.join(githubDir, 'instructions', 'agent-runway');
  await fs.emptyDir(instructionsDir);

  const alwaysOn: string[] = [
    '# Agent Runway',
    '',
    'Use the Agent Runway workflow assets installed in this repository:',
    '',
    '- Skills: `.github/skills/<skill>/SKILL.md`',
    ...(mode === 'structured'
      ? ['- Prompt files: `.github/prompts/*.prompt.md`', '- Custom agents: `.github/agents/*.agent.md`']
      : []),
    '- Full rule copies: `.agent-runway/rules/`',
    '- Project memory, specs, logs and docs: `.agent-runway/`',
    '',
    'When a task matches an Agent Runway workflow, read the corresponding skill before planning or editing.',
  ];

  for (const file of await ruleSources(stacks, mode)) {
    const content = await fs.readFile(file, 'utf-8');
    const fm = parseFrontmatter(content);
    const body = resolvePlaceholders(stripFrontmatter(content), VSCODE_CTX);
    const baseName = path.basename(file, '.mdc');

    if (fm.alwaysApply === true) {
      alwaysOn.push('', `## ${baseName}`, '', body);
      continue;
    }

    const instruction = [
      '---',
      `name: ${toYamlString(`Agent Runway: ${baseName}`)}`,
      `description: ${toYamlString(fm.description || baseName)}`,
      `applyTo: ${toYamlString(fm.globs || '**')}`,
      '---',
      '',
      body,
      '',
    ].join('\n');
    await fs.writeFile(path.join(instructionsDir, `${baseName}.instructions.md`), instruction, 'utf-8');
  }

  const instructionsPath = path.join(githubDir, 'copilot-instructions.md');
  const existing = (await fs.pathExists(instructionsPath)) ? await fs.readFile(instructionsPath, 'utf-8') : null;
  const merged = mergeGeneratedBlock(existing, alwaysOn.join('\n'), COPILOT_START, COPILOT_END, (content) =>
    content.startsWith('---\napplyTo: "**"\n---\n\n# Agent Runway')
  );
  await fs.writeFile(instructionsPath, merged, 'utf-8');
}
