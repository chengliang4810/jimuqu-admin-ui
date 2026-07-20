import { afterEach, describe, expect, it } from 'vitest';

import { loadEnv } from '../env';

const authContractVariables = [
  'VITE_GLOB_APP_CLIENT_ID',
  'VITE_GLOB_ENABLE_ENCRYPT',
  'VITE_GLOB_RSA_PRIVATE_KEY',
  'VITE_GLOB_RSA_PUBLIC_KEY',
] as const;
const testVariables = ['VITE_GLOB_API_URL', ...authContractVariables] as const;
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

  it('keeps every build mode on the production authentication contract', async () => {
    for (const key of testVariables) {
      Reflect.deleteProperty(process.env, key);
    }
    const production = await loadEnv('VITE_GLOB_', ['.env.production']);
    const expected = Object.fromEntries(
      authContractVariables.map((key) => [key, production[key]]),
    );

    expect(expected.VITE_GLOB_ENABLE_ENCRYPT).toBe('true');
    expect(expected.VITE_GLOB_APP_CLIENT_ID).toBeTruthy();
    for (const mode of ['development', 'test', 'analyze']) {
      const env = await loadEnv('VITE_GLOB_', [`.env.${mode}`]);
      expect(
        Object.fromEntries(authContractVariables.map((key) => [key, env[key]])),
      ).toEqual(expected);
    }
  });
});
