import { expect, test } from './fixtures';
import { expectSuccessEnvelope, waitForApiResponse } from './helpers/api';
import { loginThroughUi } from './helpers/auth';
import { openUserManagement } from './helpers/navigation';

interface VisibleUser {
  userName: string;
}

const scopes = [
  {
    expected: [
      'admin',
      'custom_user',
      'dept_child_user',
      'dept_user',
      'disabled_user',
      'no_permission',
      'self_user',
    ],
    label: 'all data',
    username: 'admin',
  },
  {
    expected: ['self_user'],
    label: 'custom department',
    username: 'custom_user',
  },
  {
    expected: ['admin', 'custom_user', 'dept_child_user', 'dept_user'],
    label: 'current department',
    username: 'dept_user',
  },
  {
    expected: [
      'admin',
      'custom_user',
      'dept_child_user',
      'dept_user',
      'self_user',
    ],
    label: 'department and descendants',
    username: 'dept_child_user',
  },
  {
    expected: ['self_user'],
    label: 'current user only',
    username: 'self_user',
  },
];

for (const scope of scopes) {
  test(`${scope.label} role sees only its permitted users through the UI`, async ({
    page,
  }) => {
    const menuResponsePromise = waitForApiResponse(
      page,
      'GET',
      '/system/menu/getRouters',
    );
    await loginThroughUi(page, {
      password: 'admin123',
      username: scope.username,
    });
    const menuEnvelope = await expectSuccessEnvelope<unknown[]>(
      await menuResponsePromise,
      `${scope.username} dynamic menu`,
    );
    expect(JSON.stringify(menuEnvelope.data)).toContain('用户管理');

    const listEnvelope = await openUserManagement(page);
    const users = listEnvelope.data.rows as VisibleUser[];
    const visibleNames = users
      .map((user) => user.userName)
      .toSorted((left, right) => left.localeCompare(right));
    expect(visibleNames).toEqual(scope.expected);
    expect(listEnvelope.data.total).toBe(scope.expected.length);
    await expect(page.getByText('用户列表', { exact: true })).toBeVisible();
  });
}
