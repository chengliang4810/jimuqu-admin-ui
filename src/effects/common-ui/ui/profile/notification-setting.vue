<script setup lang="ts">
import type { Recordable } from '@/types';

import type { SettingProps } from './types';

import { Switch } from 'antdv-next';

withDefaults(defineProps<SettingProps>(), {
  formSchema: () => [],
});

const emit = defineEmits<{
  change: [Recordable<any>];
}>();

function handleChange(fieldName: string, value: boolean) {
  emit('change', { fieldName, value });
}
</script>
<template>
  <form class="space-y-8">
    <div class="space-y-4">
      <template v-for="item in formSchema" :key="item.fieldName">
        <div
          class="flex flex-row items-center justify-between rounded-lg border p-4"
        >
          <div class="space-y-0.5">
            <label class="text-base">{{ item.label }}</label>
            <p class="text-muted-foreground text-sm">
              {{ item.description }}
            </p>
          </div>
          <Switch
            :checked="item.value"
            @change="handleChange(item.fieldName, $event)"
          />
        </div>
      </template>
    </div>
  </form>
</template>
