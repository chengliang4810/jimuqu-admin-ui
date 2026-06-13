import { colors, consola } from '@vben/node-utils';
import { cac } from 'cac';

import packageJson from '../package.json' with { type: 'json' };
import { defineCheckCircularCommand } from './check-circular/index.mjs';
import { defineCheckDepCommand } from './check-dep/index.mjs';
import { defineCodeWorkspaceCommand } from './code-workspace/index.mjs';
import { defineLintCommand } from './lint/index.mjs';
import { definePubLintCommand } from './publint/index.mjs';

const COMMAND_DESCRIPTIONS = {
  'check-circular': 'Check for circular dependencies',
  'check-dep': 'Check for unused dependencies',
  'code-workspace': 'Manage VS Code workspace settings',
  lint: 'Run linting on the project',
  publint: 'Check package.json files for publishing standards',
};

const { version } = packageJson;

async function main() {
  try {
    const vsh = cac('vsh');

    defineLintCommand(vsh);
    definePubLintCommand(vsh);
    defineCodeWorkspaceCommand(vsh);
    defineCheckCircularCommand(vsh);
    defineCheckDepCommand(vsh);

    vsh.usage('vsh <command> [options]');
    vsh.help();
    vsh.version(version);

    vsh.parse(undefined, { run: false });

    if (!vsh.matchedCommand && vsh.args.length > 0) {
      const unknownCmd = String(vsh.args[0]);

      consola.error(
        colors.red(`Invalid command: ${unknownCmd}`),
        '\n',
        colors.yellow('Available commands:'),
        '\n',
        Object.entries(COMMAND_DESCRIPTIONS)
          .map(([name, desc]) => `  ${colors.cyan(name)} - ${desc}`)
          .join('\n'),
      );
      process.exit(1);
    }

    await vsh.runMatchedCommand();
  } catch (error) {
    consola.error(
      colors.red('An unexpected error occurred:'),
      '\n',
      error instanceof Error ? error.message : error,
    );
    process.exit(1);
  }
}

main().catch((error) => {
  consola.error(
    colors.red('Failed to start CLI:'),
    '\n',
    error instanceof Error ? error.message : error,
  );
  process.exit(1);
});
