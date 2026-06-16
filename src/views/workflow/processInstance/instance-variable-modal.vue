<script setup lang="tsx">
import { ref } from 'vue';

import { instanceVariable, updateFlowVariable } from '@/api/workflow/instance';
import {
  FormInput as Input,
  FormSelect as Select,
} from '@/components/global/form';
import { JsonPreview, useVbenModal } from '@/effects/common-ui';
import { $t } from '@/locales';
import { cn, getPopupContainer } from '@/utils';
import { Button, Form, FormItem, Tag } from 'antdv-next';
import type { AntdFormRules } from '@/types/form';
import type { FormInstance, SelectProps } from 'antdv-next';

interface ModalData {
  /**
   * 变量 json字符串
   */
  record: string;
  instanceId: string;
}

const data = ref({});
const submitLoading = ref(false);
const formInstance = ref<FormInstance>();
const [BasicModal, modalApi] = useVbenModal({
  title: '流程变量',
  fullscreenButton: false,
  footer: false,
  onOpenChange: async (visible) => {
    if (!visible) {
      data.value = {};
      return null;
    }
    modalApi.modalLoading(true);

    await loadData();

    modalApi.modalLoading(false);
  },
});

const fieldTypeColors = {
  string: 'cyan',
  number: 'blue',
  boolean: 'orange',
  object: 'purple',
};
function getFieldTypeColor(fieldType: string) {
  return (
    fieldTypeColors[fieldType as keyof typeof fieldTypeColors] ?? 'default'
  );
}

type VariableOption = NonNullable<SelectProps['options']>[number] & {
  fieldType: string;
};

interface FormData {
  key?: string;
  value?: string;
  valueType?: string;
}

function getDefaultValues(): FormData {
  return {
    key: undefined,
    value: '',
    valueType: undefined,
  };
}

const formData = ref<FormData>(getDefaultValues());
const variableOptions = ref<VariableOption[]>([]);

const valueTypeOptions = [
  {
    label: 'string',
    value: 'string',
  },
  {
    label: 'boolean | number | object (使用JSON.parse)',
    value: 'object',
  },
];

const formRules = ref<AntdFormRules<FormData>>({
  key: [{ required: true, message: $t('ui.formRules.selectRequired') }],
  value: [{ required: true, message: $t('ui.formRules.required') }],
  valueType: [{ required: true, message: $t('ui.formRules.selectRequired') }],
});

async function loadData() {
  const { instanceId } = modalApi.getData() as ModalData;
  const resp = await instanceVariable(instanceId);
  const jsonObj = JSON.parse(resp.variable);
  data.value = jsonObj;

  // 表单
  const objEntry = Object.entries(jsonObj);

  variableOptions.value = objEntry.map(([key, value]) => ({
    label: key,
    value: key,
    fieldType: typeof value,
  }));
}

async function handleConfirmUpdate() {
  await formInstance.value?.validate();
  const values = { ...formData.value };
  window.modal.confirm({
    title: '修改流程变量',
    content: '确认修改流程变量吗？',
    centered: true,
    okButtonProps: {
      danger: true,
    },
    onOk: async () => {
      await handleSubmit(values);
    },
  });
}

async function handleSubmit(values: any) {
  try {
    modalApi.lock(true);
    submitLoading.value = true;

    const { instanceId } = modalApi.getData() as ModalData;

    let transformValue = values.value;
    if (values.valueType !== 'string') {
      try {
        transformValue = JSON.parse(values.value);
      } catch (error) {
        console.error(error);
        if (error instanceof Error) {
          window.message.error(error.message);
        }
        throw error;
      }
    }

    // 修改
    const requestData = {
      instanceId,
      key: values.key,
      value: transformValue,
    };
    await updateFlowVariable(requestData);
    formData.value = getDefaultValues();
    formInstance.value?.resetFields();

    // 查询修改后的
    const resp = await instanceVariable(instanceId);
    const jsonObj = JSON.parse(resp.variable);
    data.value = jsonObj;
  } catch (error) {
    console.error(error);
  } finally {
    submitLoading.value = false;
    modalApi.lock(false);
  }
}
</script>

<template>
  <BasicModal>
    <div
      :class="cn('min-h-[400px] overflow-y-auto border', 'rounded-[4px] p-2')"
    >
      <JsonPreview :data="data" />
    </div>
    <div class="mt-2 text-sm font-medium break-all text-orange-500">
      需要支持变量类型需要更改后端代码(原版只支持string类型)
      <div>
        ruoyi-modules/ruoyi-workflow/src/main/java/org/dromara/workflow/domain/bo/FlowVariableBo.java
      </div>
      将value的类型改为Object才能使用
    </div>
    <Form
      ref="formInstance"
      class="mt-2"
      :model="formData"
      :label-col="{ style: { width: '80px' } }"
    >
      <FormItem label="变量名称" name="key" :rules="formRules.key">
        <Select
          allow-clear
          class="w-full"
          :get-popup-container="getPopupContainer"
          :options="variableOptions"
          v-model:value="formData.key"
        >
          <template #optionRender="{ option }">
            <div>
              {{ option.label }}
              <Tag class="ml-1" :color="getFieldTypeColor(option.data.fieldType)">
                {{ option.data.fieldType }}
              </Tag>
            </div>
          </template>
        </Select>
      </FormItem>
      <FormItem label="变量类型" name="valueType" :rules="formRules.valueType">
        <Select
          allow-clear
          class="w-full"
          :get-popup-container="getPopupContainer"
          :options="valueTypeOptions"
          v-model:value="formData.valueType"
        />
      </FormItem>
      <FormItem label="变量值" name="value" :rules="formRules.value">
        <Input allow-clear class="w-full" v-model:value="formData.value" />
      </FormItem>
      <FormItem :wrapper-col="{ offset: 0 }">
        <Button type="primary" :loading="submitLoading" @click="handleConfirmUpdate">
          修改
        </Button>
      </FormItem>
    </Form>
  </BasicModal>
</template>
