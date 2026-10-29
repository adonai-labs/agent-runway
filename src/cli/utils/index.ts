// Public surface of the CLI internals. Implementation lives in focused modules:
// config.ts (config + versions), markdown.ts (frontmatter, markers, placeholders),
// install/ (one module per target plus shared content and scaffold).
import { getAvailableStacks as getStacksFromPresets, type Stack } from '../presets';

export * from './config';
export * from './markdown';
export * from './install';
export type { Stack };

export function getAvailableStacks(): Stack[] {
  return getStacksFromPresets();
}
