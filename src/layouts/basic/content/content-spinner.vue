<script lang="ts" setup>
import { VbenLoading } from '@/core/ui/adapter';

import { useContentSpinner } from './use-content-spinner';

defineOptions({ name: 'LayoutContentSpinner' });

const { spinning } = useContentSpinner();
</script>
<template>
  <VbenLoading :spinning="spinning" />
</template>
