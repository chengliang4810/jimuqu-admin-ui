import { expect, test } from './fixtures';
import { openUserManagement } from './helpers/navigation';

test('backend dynamic menu opens the user management page', async ({
  authenticatedSession,
}) => {
  const { menuEnvelope, page } = authenticatedSession;

  const serializedMenu = JSON.stringify(menuEnvelope.data);
  expect(serializedMenu).toContain('系统管理');
  expect(serializedMenu).toContain('用户管理');

  for (const marker of [
    'workflow/',
    'tool/gen',
    'ai/chat',
    'snailjob',
    'snailai',
    'monitor/admin',
    '工作流',
    '代码生成',
    '定时任务',
  ]) {
    expect(
      serializedMenu.toLowerCase(),
      `dynamic menu must exclude ${marker}`,
    ).not.toContain(marker.toLowerCase());
  }

  const listEnvelope = await openUserManagement(page);
  expect(listEnvelope.data.rows.length).toBeGreaterThan(0);
  expect(listEnvelope.data.total).toBeGreaterThan(0);
});
