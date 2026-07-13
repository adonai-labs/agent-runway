/**
 * Presets for Agent Runway
 *
 * Combines stacks and capabilities into ready-to-use project configurations
 */

export interface Stack {
  id: string;
  name: string;
  description: string;
  recommended?: boolean;
}

export interface Preset {
  id: string;
  name: string;
  description: string;
  emoji: string;
  stacks: string[];
  recommended?: boolean;
}

/**
 * Available stacks
 */
export const STACKS: Stack[] = [
  {
    id: 'node',
    name: 'Node.js',
    description: 'Runtime/server patterns, process lifecycle, observability, security',
    recommended: true,
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    description: 'Type safety, linting, async/await best practices',
    recommended: true,
  },
  {
    id: 'react',
    name: 'React',
    description: 'Component patterns, hooks, state management, performance',
    recommended: true,
  },
  {
    id: 'dotnet',
    name: '.NET / C#',
    description: 'ASP.NET Core, EF Core, CQRS, clean architecture',
  },
  {
    id: 'rust',
    name: 'Rust',
    description: 'Memory safety, ownership, error handling, cargo patterns',
  },
  {
    id: 'python',
    name: 'Python',
    description: 'PEP 8, type hints, async patterns, pytest, packaging',
  },
  {
    id: 'go',
    name: 'Go',
    description: 'Error handling, concurrency, context propagation, testing',
  },
  {
    id: 'electron',
    name: 'Electron',
    description: 'IPC patterns, main/renderer separation, security',
  },
];

/**
 * Project presets
 *
 * Combines stacks for common project types
 */
export const PRESETS: Preset[] = [
  {
    id: 'node-typescript',
    name: 'Node.js + TypeScript',
    description: 'Popular backend or library setup with TypeScript',
    emoji: '[TS]',
    stacks: ['node', 'typescript'],
    recommended: true,
  },
  {
    id: 'web-fullstack-ts',
    name: 'Full-stack Web (TypeScript + React)',
    description: 'Modern SPA with React frontend + TypeScript/Node backend',
    emoji: '[WEB]',
    stacks: ['node', 'typescript', 'react'],
    recommended: true,
  },
  {
    id: 'dotnet-backend',
    name: '.NET Backend API',
    description: 'REST/gRPC APIs with ASP.NET Core and C#',
    emoji: '[NET]',
    stacks: ['dotnet'],
    recommended: true,
  },
  {
    id: 'electron-desktop',
    name: 'Electron Desktop App',
    description: 'Cross-platform desktop application with Electron',
    emoji: '[DESK]',
    stacks: ['node', 'typescript', 'react', 'electron'],
  },
  {
    id: 'rust-systems',
    name: 'Rust Systems Programming',
    description: 'High-performance systems development with Rust',
    emoji: '[RS]',
    stacks: ['rust'],
  },
  {
    id: 'python-backend',
    name: 'Python Backend',
    description: 'APIs, services, and data pipelines with Python',
    emoji: '[PY]',
    stacks: ['python'],
  },
  {
    id: 'go-backend',
    name: 'Go Backend',
    description: 'High-performance services and APIs with Go',
    emoji: '[GO]',
    stacks: ['go'],
  },
  {
    id: 'core-only',
    name: 'Core Only',
    description: 'Universal rules only - ideal for any language',
    emoji: '[CORE]',
    stacks: [],
  },
  {
    id: 'polyglot-backend',
    name: 'Polyglot Backend',
    description: 'Multiple languages in the same project',
    emoji: '[POLY]',
    stacks: ['node', 'typescript', 'dotnet', 'rust', 'python', 'go'],
  },
  {
    id: 'custom',
    name: 'Custom Selection',
    description: 'Choose stacks individually',
    emoji: '[CUSTOM]',
    stacks: [], // Selected later
  },
  {
    id: 'exit',
    name: 'Exit',
    description: 'Cancel initialization without making changes',
    emoji: '[EXIT]',
    stacks: [],
  },
];

/**
 * Get preset by ID
 */
export function getPreset(id: string): Preset | undefined {
  return PRESETS.find((p) => p.id === id);
}

/**
 * Get recommended presets
 */
export function getRecommendedPresets(): Preset[] {
  return PRESETS.filter((p) => p.recommended);
}

/**
 * Get all available stacks
 */
export function getAvailableStacks(): Stack[] {
  return STACKS;
}

/**
 * Validate stack IDs
 */
export function validateStacks(stackIds: string[]): { valid: string[]; invalid: string[] } {
  const valid: string[] = [];
  const invalid: string[] = [];

  stackIds.forEach((id) => {
    if (STACKS.some((s) => s.id === id)) {
      valid.push(id);
    } else {
      invalid.push(id);
    }
  });

  return { valid, invalid };
}
