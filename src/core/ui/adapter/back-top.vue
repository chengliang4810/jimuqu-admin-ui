<script lang="ts" setup>
import { computed } from 'vue';

import { BackTop } from 'antdv-next';

interface Props {
  bottom?: number;
  right?: number;
  target?: string;
  visibilityHeight?: number;
}

defineOptions({ name: 'VbenBackTop' });

const props = withDefaults(defineProps<Props>(), {
  bottom: 20,
  right: 24,
  target: '',
  visibilityHeight: 200,
});

const backTopStyle = computed(() => ({
  bottom: `${props.bottom}px`,
  right: `${props.right}px`,
}));

function getTarget() {
  return props.target
    ? ((document.querySelector(props.target) as HTMLElement | null) ?? window)
    : window;
}
</script>

<template>
  <Teleport to="body">
    <BackTop
      :target="getTarget"
      :visibility-height="visibilityHeight"
      :style="backTopStyle"
    />
  </Teleport>
</template>
