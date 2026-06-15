import { spawn } from 'node:child_process';

/**
 * 运行单个命令,继承当前进程的 stdio。
 * 使用 shell 模式以便解析 node_modules/.bin 中的可执行文件,
 * 并保证 glob 模式(被引号包裹)不会被 shell 提前展开。
 * @param {string} command - 完整命令字符串
 * @returns {Promise<void>}
 */
function run(command) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, {
      shell: true,
      stdio: 'inherit',
    });

    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed (exit ${code}): ${command}`));
      }
    });
  });
}

async function runLint({ format }) {
  if (format) {
    // 修复模式:串行执行,避免多个 linter 同时改写文件产生冲突。
    await run(`stylelint "**/*.{vue,css,less,scss}" --cache --fix`);
    await run(`prettier . --write --cache --log-level warn`);
    await run(`eslint . --cache --fix`);
    return;
  }

  const subprocesses = [
    run(`prettier . --check --cache --log-level warn`),
    run(`eslint . --cache`),
    run(`stylelint "**/*.{vue,css,less,scss}" --cache`),
  ];

  // 等待全部 linter 跑完再汇总结果,避免某个 linter 先失败时
  // Promise.all 短路并 kill 掉其它仍在运行的进程,导致它们的报错丢失。
  const results = await Promise.allSettled(subprocesses);
  const failed = results.some((result) => result.status === 'rejected');

  if (failed) {
    process.exitCode = 1;
  }
}

runLint({ format: process.argv.includes('--format') });
