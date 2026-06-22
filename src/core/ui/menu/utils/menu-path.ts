import type { MenuRecordRaw } from '@/types';

/**
 * 构建菜单路径映射，从 menu.path 到其所有父级路径链
 * 用于替代旧的 findComponentUpward 遍历方式
 *
 * @example
 * 输入: [{ path: 'a', children: [{ path: 'b' }] }]
 * 输出: Map { 'a' => [], 'b' => ['a'] }
 */
export function buildMenuPathMap(
  menus: MenuRecordRaw[],
): Map<string, string[]> {
  const map = new Map<string, string[]>();

  function walk(items: MenuRecordRaw[], parentPaths: string[]) {
    for (const item of items) {
      if (item.path) {
        map.set(item.path, [...parentPaths]);
      }
      if (item.children?.length) {
        walk(item.children, [...parentPaths, item.path]);
      }
    }
  }

  walk(menus, []);
  return map;
}
