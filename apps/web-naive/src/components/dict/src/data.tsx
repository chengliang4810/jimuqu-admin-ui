import type { VNode } from 'vue';

import TagType, { NTag } from 'naive-ui';

type type = 'default' | 'error' | 'info' | 'primary' | 'success' | 'warning';

interface TagType {
  [key: string]: { color: type; label: string };
}

// 'default' | 'primary' | 'info' | 'success' | 'warning' | 'error'
export const tagTypes: TagType = {
  danger: { color: 'error', label: '危险(danger)' },
  /** 由于和elementUI不同 用于替换颜色 */
  default: { color: 'default', label: '默认(default)' },
  green: { color: 'success', label: 'green' },
  info: { color: 'default', label: '信息(info)' },
  orange: { color: 'warning', label: 'orange' },
  /** 自定义预设 color可以为16进制颜色 */
  primary: { color: 'primary', label: '主要(primary)' },
  red: { color: 'error', label: 'red' },
  success: { color: 'success', label: '成功(success)' },
  warning: { color: 'warning', label: '警告(warning)' },
};

// 字典选择使用 { label: string; value: string }[]
interface Options {
  label: string | VNode;
  value: string;
}

export function tagSelectOptions() {
  const selectArray: Options[] = [];
  Object.keys(tagTypes).forEach((key) => {
    if (!tagTypes[key]) return;
    const label = tagTypes[key].label;
    const color = tagTypes[key].color;
    selectArray.push({
      label: <NTag type={color}>{label}</NTag>,
      value: key,
    });
  });
  return selectArray;
}
