<script setup lang="ts">
import type { TreeForm, TreeVO } from './api/model';
import type { AntdFormRules } from '@/types/form';
import type { FormInstance } from 'antdv-next';

import { computed, ref } from 'vue';

import {
  FormInput as Input,
  FormInputNumber as InputNumber,
  FormTreeSelect as TreeSelect,
} from '@/components/global/form';
import { useVbenModal } from '@/effects/common-ui';
import { $t } from '@/locales';
import { cloneDeep, getPopupContainer, listToTree } from '@/utils';
import { Form, FormItem } from 'antdv-next';

import { treeAdd, treeInfo, treeList, treeUpdate } from './api';

const emit = defineEmits<{ reload: [] }>();

const isUpdate = ref(false);
const title = computed(() => {
  return isUpdate.value ? $t('pages.common.edit') : $t('pages.common.add');
});

function getDefaultValues(): TreeForm {
  return {
    deptId: undefined,
    id: undefined,
    parentId: undefined,
    treeName: '',
    userId: undefined,
    version: undefined,
  };
}

const formData = ref<TreeForm>(getDefaultValues());
const formInstance = ref<FormInstance>();
const treeData = ref<TreeVO[]>([]);

const formRules = ref<AntdFormRules<TreeForm>>({
  deptId: [{ required: true, message: $t('ui.formRules.required') }],
  parentId: [{ required: true, message: $t('ui.formRules.selectRequired') }],
  treeName: [{ required: true, message: $t('ui.formRules.required') }],
  userId: [{ required: true, message: $t('ui.formRules.required') }],
  version: [{ required: true, message: $t('ui.formRules.required') }],
});

async function setupTreeSelect() {
  const listData = await treeList();
  treeData.value = listToTree(listData, { id: 'id', pid: 'parentId' });
}

const [BasicModal, modalApi] = useVbenModal({
  fullscreenButton: false,
  onCancel: handleCancel,
  onConfirm: handleConfirm,
  onOpenChange: async (isOpen) => {
    if (!isOpen) {
      return null;
    }
    modalApi.modalLoading(true);

    const { id } = modalApi.getData() as { id?: number | string };
    isUpdate.value = !!id;

    if (isUpdate.value && id) {
      const record = await treeInfo(id);
      formData.value = {
        ...getDefaultValues(),
        ...record,
      };
    }
    await setupTreeSelect();

    modalApi.modalLoading(false);
  },
});

async function handleConfirm() {
  try {
    modalApi.modalLoading(true);
    await formInstance.value?.validate();
    const data = cloneDeep(formData.value);
    await (isUpdate.value ? treeUpdate(data) : treeAdd(data));
    emit('reload');
    await handleCancel();
  } catch (error) {
    console.error(error);
  } finally {
    modalApi.modalLoading(false);
  }
}

async function handleCancel() {
  modalApi.close();
  formData.value = getDefaultValues();
  formInstance.value?.resetFields();
}
</script>

<template>
  <BasicModal :close-on-click-modal="false" :title="title" :width="550">
    <Form
      ref="formInstance"
      :model="formData"
      :label-col="{ style: { width: '80px' } }"
    >
      <FormItem label="父id" name="parentId" :rules="formRules.parentId">
        <TreeSelect
          class="w-full"
          :field-names="{ label: 'treeName', value: 'id' }"
          :get-popup-container="getPopupContainer"
          :tree-data="treeData"
          tree-default-expand-all
          :tree-line="{ showLeafIcon: false }"
          v-model:value="formData.parentId"
        />
      </FormItem>
      <FormItem label="部门id" name="deptId" :rules="formRules.deptId">
        <Input allow-clear class="w-full" v-model:value="formData.deptId" />
      </FormItem>
      <FormItem label="用户id" name="userId" :rules="formRules.userId">
        <Input allow-clear class="w-full" v-model:value="formData.userId" />
      </FormItem>
      <FormItem label="值" name="treeName" :rules="formRules.treeName">
        <Input allow-clear class="w-full" v-model:value="formData.treeName" />
      </FormItem>
      <FormItem label="版本" name="version" :rules="formRules.version">
        <InputNumber class="w-full" v-model:value="formData.version" />
      </FormItem>
    </Form>
  </BasicModal>
</template>
