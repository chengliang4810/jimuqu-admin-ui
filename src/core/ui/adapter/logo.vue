<script setup lang="ts">
import { computed } from 'vue';

import { usePreferences } from '@/core/preferences';

import VbenAvatar from './avatar.vue';

interface Props {
  collapsed?: boolean;
  fit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  href?: string;
  logoSize?: number;
  src?: string;
  srcDark?: string;
  text: string;
  theme?: string;
}

defineOptions({
  name: 'VbenLogo',
});

const props = withDefaults(defineProps<Props>(), {
  collapsed: false,
  fit: 'cover',
  href: 'javascript:void 0',
  logoSize: 32,
  src: '',
  srcDark: '',
  theme: 'light',
});

const { isDark } = usePreferences();

const logoSrc = computed(() => {
  if (isDark.value && props.srcDark) {
    return props.srcDark;
  }
  return props.src;
});
</script>

<template>
  <div :class="theme" class="flex h-full items-center text-lg">
    <a
      :class="$attrs.class"
      :href="href"
      class="flex h-full items-center gap-2 overflow-hidden px-3 text-lg leading-normal transition-all duration-500"
    >
      <VbenAvatar
        v-if="logoSrc"
        :alt="text"
        :src="logoSrc"
        :size="logoSize"
        :fit="fit"
        class="relative rounded-none bg-transparent"
      />
      <template v-if="!collapsed">
        <slot name="text">
          <span class="text-foreground truncate font-semibold text-nowrap">
            {{ text }}
          </span>
        </slot>
      </template>
    </a>
  </div>
</template>
