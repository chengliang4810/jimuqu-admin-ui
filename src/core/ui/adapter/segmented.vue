<script setup lang="ts">
import type { SegmentedItem } from './types';

import { computed } from 'vue';

import { Segmented } from 'antdv-next';

interface Props {
  defaultValue?: string;
  tabs?: SegmentedItem[];
}

const props = withDefaults(defineProps<Props>(), {
  defaultValue: '',
  tabs: () => [],
});

const activeTab = defineModel<string>();

const current = computed(
  () => activeTab.value || props.defaultValue || props.tabs[0]?.value,
);

const options = computed(() =>
  props.tabs.map((t) => ({ label: t.label, value: t.value })),
);
</script>

<template>
  <div>
    <Segmented
      v-model:value="activeTab"
      :options="options"
      block
      class="mb-3"
    />
    <template v-for="tab in tabs" :key="tab.value">
      <div v-show="current === tab.value">
        <slot :name="tab.value"></slot>
      </div>
    </template>
  </div>
</template>
