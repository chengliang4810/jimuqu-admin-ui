import type { DictData } from '@/api/system/dict/dict-data-model';

import type { VNode } from 'vue';

import { mount } from '@vue/test-utils';

import { describe, expect, it, vi } from 'vitest';

import { DictTag } from '..';

vi.mock('antdv-next', async () => {
  const { h } = await import('vue');

  return {
    // 测试仅验证字典组件传递给 Tag 的颜色和样式变体
    Spin: () => h('span'),
    Tag: (
      props: { color?: string; variant?: string },
      { slots }: { slots: { default?: () => VNode[] } },
    ) =>
      h(
        'span',
        {
          class: [
            'ant-tag',
            `ant-tag-${props.variant}`,
            `ant-tag-${props.color}`,
          ],
        },
        slots.default?.(),
      ),
  };
});

const normalDict = {
  createBy: '',
  createTime: '',
  cssClass: '',
  default: true,
  dictCode: 1,
  dictLabel: '正常',
  dictSort: 1,
  dictType: 'sys_normal_disable',
  dictValue: '0',
  isDefault: 'Y',
  listClass: 'primary',
  remark: '',
  status: '0',
} satisfies DictData;

describe('字典标签', () => {
  it('使用实心样式展示有颜色的字典项', () => {
    const wrapper = mount(DictTag, {
      props: {
        dicts: [normalDict],
        value: '0',
      },
    });

    const tag = wrapper.get('.ant-tag');
    expect(tag.text()).toBe('正常');
    expect(tag.classes()).toContain('ant-tag-solid');
    expect(tag.classes()).toContain('ant-tag-processing');
  });
});
