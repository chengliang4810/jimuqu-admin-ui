import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('release workflow', () => {
  const workflow = readFileSync(
    resolve(process.cwd(), '.github/workflows/release.yml'),
    'utf8',
  ).replaceAll('\r\n', '\n');

  it('runs every frontend quality gate before packaging assets', () => {
    const commands = [
      'pnpm install --frozen-lockfile',
      'pnpm typecheck',
      'pnpm lint',
      'pnpm test:unit',
      'pnpm build',
    ];

    let previousIndex = -1;
    for (const command of commands) {
      const index = workflow.indexOf(command);
      expect(index, `${command} must be present`).toBeGreaterThan(
        previousIndex,
      );
      previousIndex = index;
    }
    expect(workflow).not.toContain(
      'pnpm install --frozen-lockfile && pnpm build',
    );
  });

  it('publishes from dev only without container images', () => {
    expect(workflow).toContain('push:\n    branches:\n      - dev\n');
    expect(workflow).not.toContain('\n      - main\n');
    expect(workflow).not.toMatch(/docker|ghcr/i);
  });
});
