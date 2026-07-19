import { describe, expect, it } from 'vitest';

import { isHttpResponse } from '../response';

describe('isHttpResponse', () => {
  it('accepts the strict API response envelope', () => {
    expect(
      isHttpResponse({ code: 200, data: { rows: [], total: 0 }, msg: '' }),
    ).toBe(true);
    expect(isHttpResponse({ code: 200, data: null, msg: '成功' })).toBe(true);
  });

  it.each([
    null,
    '<!doctype html>',
    [],
    { code: 200, data: null },
    { code: 200, data: null, extra: true, msg: 'success' },
    { code: '200', data: null, msg: 'success' },
    { code: 200, data: null, msg: null },
    { code: 200, msg: 'success' },
    { data: null, msg: 'success' },
  ])('rejects a non-envelope response: %j', (value) => {
    expect(isHttpResponse(value)).toBe(false);
  });
});
