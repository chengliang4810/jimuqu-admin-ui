import type { ClassType } from '@/core/typings';

import { cn } from '@/core/shared/utils';

interface ExtractWidthResult {
  /** 去掉宽度类后剩余的 class */
  rest: string;
  /** 提取出的宽度(用于 antd 的 width 属性) */
  width?: number | string;
}

/**
 * vben 弹窗/抽屉历史上通过 tailwind 的 `w-[600px]`、`w-130`、`w-full` 等 class 设置宽度，
 * 而 antd Modal/Drawer 的宽度由 `width` 属性(内联 style，优先级高于 class)控制。
 * 这里把 class 中的宽度令牌提取出来转成 antd 的 width，并返回剩余 class。
 */
export function extractWidthFromClass(classValue: ClassType): ExtractWidthResult {
  const classStr = cn(classValue);
  if (!classStr) {
    return { rest: '' };
  }
  const tokens = classStr.split(/\s+/).filter(Boolean);
  let width: number | string | undefined;
  const rest: string[] = [];

  for (const token of tokens) {
    // w-[800px] / w-[60%] / w-[50vw]
    const arbitrary = token.match(/^!?w-\[(.+)]$/);
    if (arbitrary) {
      width = arbitrary[1];
      continue;
    }
    // w-full
    if (token === 'w-full' || token === '!w-full') {
      width = '100%';
      continue;
    }
    // w-130 等数值刻度(tailwind: n * 0.25rem = n * 4px)
    const scale = token.match(/^!?w-(\d+(?:\.\d+)?)$/);
    if (scale) {
      width = Number(scale[1]) * 4;
      continue;
    }
    rest.push(token);
  }

  return { rest: rest.join(' '), width };
}
