<script lang="ts" setup>
import type { DropdownMenuProps } from './types';

import { Dropdown, Menu, MenuItem } from 'antdv-next';

interface Props extends DropdownMenuProps {}

defineOptions({ name: 'VbenDropdownRadioMenu' });
defineProps<Props>();

const modelValue = defineModel<string>();

function handleItemClick(value: string) {
  modelValue.value = value;
}
</script>

<template>
  <Dropdown :trigger="['click']">
    <slot></slot>
    <template #popupRender>
      <Menu :selected-keys="modelValue ? [modelValue] : []">
        <MenuItem
          v-for="menu in menus"
          :key="menu.value"
          @click="handleItemClick(menu.value)"
        >
          <span class="flex items-center">
            <component
              :is="menu.icon"
              v-if="menu.icon"
              class="mr-2 inline-block size-4"
            />
            {{ menu.label }}
          </span>
        </MenuItem>
      </Menu>
    </template>
  </Dropdown>
</template>
