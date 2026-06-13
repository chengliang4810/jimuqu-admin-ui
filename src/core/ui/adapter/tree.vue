<script lang="ts" setup>
import type { Arrayable } from '@vueuse/core';

import type { ClassType, Recordable } from '@/core/typings';

import type { FlattenedItem, TreeProps } from './tree';

import { computed, h, ref, useSlots, watchEffect } from 'vue';

import { cn, get } from '@/core/shared/utils';

import { Tree } from 'antdv-next';

import VbenIcon from './icon.vue';
import { treePropsDefaults } from './tree';

const props = withDefaults(defineProps<TreeProps>(), treePropsDefaults());

const emits = defineEmits<{
  expand: [value: FlattenedItem<Recordable<any>>];
  select: [value: FlattenedItem<Recordable<any>>];
}>();

const modelValue = defineModel<Arrayable<number | string>>();
const expandedKeys = ref<Array<number | string>>(props.defaultExpandedKeys);
const slots = useSlots();

const fieldNames = computed(() => {
  return {
    children: props.childrenField,
    key: props.valueField,
    title: props.labelField,
  };
});

const flattenData = computed(() => {
  return flatten(props.treeData, props.childrenField);
});

const selectedKeys = computed(() => {
  if (props.multiple) {
    return [];
  }

  const value = modelValue.value ?? props.defaultValue;
  if (Array.isArray(value)) {
    return value;
  }

  return value === undefined ? [] : [value];
});

const checkedKeys = computed(() => {
  const value = modelValue.value ?? props.defaultValue;
  if (Array.isArray(value)) {
    return value;
  }

  return value === undefined ? [] : [value];
});

watchEffect(() => {
  if (props.defaultExpandedLevel && props.defaultExpandedLevel > 0) {
    expandToLevel(props.defaultExpandedLevel);
  }
});

function flatten<T = Recordable<any>, P = number | string>(
  items: T[],
  childrenField = 'children',
  level = 0,
  parentId: null | P = null,
  parents: P[] = [],
): Array<FlattenedItem<T, P>> {
  const result: Array<FlattenedItem<T, P>> = [];

  items.forEach((item) => {
    const children = get(item, childrenField) as T[] | undefined;
    const id = get(item, props.valueField) as P;
    const val: FlattenedItem<T, P> = {
      _id: id,
      bind: {},
      hasChildren: Array.isArray(children) && children.length > 0,
      id,
      level,
      parentId,
      parents: [...parents],
      value: item,
    };

    result.push(val);
    if (val.hasChildren && children) {
      result.push(
        ...flatten(children, childrenField, level + 1, id, [...parents, id]),
      );
    }
  });

  return result;
}

function getItemByValue(value: number | string) {
  return flattenData.value.find((item) => item.id === value)?.value;
}

function getFlattenedItem(node: Recordable<any>) {
  const value = get(node, props.valueField) as number | string;
  const item = flattenData.value.find((item) => item.id === value);
  if (item) {
    return item;
  }

  return {
    _id: value,
    bind: {},
    hasChildren: Array.isArray(get(node, props.childrenField)),
    id: value,
    level: 0,
    parentId: null,
    parents: [],
    value: node,
  };
}

function isNodeDisabled(node: Recordable<any>) {
  return props.disabled || get(node, props.disabledField);
}

function normalizeCheckedKeys(keys: unknown) {
  if (Array.isArray(keys)) {
    return keys as Array<number | string>;
  }

  if (keys && typeof keys === 'object' && 'checked' in keys) {
    return (keys as { checked: Array<number | string> }).checked;
  }

  return [];
}

function updateModelValue(keys: Array<number | string>) {
  modelValue.value = props.multiple ? keys : keys[0];
}

function onSelect(keys: Array<number | string>, info: Recordable<any>) {
  if (props.multiple) {
    return;
  }

  const key = keys[0];
  if (!props.allowClear && key === undefined) {
    return;
  }

  updateModelValue(keys);
  emits('select', getFlattenedItem(info.node));
}

function onCheck(keys: unknown, info: Recordable<any>) {
  const normalizedKeys = normalizeCheckedKeys(keys);
  updateModelValue(normalizedKeys);
  emits('select', getFlattenedItem(info.node));
}

function onExpand(keys: Array<number | string>, info: Recordable<any>) {
  expandedKeys.value = keys;
  emits('expand', getFlattenedItem(info.node));
}

function expandToLevel(level: number) {
  expandedKeys.value = flattenData.value
    .filter((item) => item.level <= level - 1 && item.hasChildren)
    .map((item) => item.id);
}

function collapseNodes(value: Arrayable<number | string>) {
  const keys = new Set(Array.isArray(value) ? value : [value]);
  expandedKeys.value = expandedKeys.value.filter((key) => !keys.has(key));
}

function expandNodes(value: Arrayable<number | string>) {
  const keys = Array.isArray(value) ? value : [value];
  keys.forEach((key) => {
    if (!expandedKeys.value.includes(key)) {
      expandedKeys.value.push(key);
    }
  });
}

function expandAll() {
  expandedKeys.value = flattenData.value
    .filter((item) => item.hasChildren)
    .map((item) => item.id);
}

function collapseAll() {
  expandedKeys.value = [];
}

function checkAll() {
  if (!props.multiple) {
    return;
  }

  modelValue.value = flattenData.value
    .filter((item) => !get(item.value, props.disabledField))
    .map((item) => item.id);
}

function unCheckAll() {
  if (!props.multiple) {
    return;
  }

  modelValue.value = [];
}

function renderTitle(node: Recordable<any>) {
  const flattenedItem = getFlattenedItem(node);
  const title = get(node, props.labelField);
  const children = slots.node?.(flattenedItem) ?? [
    props.showIcon && get(node, props.iconField)
      ? h(VbenIcon, {
          class: 'size-4',
          icon: get(node, props.iconField),
        })
      : null,
    h('span', { class: 'truncate' }, title),
  ];

  return h(
    'div',
    {
      class: cn(
        'flex min-w-0 items-center gap-1',
        props.getNodeClass?.(flattenedItem),
        {
          'text-foreground/50 cursor-not-allowed': isNodeDisabled(node),
        },
      ),
      title,
    },
    children,
  );
}

defineExpose({
  checkAll,
  collapseAll,
  collapseNodes,
  expandAll,
  expandNodes,
  expandToLevel,
  getItemByValue,
  unCheckAll,
});
</script>

<template>
  <div
    :class="
      cn(
        'text-blackA11 container list-none rounded-lg text-sm font-medium select-none',
        $attrs.class as unknown as ClassType,
        bordered ? 'border' : '',
      )
    "
  >
    <div
      v-if="$slots.header"
      :class="cn('my-0.5 flex w-full items-center p-1', bordered ? 'border-b' : '')"
    >
      <slot name="header"></slot>
    </div>

    <Tree
      :check-strictly="checkStrictly"
      :checkable="multiple"
      :checked-keys="checkedKeys"
      :disabled="disabled"
      :expanded-keys="expandedKeys"
      :field-names="fieldNames"
      :multiple="multiple"
      :selectable="!multiple"
      :selected-keys="selectedKeys"
      :title-render="renderTitle"
      :tree-data="treeData"
      block-node
      @check="onCheck"
      @expand="onExpand"
      @select="onSelect"
    />

    <div
      v-if="$slots.footer"
      :class="cn('my-0.5 flex w-full items-center p-1', bordered ? 'border-t' : '')"
    >
      <slot name="footer"></slot>
    </div>
  </div>
</template>
