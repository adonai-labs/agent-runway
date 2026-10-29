// Frontmatter, marker-block and placeholder helpers for generated markdown.
// The frontmatter parser handles the flat `key: value` subset used by rules,
// skills, commands and agents - no YAML dependency.

export function parseFrontmatter(content: string): Record<string, unknown> {
  const match = content.replace(/\r\n/g, '\n').match(/^---\n([\s\S]*?)\n---/);
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
    else value = String(value).replace(/^["']|["']$/g, '');
    result[key] = value;
  }
  return result;
}

export function stripFrontmatter(content: string): string {
  return content.replace(/\r\n/g, '\n').replace(/^---\n[\s\S]*?\n---\n?/, '').trim();
}

// Adds or replaces flat frontmatter fields, creating the frontmatter block if missing.
export function setFrontmatterFields(content: string, fields: Record<string, string>): string {
  const normalized = content.replace(/\r\n/g, '\n');
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n?/);
  const lines = match ? match[1].split('\n') : [];
  for (const [key, value] of Object.entries(fields)) {
    const idx = lines.findIndex((line) => line.startsWith(`${key}:`));
    const entry = `${key}: ${value}`;
    if (idx === -1) lines.push(entry);
    else lines[idx] = entry;
  }
  const body = match ? normalized.slice(match[0].length) : normalized;
  return `---\n${lines.join('\n')}\n---\n${body}`;
}

export function toYamlString(value: unknown): string {
  return JSON.stringify(String(value ?? ''));
}

// Where installed content should point for each placeholder. Sources use
// {{skills}}, {{rules}} and {{config}} so one file serves every target.
export interface PathContext {
  skills: string;
  rules: string;
  config: string;
}

export function resolvePlaceholders(content: string, ctx: PathContext): string {
  return content
    .replace(/\{\{skills\}\}/g, ctx.skills)
    .replace(/\{\{rules\}\}/g, ctx.rules)
    .replace(/\{\{config\}\}/g, ctx.config);
}

// Replaces the content between an `<!-- ar:<marker>:start -->` / `:end -->` pair,
// keeping the markers so repeated updates stay idempotent. Throws if the pair is
// missing so injection never fails silently.
export function replaceMarkerBlock(content: string, marker: string, replacement: string): string {
  const start = `<!-- ar:${marker}:start -->`;
  const end = `<!-- ar:${marker}:end -->`;
  const startIdx = content.indexOf(start);
  const endIdx = content.indexOf(end);

  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
    throw new Error(`Missing "${marker}" marker block (${start} ... ${end}). Stack injection cannot proceed.`);
  }

  return content.slice(0, startIdx + start.length) + '\n' + replacement + '\n' + content.slice(endIdx);
}

// Merges a generated block into a user-owned file (CLAUDE.md, AGENTS.md), replacing
// only the content between `start` and `end` and preserving everything else.
export function mergeGeneratedBlock(
  existingContent: string | null,
  generatedContent: string,
  start: string,
  end: string,
  isLegacyGeneratedFile: (content: string) => boolean = () => false
): string {
  const generatedBlock = [start, generatedContent.trimEnd(), end, ''].join('\n');
  if (!existingContent || existingContent.trim().length === 0) return generatedBlock;

  const startIdx = existingContent.indexOf(start);
  const endIdx = existingContent.indexOf(end);
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    return (
      existingContent.slice(0, startIdx) +
      generatedBlock +
      existingContent.slice(endIdx + end.length).replace(/^\r?\n/, '')
    );
  }

  if (isLegacyGeneratedFile(existingContent.trimStart())) return generatedBlock;

  return `${existingContent.trimEnd()}\n\n${generatedBlock}`;
}
