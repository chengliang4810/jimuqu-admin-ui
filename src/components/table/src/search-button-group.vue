<script setup lang="ts">
import { Space } from 'antdv-next';
const emit = defineEmits<{
  reset: [];
  submit: [];
}>();
</script>

<template>
  <Space>
    <a-button @click="emit('reset')">
      {{ $t('common.reset') }}
    </a-button>

    <a-button type="primary" @click="emit('submit')">
      {{ $t('common.search') }}
    </a-button>
  </Space>
</template>
