import type { HttpResponse } from './type';

function isHttpResponse(value: unknown): value is HttpResponse {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  const keys = Object.keys(value);
  return (
    keys.length === 3 &&
    keys.every((key) => ['code', 'data', 'msg'].includes(key)) &&
    Reflect.has(value, 'data') &&
    typeof Reflect.get(value, 'code') === 'number' &&
    typeof Reflect.get(value, 'msg') === 'string'
  );
}

export { isHttpResponse };
