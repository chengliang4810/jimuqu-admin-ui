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

  // 等待全部 linter 跑完再汇总结果,避免某个 linter 先失败时
  // Promise.all 短路并 kill 掉其它仍在运行的进程,导致它们的报错丢失。
  const results = await Promise.allSettled(subprocesses);
  const failed = results.some((result) => result.status === 'rejected');

  if (failed) {
    process.exitCode = 1;
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
