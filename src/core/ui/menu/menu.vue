<script setup lang="ts">
import type { MenuRecordRaw } from '@/core/typings';

import type { MenuProps } from './types';

import { computed, provide, ref, watch } from 'vue';
import { Menu } from 'antdv-next';

import SubMenu from './sub-menu.vue';
import { useMenuScroll } from './hooks/use-menu-scroll';
import { buildMenuPathMap } from './utils/menu-path';

interface Props extends MenuProps {
  menus: MenuRecordRaw[];
}

defineOptions({
  name: 'MenuView',
});

const props = withDefaults(defineProps<Props>(), {
  accordion: true,
  collapse: false,
  defaultActive: '',
  defaultOpeneds: () => [],
  menus: () => [],
  mode: 'vertical',
  rounded: true,
  scrollToActive: false,
  theme: 'dark',
});

const emit = defineEmits<{
  close: [string, string[]];
  open: [string, string[]];
  select: [string, string[]];
}>();

// 激活的菜单项
const selectedKeys = ref<string[]>([props.defaultActive]);

// 展开的菜单项
const openKeys = ref<string[]>(props.collapse ? [] : [...props.defaultOpeneds]);

// 提供给子组件的激活路径
provide(
  'menuActivePath',
  computed(() => selectedKeys.value[0] || ''),
);

// 构建菜单路径映射
const menuPathMap = computed(() => buildMenuPathMap(props.menus));

function resolveOpenKeys(keys: string[]) {
  if (!props.accordion || props.mode === 'horizontal') {
    return keys;
  }

  const addedKeys = keys.filter((key) => !openKeys.value.includes(key));
  const latestKey = addedKeys.at(-1);

  if (!latestKey) {
    return keys;
  }

  const keepKeys = new Set([
    ...(menuPathMap.value.get(latestKey) || []),
    latestKey,
  ]);
  return keys.filter((key) => keepKeys.has(key));
}

// antdv-next mode 映射：vertical → inline（保留缩进和展开箭头）
const antdvMode = computed(() =>
  props.mode === 'horizontal' ? 'horizontal' : 'inline',
);

// antdv-next theme 只能为 'dark' | 'light'，'auto' 降级为 'light'
const antdvTheme = computed(() =>
  props.theme === 'auto' ? 'light' : props.theme,
);

// 主题 class（用于 rounded 等自定义）
const menuClass = computed(() => {
  const classes: string[] = [];
  if (props.rounded) {
    classes.push('menu-rounded');
  }
  return classes;
});

// 监听 collapse 变化，重置 openKeys
watch(
  () => props.collapse,
  (collapsed) => {
    if (collapsed) {
      openKeys.value = [];
    }
  },
);

// 监听 defaultActive 变化
watch(
  () => props.defaultActive,
  (active) => {
    if (active) {
      selectedKeys.value = [active];
      // 自动展开父级路径
      const parents = menuPathMap.value.get(active);
      if (parents?.length) {
        openKeys.value = props.accordion
          ? parents
          : [...new Set([...openKeys.value, ...parents])];
      }
    }
  },
  { immediate: true },
);

// 自动滚动到激活项
useMenuScroll(
  computed(() => selectedKeys.value[0]),
  {
    enable: computed(
      () =>
        props.scrollToActive && props.mode === 'vertical' && !props.collapse,
    ),
    delay: 320,
  },
);

// 处理菜单项选择
function handleSelect(info: { key: string; keyPath: string[] }) {
  const parents = menuPathMap.value.get(info.key) || info.keyPath.slice(1);
  emit('select', info.key, parents);
}

// 处理 submenu 展开/关闭，并在手风琴模式下收敛同级展开项
function handleOpenChange(keys: string[]) {
  const nextKeys = resolveOpenKeys(keys);
  const prevKeys = [...openKeys.value];
  const addedKeys = nextKeys.filter((k) => !prevKeys.includes(k));
  const removedKeys = prevKeys.filter((k) => !nextKeys.includes(k));

  // 处理新增展开
  for (const key of addedKeys) {
    const parents = menuPathMap.value.get(key) || [];
    emit('open', key, parents);
  }

  // 处理关闭
  for (const key of removedKeys) {
    const parents = menuPathMap.value.get(key) || [];
    emit('close', key, parents);
  }

  openKeys.value = nextKeys;
}
</script>

<template>
  <Menu
    v-model:selected-keys="selectedKeys"
    :class="menuClass"
    :inline-collapsed="collapse"
    :mode="antdvMode"
    :open-keys="openKeys"
    :theme="antdvTheme"
    :trigger-sub-menu-action="collapse ? 'hover' : 'click'"
    @open-change="handleOpenChange"
    @select="handleSelect"
  >
    <template v-for="menu in menus" :key="menu.path">
      <SubMenu :menu="menu" />
    </template>
  </Menu>
</template>
