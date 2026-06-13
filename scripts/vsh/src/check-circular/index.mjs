import { access, mkdtemp, readFile, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { extname, join } from 'node:path';

import { execa, getStagedFiles } from '@vben/node-utils';

const require = createRequire(import.meta.url);
const circularScannerCli =
  require.resolve('circular-dependency-scanner/dist/cli.js');

const DEFAULT_CONFIG = {
  allowedExtensions: ['.cjs', '.js', '.jsx', '.mjs', '.ts', '.tsx', '.vue'],
  ignoreDirs: [
    'dist',
    '.turbo',
    'output',
    '.cache',
    'scripts',
    'internal',
    'src/effects/request/',
    'src/core/ui/menu/',
    'src/core/ui/popup/',
  ],
  threshold: 0,
};

const cache = new Map();

async function detectCircularDependencies({ cwd, ignorePattern, staged }) {
  const tempDir = await mkdtemp(join(tmpdir(), 'vsh-check-circular-'));
  const outputFile = join(tempDir, 'circles.json');

  try {
    const args = [circularScannerCli, cwd, '--output', outputFile];

    if (staged) {
      args.push('--absolute');
    }

    args.push('--ignore', ignorePattern);

    await execa(process.execPath, args, {
      cwd,
    });

    await access(outputFile);
    const output = await readFile(outputFile, 'utf8');
    return JSON.parse(output);
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return [];
    }
    throw error;
  } finally {
    await rm(tempDir, { force: true, recursive: true });
  }
}

function formatCircles(circles) {
  if (circles.length === 0) {
    console.log('✅ No circular dependencies found');
    return;
  }

  console.log('⚠️ Circular dependencies found:');
  circles.forEach((circle, index) => {
    console.log(`\nCircular dependency #${index + 1}:`);
    circle.forEach((file) => console.log(`  → ${file}`));
  });
}

async function checkCircular({ config = {}, staged, verbose }) {
  try {
    const finalConfig = {
      ...DEFAULT_CONFIG,
      ...config,
    };

    const ignorePattern = `**/{${finalConfig.ignoreDirs.join(',')}}/**`;
    const cacheKey = `${staged}-${process.cwd()}-${ignorePattern}`;

    if (cache.has(cacheKey)) {
      const cachedResults = cache.get(cacheKey);

      if (cachedResults && verbose) {
        formatCircles(cachedResults);
      }
      return;
    }

    const results = await detectCircularDependencies({
      cwd: process.cwd(),
      ignorePattern,
      staged,
    });

    if (staged) {
      let files = await getStagedFiles();
      const allowedExtensions = new Set(finalConfig.allowedExtensions);

      files = files.filter((file) => allowedExtensions.has(extname(file)));

      const circularFiles = [];

      for (const file of files) {
        for (const result of results) {
          const resultFiles = result.flat();

          if (resultFiles.includes(file)) {
            circularFiles.push(result);
          }
        }
      }

      cache.set(cacheKey, circularFiles);

      if (verbose) {
        formatCircles(circularFiles);
      }
    } else {
      cache.set(cacheKey, results);

      if (verbose) {
        formatCircles(results);
      }
    }

    if (results.length > 0) {
      console.log(
        '\n⚠️ Warning: Circular dependencies found, please check and fix',
      );
    }
  } catch (error) {
    console.error(
      '❌ Error checking circular dependencies:',
      error instanceof Error ? error.message : error,
    );
  }
}

function defineCheckCircularCommand(cac) {
  cac
    .command('check-circular')
    .option('--staged', 'Only check staged files')
    .option('--verbose', 'Show detailed information')
    .option('--threshold <number>', 'Threshold for circular dependencies', {
      default: 0,
    })
    .option('--ignore-dirs <dirs>', 'Directories to ignore, comma separated')
    .usage('Analyze project circular dependencies')
    .action(async ({ ignoreDirs, staged, threshold, verbose }) => {
      const config = {
        threshold: Number(threshold),
        ...(ignoreDirs && { ignoreDirs: ignoreDirs.split(',') }),
      };

      await checkCircular({
        config,
        staged,
        verbose: verbose ?? true,
      });
    });
}

export { defineCheckCircularCommand };
