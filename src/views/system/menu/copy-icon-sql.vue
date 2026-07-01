<script setup lang="ts">
import menuIconSql from '@/../scripts/菜单图标替换sql/update_icon.sql?raw';
import { useClipboard } from '@vueuse/core';
import { Alert } from 'antdv-next';

const { copy } = useClipboard({ legacy: true });
async function handleCopy() {
  await copy(menuIconSql);
  window.message.success('复制sql成功');
}
</script>

<template>
  <Alert
    :show-icon="true"
    type="warning"
    :style="{ '--ant-alert-default-padding': '4px 12px' }"
  >
    <template #title>
      菜单图标替换sql
      <a-button type="link" size="small" @click="handleCopy">复制</a-button>
    </template>
  </Alert>
</template>
