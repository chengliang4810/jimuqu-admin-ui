<script setup lang="ts">
import type { DropdownMenuProps, VbenDropdownMenuItem } from './types';

import { Dropdown, Menu, MenuDivider, MenuItem } from 'antdv-next';

interface Props extends DropdownMenuProps {}

defineProps<Props>();

function handleClick(menu: VbenDropdownMenuItem) {
  if (menu.disabled) {
    return;
  }
  menu?.handler?.(menu.value);
}
</script>

<template>
  <Dropdown :trigger="['click']">
    <slot></slot>
    <template #overlay>
      <Menu>
        <template v-for="menu in menus" :key="menu.value">
          <MenuDivider v-if="menu.separator" />
          <MenuItem v-else :disabled="menu.disabled" @click="handleClick(menu)">
            <span class="flex items-center">
              <component
                :is="menu.icon"
                v-if="menu.icon"
                class="mr-2 inline-block size-4"
              />
              {{ menu.label }}
            </span>
          </MenuItem>
        </template>
      </Menu>
    </template>
  </Dropdown>
</template>
