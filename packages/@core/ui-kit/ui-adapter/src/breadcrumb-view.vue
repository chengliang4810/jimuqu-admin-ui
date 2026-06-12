<script lang="ts" setup>
import type { BreadcrumbProps } from './types';

import { ChevronDown } from '@vben-core/icons';

import { Breadcrumb, BreadcrumbItem, Dropdown, Menu, MenuItem } from 'antdv-next';

import VbenIcon from './icon.vue';

interface Props extends BreadcrumbProps {
  class?: any;
}

withDefaults(defineProps<Props>(), {
  showIcon: false,
  styleType: 'normal',
});

const emit = defineEmits<{ select: [string] }>();

function handleClick(path?: string) {
  if (path) {
    emit('select', path);
  }
}
</script>

<template>
  <Breadcrumb class="vben-breadcrumb">
    <BreadcrumbItem
      v-for="(item, index) in breadcrumbs"
      :key="`${item.path}-${item.title}-${index}`"
    >
      <Dropdown v-if="item.items?.length" :trigger="['click']">
        <span class="flex cursor-pointer items-center gap-1">
          <VbenIcon
            v-if="showIcon && item.icon"
            :icon="item.icon"
            class="size-4"
          />
          {{ item.title }}
          <ChevronDown class="size-3" />
        </span>
        <template #overlay>
          <Menu>
            <MenuItem
              v-for="sub in item.items"
              :key="sub.path"
              @click="handleClick(sub.path)"
            >
              <span class="flex items-center gap-1">
                <VbenIcon
                  v-if="showIcon && sub.icon"
                  :icon="sub.icon"
                  class="size-4"
                />
                {{ sub.title }}
              </span>
            </MenuItem>
          </Menu>
        </template>
      </Dropdown>
      <span
        v-else
        class="flex cursor-pointer items-center gap-1"
        @click="handleClick(item.path)"
      >
        <VbenIcon
          v-if="showIcon && item.icon"
          :icon="item.icon"
          class="size-4"
        />
        {{ item.title }}
      </span>
    </BreadcrumbItem>
  </Breadcrumb>
</template>
