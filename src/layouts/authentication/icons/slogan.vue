<script setup lang="ts">
import platformIllustration from '@/icons/svg/icons/jimuqu-platform.svg';

defineProps<{ alt?: string }>();
</script>

<template>
  <img
    :alt="alt || ''"
    :src="platformIllustration"
    class="animate-float h-64 w-2/5"
    draggable="false"
  />
</template>
