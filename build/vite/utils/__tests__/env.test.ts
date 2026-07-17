import { afterEach, describe, expect, it } from 'vitest';

import { loadEnv } from '../env';

const testVariables = [
  'VITE_GLOB_API_URL',
  'VITE_GLOB_ENABLE_ENCRYPT',
] as const;
const originalValues = Object.fromEntries(
  testVariables.map((key) => [key, process.env[key]]),
);

afterEach(() => {
  for (const key of testVariables) {
    const value = originalValues[key];
    if (value === undefined) {
      Reflect.deleteProperty(process.env, key);
    } else {
      process.env[key] = value;
    }
  }
});

describe('loadEnv', () => {
  it('lets process variables override production env files', async () => {
    process.env.VITE_GLOB_API_URL = 'http://127.0.0.1:15320';
    process.env.VITE_GLOB_ENABLE_ENCRYPT = 'false';

    const env = await loadEnv('VITE_GLOB_', ['.env.production']);

    expect(env.VITE_GLOB_API_URL).toBe('http://127.0.0.1:15320');
    expect(env.VITE_GLOB_ENABLE_ENCRYPT).toBe('false');
  });
});
