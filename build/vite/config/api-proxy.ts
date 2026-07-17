import type { ProxyOptions } from 'vite';

type ApiProxyPrefix = '/dev-api' | '/prod-api';

function createApiProxy(
  prefix: ApiProxyPrefix,
  target: string,
): Record<string, ProxyOptions> {
  return {
    [prefix]: {
      changeOrigin: true,
      rewrite: (path) => path.replace(new RegExp(`^${prefix}`), ''),
      target,
      ws: true,
    },
  };
}

export { createApiProxy };
