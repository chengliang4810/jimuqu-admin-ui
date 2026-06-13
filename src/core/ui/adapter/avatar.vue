<script setup lang="ts">
import type { CSSProperties } from 'vue';

import type { ClassType } from '@/core/typings';

import { computed } from 'vue';

import { cn } from '@/core/shared/utils';

import { Avatar } from 'antdv-next';

interface Props {
  alt?: string;
  class?: ClassType;
  dot?: boolean;
  dotClass?: ClassType;
  fit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  size?: number;
  src?: string;
}

defineOptions({
  inheritAttrs: false,
});

const props = withDefaults(defineProps<Props>(), {
  alt: 'avatar',
  dot: false,
  dotClass: 'bg-green-500',
  fit: 'cover',
  size: 0,
  src: '',
});

const imageStyle = computed<CSSProperties>(() => {
  return props.fit ? { objectFit: props.fit } : {};
});

const text = computed(() => props.alt.slice(-2).toUpperCase());

const rootStyle = computed<CSSProperties>(() => {
  return props.size > 0 && props.size > 0
    ? { height: `${props.size}px`, width: `${props.size}px` }
    : {};
});
</script>

<template>
  <div class="relative flex-shrink-0" :style="rootStyle">
    <Avatar
      :src="src || undefined"
      :size="size && size > 0 ? size : 'default'"
      :alt="alt"
      :image-style="imageStyle"
      :class="cn('size-full', props.class)"
    >
      {{ text }}
    </Avatar>
    <span
      v-if="dot"
      :class="
        cn(
          'border-background absolute right-0 bottom-0 size-3 rounded-full border-2',
          dotClass,
        )
      "
    ></span>
  </div>
</template>
