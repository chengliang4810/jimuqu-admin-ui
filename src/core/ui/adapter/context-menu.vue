<script setup lang="ts">
import type { ClassType } from '@/types';

import type { IContextMenuItem } from './types';

import { computed } from 'vue';

import { Dropdown, Menu, MenuDivider, MenuItem } from 'antdv-next';

interface Props {
  class?: ClassType;
  contentClass?: ClassType;
  handlerData?: Record<string, any>;
  itemClass?: ClassType;
  menus: (data: any) => IContextMenuItem[];
}

const props = defineProps<Props>();

const menusView = computed(() =>
  (props.menus?.(props.handlerData) ?? []).filter((m) => !m.hidden),
);

function handleClick(menu: IContextMenuItem) {
  if (menu.disabled) {
    return;
  }
  menu?.handler?.(props.handlerData);
}
</script>

<template>
  <Dropdown :trigger="['contextmenu']">
    <slot></slot>
    <template #popupRender>
      <Menu>
        <template v-for="menu in menusView" :key="menu.key">
          <MenuDivider v-if="menu.separator" :key="`divider-${menu.key}`" />
          <MenuItem
            v-else
            :key="menu.key"
            :disabled="menu.disabled"
            @click="handleClick(menu)"
          >
            <span class="flex items-center">
              <component
                :is="menu.icon"
                v-if="menu.icon"
                class="mr-2 inline-block size-4"
              />
              {{ menu.text }}
              <span
                v-if="menu.shortcut"
                class="ml-auto pl-4 text-xs opacity-60"
              >
                {{ menu.shortcut }}
              </span>
            </span>
          </MenuItem>
        </template>
      </Menu>
    </template>
  </Dropdown>
</template>
