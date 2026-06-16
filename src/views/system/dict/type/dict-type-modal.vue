<script setup lang="ts">
import type { DictType } from '@/api/system/dict/dict-type-model';
import type { AntdFormRules } from '@/types/form';
import type { FormInstance } from 'antdv-next';

import { computed, ref } from 'vue';

import {
  dictTypeAdd,
  dictTypeInfo,
  dictTypeUpdate,
} from '@/api/system/dict/dict-type';
import {
  FormInput as Input,
  FormTextArea as TextArea,
} from '@/components/global/form';
import { useVbenModal } from '@/effects/common-ui';
import { $t } from '@/locales';
import { cloneDeep } from '@/utils';
import { useBeforeCloseDiff } from '@/utils/popup';
import { Form, FormItem } from 'antdv-next';

const emit = defineEmits<{ reload: [] }>();

const isUpdate = ref(false);
const title = computed(() => {
  return isUpdate.value ? $t('pages.common.edit') : $t('pages.common.add');
});

type FormData = Partial<DictType>;

function getDefaultValues(): FormData {
  return {
    dictId: undefined,
    dictName: '',
    dictType: '',
    remark: '',
  };
}

const formData = ref<FormData>(getDefaultValues());
const formInstance = ref<FormInstance>();

const formTooltips = {
  dictType: '使用英文/下划线命名, 如:sys_normal_disable',
};

const formRules = ref<AntdFormRules<FormData>>({
  dictName: [{ required: true, message: $t('ui.formRules.required') }],
  dictType: [
    {
      required: true,
      message: $t('ui.formRules.required'),
    },
    {
      message: '字典类型只能使用英文/下划线命名',
      pattern: /^[a-z_]+$/i,
    },
  ],
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
      const record = await dictTypeInfo(id);
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
    await (isUpdate.value ? dictTypeUpdate(data) : dictTypeAdd(data));
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
  <BasicModal :title="title">
    <Form layout="vertical" ref="formInstance" :model="formData">
      <FormItem label="字典名称" name="dictName" :rules="formRules.dictName">
        <Input allow-clear class="w-full" v-model:value="formData.dictName" />
      </FormItem>
      <FormItem
        label="字典类型"
        name="dictType"
        :rules="formRules.dictType"
        :tooltip="formTooltips.dictType"
      >
        <Input allow-clear class="w-full" v-model:value="formData.dictType" />
      </FormItem>
      <FormItem label="备注" name="remark">
        <TextArea allow-clear class="w-full" v-model:value="formData.remark" />
      </FormItem>
    </Form>
  </BasicModal>
</template>
