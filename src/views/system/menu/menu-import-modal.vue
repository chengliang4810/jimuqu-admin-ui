<script setup lang="ts">
import type { Menu } from '@/api/system/menu/model';

import { ref } from 'vue';

import { useVbenModal } from '@/components';
import { FormTextArea as TextArea } from '@/components/global/form';

const emit = defineEmits<{ import: [data: Partial<Menu>] }>();

const jsonText = ref('');

const [BasicModal, modalApi] = useVbenModal({
  fullscreenButton: false,
  onClosed: handleClosed,
  onConfirm: handleConfirm,
});

function handleConfirm() {
  const text = jsonText.value.trim();
  if (!text) {
    window.message.error('请粘贴配置 JSON');
    return;
  }
  let data: Partial<Menu>;
  try {
    data = JSON.parse(text);
  } catch {
    window.message.error('JSON 格式错误, 请检查后重试');
    return;
  }
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    window.message.error('配置内容格式不正确');
    return;
  }
  emit('import', data);
  modalApi.close();
}

function handleClosed() {
  jsonText.value = '';
}
</script>

<template>
  <BasicModal title="导入配置" :width="550">
    <TextArea
      v-model:value="jsonText"
      :auto-size="{ minRows: 8, maxRows: 16 }"
      allow-clear
      class="w-full"
      placeholder="请粘贴通过【复制配置】得到的 JSON"
    />
  </BasicModal>
</template>
