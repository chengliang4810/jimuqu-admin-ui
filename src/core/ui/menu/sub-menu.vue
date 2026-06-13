<script setup lang="ts">
import type { MenuRecordRaw } from '@/core/typings';

import { computed, inject } from 'vue';
import { MenuItem, SubMenu } from 'antdv-next';

import { VbenIcon } from '@/core/ui/adapter';

import { MenuBadge } from './components';

interface Props {
  /**
   * 菜单项
   */
  menu: MenuRecordRaw;
}

defineOptions({
  name: 'SubMenuUi',
});

const props = withDefaults(defineProps<Props>(), {});

// 从 MenuView 注入当前激活路径
const activePath = inject<{ value: string }>('menuActivePath', { value: '' });

/**
 * 判断是否有子节点，动态渲染 menu-item/sub-menu-item
 */
const hasChildren = computed(() => {
  const { menu } = props;
  return (
    Reflect.has(menu, 'children') && !!menu.children && menu.children.length > 0
  );
});

const computedIcon = computed(() =>
  activePath.value === props.menu.path
    ? props.menu.activeIcon || props.menu.icon
    : props.menu.icon,
);
</script>

<template>
  <!-- 叶子节点：渲染 MenuItem -->
  <MenuItem
    v-if="!hasChildren"
    :key="menu.path"
    @click="$emit('itemClick', menu)"
  >
    <template v-if="computedIcon" #icon>
      <VbenIcon :icon="computedIcon" fallback />
    </template>
    <span>{{ menu.name }}</span>
    <template #extra>
      <MenuBadge
        :badge="menu.badge"
        :badge-type="menu.badgeType"
        :badge-variants="menu.badgeVariants"
      />
    </template>
  </MenuItem>

  <!-- 分支节点：渲染 SubMenu -->
  <SubMenu
    v-else
    :key="`${menu.path}_sub`"
    @click="$emit('subMenuClick', menu)"
  >
    <template v-if="computedIcon" #icon>
      <VbenIcon :icon="computedIcon" fallback />
    </template>
    <template #title>
      <span>{{ menu.name }}</span>
      <MenuBadge
        :badge="menu.badge"
        :badge-type="menu.badgeType"
        :badge-variants="menu.badgeVariants"
        class="ml-2"
      />
    </template>
    <!-- 递归子菜单 -->
    <template v-for="childItem in menu.children || []" :key="childItem.path">
      <SubMenuUi :menu="childItem" />
    </template>
  </SubMenu>
</template>
