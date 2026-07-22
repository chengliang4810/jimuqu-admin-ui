<script setup lang="ts">
import type { CSSProperties } from 'vue';

import { computed } from 'vue';

interface Props {
  /**
   * 高度
   */
  height: number;
}

const props = withDefaults(defineProps<Props>(), {});

const style = computed((): CSSProperties => {
  const { height } = props;
  return {
    height: `${height}px`,
  };
});
</script>

<template>
  <section :style="style" class="border-border bg-header flex w-full border-b">
    <slot></slot>
  </section>
</template>
