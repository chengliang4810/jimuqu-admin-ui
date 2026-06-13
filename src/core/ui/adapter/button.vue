<script setup lang="ts">
import { computed } from 'vue';

import { Button } from 'antdv-next';

interface Props {
  class?: any;
  disabled?: boolean;
  loading?: boolean;
  size?: string;
  variant?: string;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  loading: false,
  size: 'default',
  variant: 'default',
});

// vben variant → antd Button type/danger/ghost
const antdType = computed(() => {
  switch (props.variant) {
    case 'destructive': {
      return 'primary';
    }
    case 'ghost':
    case 'icon': {
      return 'text';
    }
    case 'heavy':
    case 'primary':
    case 'success': {
      return 'primary';
    }
    case 'link': {
      return 'link';
    }
    default: {
      return 'default';
    }
  }
});

const danger = computed(() => props.variant === 'destructive');

// vben size → antd size
const antdSize = computed(() => {
  switch (props.size) {
    case 'lg': {
      return 'large';
    }
    case 'sm':
    case 'xs': {
      return 'small';
    }
    default: {
      return 'middle';
    }
  }
});
</script>

<template>
  <Button
    :type="antdType"
    :danger="danger"
    :size="antdSize"
    :loading="loading"
    :disabled="disabled"
    :class="props.class"
  >
    <slot></slot>
  </Button>
</template>
