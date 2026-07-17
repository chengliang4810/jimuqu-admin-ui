import { describe, expect, it } from 'vitest';

import { createApiProxy } from '../api-proxy';

describe('createApiProxy', () => {
  it('rewrites the production API prefix for a same-origin preview', () => {
    const proxy = createApiProxy('/prod-api', 'http://127.0.0.1:15320')[
      '/prod-api'
    ];

    expect(proxy).toMatchObject({
      changeOrigin: true,
      target: 'http://127.0.0.1:15320',
      ws: true,
    });
    expect(proxy?.rewrite?.('/prod-api/auth/login')).toBe('/auth/login');
  });
});
