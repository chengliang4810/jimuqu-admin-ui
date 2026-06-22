<script setup lang="ts">
import { h , ref } from 'vue';

import { ImageUpload } from '@/components/upload';
import { JsonPreview, useVbenModal } from '@/components';
import { Form, FormItem, Space } from 'antdv-next';

const formData = ref({
  ossId: '',
  ossIds: '',
});

async function getValues() {
  try {
    const v = { ...formData.value };
    console.log(v);

    window.modal.info({
      content: () => h(JsonPreview, { data: v }),
    });
  } catch (error) {
    console.error(error);
  }
}

async function handleAssign() {
  const ids = ['1908761290673315841', '1907738568539332610'];
  formData.value = {
    ossIds: ids.join(','),
    ossId: ids[0] ?? '',
  };
}

const [BasicModal] = useVbenModal({
  title: '上传',
  footer: false,
});
</script>

<template>
  <BasicModal>
    <div class="flex flex-col">
      <Space>
        <a-button @click="handleAssign">赋值</a-button>
        <a-button @click="getValues">获取值</a-button>
      </Space>
      <Form layout="vertical" :model="formData">
        <FormItem label="图片上传多图" name="ossIds">
          <ImageUpload v-model:value="formData.ossIds" :max-count="3" />
        </FormItem>
        <FormItem label="图片上传单图" name="ossId">
          <ImageUpload v-model:value="formData.ossId" :max-count="1" />
        </FormItem>
      </Form>
    </div>
  </BasicModal>
</template>
