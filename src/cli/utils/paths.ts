import path from 'path';

// Compiled to dist/utils/paths.js, so ../.. is the package root that ships src/core and src/stacks.
export const PACKAGE_ROOT = path.join(__dirname, '../..');
export const CORE_SOURCE = path.join(PACKAGE_ROOT, 'src/core');
export const STACKS_SOURCE = path.join(PACKAGE_ROOT, 'src/stacks');
