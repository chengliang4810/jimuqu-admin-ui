import type { Page, Request, Response } from 'playwright/test';

import type { ApiEnvelope } from './helpers/api';
import type { LoginResult } from './helpers/auth';

import { test as base, expect } from 'playwright/test';

import { expectSuccessEnvelope, waitForApiResponse } from './helpers/api';
import { loginThroughUi } from './helpers/auth';

interface BrowserIssue {
  detail: string;
  kind:
    | 'console.error'
    | 'http.5xx'
    | 'pageerror'
    | 'request.failed'
    | 'resource.http';
}

const resourceTypes = new Set(['font', 'image', 'script', 'stylesheet']);

export interface AuthenticatedSession {
  accessToken: string;
  loginEnvelope: ApiEnvelope<LoginResult>;
  loginResponse: Response;
  menuEnvelope: ApiEnvelope<unknown[]>;
  menuResponse: Response;
  page: Page;
}

interface E2EFixtures {
  authenticatedPage: Page;
  authenticatedSession: AuthenticatedSession;
}

export const test = base.extend<E2EFixtures>({
  page: async ({ page }, use, testInfo) => {
    const issues: BrowserIssue[] = [];
    const onConsole = (message: { text(): string; type(): string }) => {
      if (message.type() === 'error') {
        issues.push({ detail: message.text(), kind: 'console.error' });
      }
    };
    const onPageError = (error: Error) => {
      issues.push({ detail: error.stack ?? error.message, kind: 'pageerror' });
    };
    const onRequestFailed = (request: Request) => {
      if (!resourceTypes.has(request.resourceType())) return;
      issues.push({
        detail: `${request.method()} ${request.url()} ${request.failure()?.errorText ?? 'failed'}`,
        kind: 'request.failed',
      });
    };
    const onResponse = (response: Response) => {
      if (response.status() >= 500) {
        issues.push({
          detail: `${response.status()} ${response.request().method()} ${response.url()}`,
          kind: 'http.5xx',
        });
      } else if (
        response.status() >= 400 &&
        resourceTypes.has(response.request().resourceType())
      ) {
        issues.push({
          detail: `${response.status()} ${response.request().resourceType()} ${response.url()}`,
          kind: 'resource.http',
        });
      }
    };

    page.on('console', onConsole);
    page.on('pageerror', onPageError);
    page.on('requestfailed', onRequestFailed);
    page.on('response', onResponse);

    try {
      await use(page);
    } finally {
      page.off('console', onConsole);
      page.off('pageerror', onPageError);
      page.off('requestfailed', onRequestFailed);
      page.off('response', onResponse);

      if (issues.length > 0) {
        await testInfo.attach('browser-diagnostics.json', {
          body: JSON.stringify(issues, null, 2),
          contentType: 'application/json',
        });
        expect
          .soft(issues, 'browser must have no console/page/5xx errors')
          .toEqual([]);
      }
    }
  },

  authenticatedSession: async ({ page }, use) => {
    const menuResponsePromise = waitForApiResponse(
      page,
      'GET',
      '/system/menu/getRouters',
    );
    const { envelope: loginEnvelope, response: loginResponse } =
      await loginThroughUi(page);
    const menuResponse = await menuResponsePromise;
    const menuEnvelope = await expectSuccessEnvelope<unknown[]>(
      menuResponse,
      'dynamic menu',
    );
    expect(Array.isArray(menuEnvelope.data), 'dynamic menu data').toBe(true);

    await use({
      accessToken: loginEnvelope.data.access_token,
      loginEnvelope,
      loginResponse,
      menuEnvelope,
      menuResponse,
      page,
    });
  },

  authenticatedPage: async ({ authenticatedSession }, use) => {
    await use(authenticatedSession.page);
  },
});

export { expect };
