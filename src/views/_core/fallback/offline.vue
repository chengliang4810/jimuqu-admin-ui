<script lang="ts" setup>
import { Fallback } from '@/effects/common-ui';

defineOptions({ name: 'FallbackOfflineDemo' });
</script>

<template>
  <Fallback status="offline" />
</template>
