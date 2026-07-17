import type { HttpResponse } from './type';

function isHttpResponse(value: unknown): value is HttpResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Reflect.has(value, 'code') &&
    Reflect.has(value, 'msg') &&
    Reflect.has(value, 'data')
  );
}

export { isHttpResponse };
