<script setup lang="ts">
import { useRoute } from 'vue-router';

import { JsonPreview, Page } from '@vben/common-ui';

const route = useRoute();
const query = route.query;
</script>

<template>
  <Page>
    <div class="bg-background rounded-lg p-4">
      <span>当前参数:</span>
      <JsonPreview :data="query" />
    </div>
  </Page>
</template>
