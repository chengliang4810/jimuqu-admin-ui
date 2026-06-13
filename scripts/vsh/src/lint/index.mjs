import { execSync } from 'node:child_process';

import { execaCommand } from '@vben/node-utils';

async function runLint({ format }) {
  if (format) {
    await execaCommand(`stylelint "**/*.{vue,css,less,scss}" --cache --fix`, {
      stdio: 'inherit',
    });
    await execaCommand(`prettier . --write --cache --log-level warn`, {
      stdio: 'inherit',
    });
    await execaCommand(`eslint . --cache --fix`, {
      stdio: 'inherit',
    });
    return;
  }

  const subprocesses = [
    execaCommand(`prettier . --check --cache --log-level warn`, {
      stdio: 'inherit',
    }),
    execaCommand(`eslint . --cache`, { stdio: 'inherit' }),
    execaCommand(`stylelint "**/*.{vue,css,less,scss}" --cache`, {
      stdio: 'inherit',
    }),
  ];

  try {
    await Promise.all(subprocesses);
  } catch (error) {
    for (const subprocess of subprocesses) {
      try {
        if (process.platform === 'win32' && subprocess.pid) {
          execSync(`taskkill /F /T /PID ${subprocess.pid}`, {
            stdio: 'ignore',
          });
        } else {
          subprocess.kill('SIGKILL');
        }
      } catch {
        // process may have already exited
      }
    }

    await Promise.allSettled(subprocesses);
    throw error;
  }
}

function defineLintCommand(cac) {
  cac
    .command('lint')
    .usage('Batch execute project lint check.')
    .option('--format', 'Format lint problem.')
    .action(runLint);
}

export { defineLintCommand };
