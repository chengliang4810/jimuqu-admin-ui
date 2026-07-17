import type { APIResponse, Page, Response } from 'playwright/test';

import { expect } from 'playwright/test';

export interface ApiEnvelope<T> {
  code: number;
  data: T;
  msg: string;
}

export interface PageData<T> {
  rows: T[];
  total: number;
}

type PathMatcher = RegExp | string;
type JsonResponse = APIResponse | Response;

function matchesPath(response: Response, matcher: PathMatcher) {
  const { pathname } = new URL(response.url());
  if (matcher instanceof RegExp) {
    return matcher.test(pathname);
  }
  return pathname === matcher || pathname.endsWith(matcher);
}

export function waitForApiResponse(
  page: Page,
  method: string,
  path: PathMatcher,
) {
  return page.waitForResponse(
    (response) =>
      response.request().method() === method && matchesPath(response, path),
  );
}

export async function expectSuccessEnvelope<T>(
  response: JsonResponse,
  operation: string,
): Promise<ApiEnvelope<T>> {
  expect(response.ok(), `${operation} HTTP ${response.status()}`).toBe(true);
  expect(
    response.headers()['content-type'],
    `${operation} must return JSON`,
  ).toContain('application/json');

  const body: unknown = await response.json();
  expect(body, `${operation} response envelope`).toEqual(
    expect.objectContaining({
      code: 200,
      msg: expect.any(String),
    }),
  );
  expect(
    Object.prototype.hasOwnProperty.call(body, 'data'),
    `${operation} response must include data`,
  ).toBe(true);

  return body as ApiEnvelope<T>;
}

export async function expectPageEnvelope<T>(
  response: JsonResponse,
  operation: string,
): Promise<ApiEnvelope<PageData<T>>> {
  const envelope = await expectSuccessEnvelope<PageData<T>>(
    response,
    operation,
  );
  expect(Array.isArray(envelope.data.rows), `${operation} data.rows`).toBe(
    true,
  );
  expect(typeof envelope.data.total, `${operation} data.total`).toBe('number');
  return envelope;
}
