<script setup lang="ts">
import type { SysConfig } from '@/api/system/config/model';
import type { AntdFormRules } from '@/types/form';
import type { FormInstance } from 'antdv-next';

import { computed, ref } from 'vue';

import { configAdd, configInfo, configUpdate } from '@/api/system/config';
import {
  FormInput as Input,
  FormTextArea as TextArea,
} from '@/components/global/form';
import { DictEnum } from '@/constants';
import { useVbenModal } from '@/effects/common-ui';
import { $t } from '@/locales';
import { cloneDeep } from '@/utils';
import { getDictOptions } from '@/utils/dict';
import { useBeforeCloseDiff } from '@/utils/popup';
import { Form, FormItem, RadioGroup } from 'antdv-next';

const emit = defineEmits<{ reload: [] }>();

const isUpdate = ref(false);
const title = computed(() => {
  return isUpdate.value ? $t('pages.common.edit') : $t('pages.common.add');
});

type FormData = Partial<SysConfig>;

function getDefaultValues(): FormData {
  return {
    configId: undefined,
    configKey: '',
    configName: '',
    configType: 'N',
    configValue: '',
    remark: '',
  };
}

const formData = ref<FormData>(getDefaultValues());
const formInstance = ref<FormInstance>();

const formRules = ref<AntdFormRules<FormData>>({
  configKey: [{ required: true, message: $t('ui.formRules.required') }],
  configName: [{ required: true, message: $t('ui.formRules.required') }],
  configType: [{ required: true, message: $t('ui.formRules.required') }],
  configValue: [{ required: true, message: $t('ui.formRules.required') }],
});

function customFormValueGetter() {
  return JSON.stringify(formData.value);
}

const { onBeforeClose, markInitialized, resetInitialized } = useBeforeCloseDiff(
  {
    initializedGetter: customFormValueGetter,
    currentGetter: customFormValueGetter,
  },
);

const [BasicModal, modalApi] = useVbenModal({
  fullscreenButton: false,
  onBeforeClose,
  onClosed: handleClosed,
  onConfirm: handleConfirm,
  onOpenChange: async (isOpen) => {
    if (!isOpen) {
      return null;
    }
    modalApi.modalLoading(true);

    const { id } = modalApi.getData() as { id?: number | string };
    isUpdate.value = !!id;

    if (isUpdate.value && id) {
      const record = await configInfo(id);
      formData.value = {
        ...getDefaultValues(),
        ...record,
        remark: record.remark ?? '',
      };
    }
    await markInitialized();

    modalApi.modalLoading(false);
  },
});

async function handleConfirm() {
  try {
    modalApi.lock(true);
    await formInstance.value?.validate();
    const data = cloneDeep(formData.value);
    await (isUpdate.value ? configUpdate(data) : configAdd(data));
    resetInitialized();
    emit('reload');
    modalApi.close();
  } catch (error) {
    console.error(error);
  } finally {
    modalApi.lock(false);
  }
}

async function handleClosed() {
  formData.value = getDefaultValues();
  formInstance.value?.resetFields();
  resetInitialized();
}
</script>

<template>
  <BasicModal :title="title" :width="550">
    <Form
      ref="formInstance"
      :model="formData"
      :label-col="{ style: { width: '80px' } }"
    >
      <FormItem
        label="参数名称"
        name="configName"
        :rules="formRules.configName"
      >
        <Input allow-clear class="w-full" v-model:value="formData.configName" />
      </FormItem>
      <FormItem
        label="参数键名"
        name="configKey"
        :rules="formRules.configKey"
      >
        <Input allow-clear class="w-full" v-model:value="formData.configKey" />
      </FormItem>
      <FormItem
        label="参数键值"
        name="configValue"
        :rules="formRules.configValue"
      >
        <TextArea
          allow-clear
          :auto-size="true"
          class="w-full"
          v-model:value="formData.configValue"
        />
      </FormItem>
      <FormItem
        label="是否内置"
        name="configType"
        :rules="formRules.configType"
      >
        <RadioGroup
          button-style="solid"
          option-type="button"
          :options="getDictOptions(DictEnum.SYS_YES_NO)"
          v-model:value="formData.configType"
        />
      </FormItem>
      <FormItem label="备注" name="remark">
        <TextArea allow-clear class="w-full" v-model:value="formData.remark" />
      </FormItem>
    </Form>
  </BasicModal>
</template>
