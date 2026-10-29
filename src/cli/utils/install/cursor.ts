import fs from 'fs-extra';
import path from 'path';
import { type WorkflowMode } from '../config';
import { type PathContext, resolvePlaceholders, stripFrontmatter } from '../markdown';
import { CONFIG_DIR, installRules, installSkills, readAgents, readCommands, replaceManagedEntries } from './content';

// Cursor reads commands, agents, skills and rules from .cursor/ (or ~/.cursor/ when global).
export async function installCursor(cursorDir: string, stacks: string[], mode: WorkflowMode, isGlobal: boolean): Promise<void> {
  const ctx: PathContext = {
    skills: isGlobal ? '~/.cursor/skills' : '.cursor/skills',
    rules: isGlobal ? '~/.cursor/rules' : '.cursor/rules',
    config: CONFIG_DIR,
  };

  // Cursor commands are plain markdown: frontmatter would be shown as text.
  const commandsDir = path.join(cursorDir, 'commands');
  await replaceManagedEntries(commandsDir, async () => {
    const written: string[] = [];
    for (const command of await readCommands(mode)) {
      const body = resolvePlaceholders(stripFrontmatter(command.content), ctx);
      await fs.writeFile(path.join(commandsDir, `${command.name}.md`), `${body}\n`, 'utf-8');
      written.push(`${command.name}.md`);
    }
    return written;
  });

  const agentsDir = path.join(cursorDir, 'agents');
  await replaceManagedEntries(agentsDir, async () => {
    const written: string[] = [];
    for (const agent of await readAgents(mode)) {
      await fs.writeFile(path.join(agentsDir, `${agent.name}.md`), resolvePlaceholders(agent.content, ctx), 'utf-8');
      written.push(`${agent.name}.md`);
    }
    return written;
  });

  await installSkills(path.join(cursorDir, 'skills'), stacks, mode, ctx);
  await installRules(path.join(cursorDir, 'rules'), stacks, mode, ctx);

  // Pre-1.7 installs kept memory under .cursor/memory; memory now lives in .agent-runway/memory.
  await fs.remove(path.join(cursorDir, 'memory'));
}
