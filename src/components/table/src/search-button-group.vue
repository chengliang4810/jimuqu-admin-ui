<script setup lang="ts">
import { ChevronDown } from '@/icons';

withDefaults(defineProps<{ collapsible?: boolean }>(), {
  collapsible: false,
});

const emit = defineEmits<{
  reset: [];
  submit: [];
}>();

const collapsed = defineModel<boolean>('collapsed', { default: false });
</script>

<template>
  <div class="flex w-full flex-wrap items-baseline justify-end gap-3">
    <a-button v-if="collapsible" type="link" @click="collapsed = !collapsed">
      {{
        collapsed ? $t('pages.common.expand') : $t('pages.common.collapse')
      }}
      <ChevronDown
        class="size-4 transition-transform"
        :class="{ 'rotate-180': !collapsed }"
      />
    </a-button>

    <a-button @click="emit('reset')">
      {{ $t('common.reset') }}
    </a-button>

    <a-button type="primary" @click="emit('submit')">
      {{ $t('common.search') }}
    </a-button>
  </div>
</template>
