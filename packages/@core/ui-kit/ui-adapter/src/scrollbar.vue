<script setup lang="ts">
import type { ClassType } from '@vben-core/typings';

import { computed, ref } from 'vue';

import { cn } from '@vben-core/shared/utils';

interface Props {
  class?: ClassType;
  horizontal?: boolean;
  scrollBarClass?: ClassType;
  shadow?: boolean;
  shadowBorder?: boolean;
  shadowBottom?: boolean;
  shadowLeft?: boolean;
  shadowRight?: boolean;
  shadowTop?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  class: '',
  horizontal: false,
  shadow: false,
  shadowBorder: false,
  shadowBottom: true,
  shadowLeft: false,
  shadowRight: false,
  shadowTop: true,
});

const emit = defineEmits<{
  scrollAt: [{ bottom: boolean; left: boolean; right: boolean; top: boolean }];
}>();

const isAtTop = ref(true);
const isAtBottom = ref(false);
const isAtLeft = ref(true);
const isAtRight = ref(false);

const showShadowTop = computed(() => props.shadow && props.shadowTop);
const showShadowBottom = computed(() => props.shadow && props.shadowBottom);
const hideNativeScrollbar = computed(() => hasHiddenClass(props.scrollBarClass));

function hasHiddenClass(value: ClassType): boolean {
  if (!value) {
    return false;
  }

  if (typeof value === 'string') {
    return value.split(/\s+/).includes('hidden');
  }

  if (Array.isArray(value)) {
    return value.some((item) => hasHiddenClass(item));
  }

  if (typeof value === 'object') {
    return Object.entries(value).some(([key, enabled]) => {
      return !!enabled && key.split(/\s+/).includes('hidden');
    });
  }

  return false;
}

function handleScroll(e: Event) {
  const el = e.target as HTMLElement;
  const { clientHeight, clientWidth, scrollHeight, scrollLeft, scrollTop, scrollWidth } =
    el;
  isAtTop.value = scrollTop <= 0;
  isAtBottom.value = Math.ceil(scrollTop + clientHeight) >= scrollHeight;
  isAtLeft.value = scrollLeft <= 0;
  isAtRight.value = Math.ceil(scrollLeft + clientWidth) >= scrollWidth;
  emit('scrollAt', {
    bottom: isAtBottom.value,
    left: isAtLeft.value,
    right: isAtRight.value,
    top: isAtTop.value,
  });
}
</script>

<template>
  <div
    data-vben-scrollbar-viewport
    :class="
      cn(
        'vben-scrollbar relative',
        { 'vben-scrollbar--hide-native': hideNativeScrollbar },
        props.class,
      )
    "
    :style="{
      overflowX: horizontal ? 'auto' : 'hidden',
      overflowY: horizontal ? 'hidden' : 'auto',
    }"
    @scroll="handleScroll"
  >
    <div
      v-if="showShadowTop"
      :class="{
        'opacity-100': !isAtTop,
        'border-border border-t': shadowBorder && !isAtTop,
      }"
      class="pointer-events-none sticky top-0 z-10 -mb-12 h-12 w-full opacity-0 transition-opacity duration-300"
    ></div>
    <slot></slot>
    <div
      v-if="showShadowBottom"
      :class="{
        'opacity-100': !isAtTop && !isAtBottom,
        'border-border border-b': shadowBorder && !isAtTop && !isAtBottom,
      }"
      class="pointer-events-none sticky bottom-0 z-10 -mt-12 h-12 w-full opacity-0 transition-opacity duration-300"
    ></div>
  </div>
</template>

<style scoped>
.vben-scrollbar {
  scrollbar-width: thin;
}

.vben-scrollbar--hide-native {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.vben-scrollbar--hide-native::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}
</style>
