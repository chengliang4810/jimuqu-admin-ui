<script setup lang="ts">
import type { JobRetryConfig, ScheduledJob } from '@/api/monitor/job/model';
import type { AntdFormRules } from '@/types/form';
import type { FormInstance } from 'antdv-next';

import { computed, ref } from 'vue';

import { jobUpdateConfig } from '@/api/monitor/job';
import { useVbenModal } from '@/components';
import { FormInputNumber as InputNumber } from '@/components/global/form';
import { Form, FormItem } from 'antdv-next';

const emit = defineEmits<{ reload: [] }>();
const jobName = ref('');
const formData = ref<JobRetryConfig>({
  maxRetries: 0,
  retryIntervalMs: 0,
});
const formInstance = ref<FormInstance>();
const title = computed(() => `重试设置 - ${jobName.value}`);
const rules: AntdFormRules<JobRetryConfig> = {
  maxRetries: [
    { required: true, message: '请输入最大重试次数' },
    {
      max: 10,
      message: '最大重试次数必须在 0 到 10 之间',
      min: 0,
      type: 'number',
    },
  ],
  retryIntervalMs: [
    { required: true, message: '请输入重试间隔' },
    {
      max: 86_400_000,
      message: '重试间隔必须在 0 到 86400000 毫秒之间',
      min: 0,
      type: 'number',
    },
  ],
};

const [BasicModal, modalApi] = useVbenModal({
  fullscreenButton: false,
  onClosed() {
    jobName.value = '';
    formData.value = { maxRetries: 0, retryIntervalMs: 0 };
    formInstance.value?.resetFields();
  },
  async onConfirm() {
    try {
      modalApi.lock(true);
      await formInstance.value?.validate();
      await jobUpdateConfig(jobName.value, formData.value);
      emit('reload');
      await modalApi.close();
    } catch {
      // 表单和请求层已负责向用户展示错误，弹窗保持打开。
    } finally {
      modalApi.lock(false);
    }
  },
  onOpenChange(open) {
    if (!open) {
      return;
    }
    const job = modalApi.getData() as ScheduledJob;
    jobName.value = job.jobName;
    formData.value = {
      maxRetries: job.maxRetries,
      retryIntervalMs: job.retryIntervalMs,
    };
  },
});
</script>

<template>
  <BasicModal :title="title" :width="500">
    <Form
      ref="formInstance"
      :label-col="{ style: { width: '130px' } }"
      :model="formData"
    >
      <FormItem
        label="最大重试次数"
        name="maxRetries"
        :rules="rules.maxRetries"
      >
        <InputNumber
          v-model:value="formData.maxRetries"
          class="w-full"
          :max="10"
          :min="0"
          :precision="0"
        />
      </FormItem>
      <FormItem
        label="重试间隔 (ms)"
        name="retryIntervalMs"
        :rules="rules.retryIntervalMs"
      >
        <InputNumber
          v-model:value="formData.retryIntervalMs"
          class="w-full"
          :max="86_400_000"
          :min="0"
          :precision="0"
        />
      </FormItem>
    </Form>
  </BasicModal>
</template>
