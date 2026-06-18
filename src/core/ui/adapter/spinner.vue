<script lang="ts" setup>
import { ref, watch } from 'vue';

import { cn } from '@/utils';
import { Spin } from 'antdv-next';

interface Props {
  class?: string;
  minLoadingTime?: number;
  spinning?: boolean;
}

defineOptions({
  name: 'VbenSpinner',
});

const props = withDefaults(defineProps<Props>(), {
  minLoadingTime: 50,
});
const showSpinner = ref(false);
let timer: ReturnType<typeof setTimeout> | undefined;

watch(
  () => props.spinning,
  (show) => {
    if (!show) {
      showSpinner.value = false;
      timer && clearTimeout(timer);
      return;
    }
    timer = setTimeout(() => {
      showSpinner.value = true;
    }, props.minLoadingTime);
  },
  { immediate: true },
);
</script>

<template>
  <div
    v-if="showSpinner"
    :class="
      cn(
        'absolute top-0 left-0 z-100 flex size-full items-center justify-center',
        props.class,
      )
    "
  >
    <Spin size="large" />
  </div>
</template>
