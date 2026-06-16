<script setup lang="ts">
import type { AntdFormRules } from '@/types/form';
import type { FormInstance } from 'antdv-next';

import { computed, ref } from 'vue';

import {
  categoryAdd,
  categoryInfo,
  categoryList,
  categoryUpdate,
} from '@/api/workflow/category';
import {
  FormInput as Input,
  FormInputNumber as InputNumber,
  FormTreeSelect as TreeSelect,
} from '@/components/global/form';
import { useVbenModal } from '@/effects/common-ui';
import { $t } from '@/locales';
import { addFullName, cloneDeep, getPopupContainer, listToTree } from '@/utils';
import { useBeforeCloseDiff } from '@/utils/popup';
import { Form, FormItem } from 'antdv-next';

const emit = defineEmits<{ reload: [] }>();

const isUpdate = ref(false);
const title = computed(() => {
  return isUpdate.value ? $t('pages.common.edit') : $t('pages.common.add');
});

interface FormData {
  categoryId?: number | string;
  categoryName?: string;
  orderNum?: number;
  parentId?: number | string;
}

function getDefaultValues(): FormData {
  return {
    categoryId: undefined,
    categoryName: '',
    orderNum: undefined,
    parentId: 100,
  };
}

const formData = ref<FormData>(getDefaultValues());
const formInstance = ref<FormInstance>();
const treeData = ref<any[]>([]);

const formRules = ref<AntdFormRules<FormData>>({
  categoryName: [{ required: true, message: $t('ui.formRules.required') }],
  parentId: [{ required: true, message: $t('ui.formRules.selectRequired') }],
});

function formValueGetter() {
  return JSON.stringify(formData.value);
}

async function setupCategorySelect() {
  const listData = await categoryList();
  treeData.value = listToTree(listData, {
    id: 'categoryId',
    pid: 'parentId',
  });
  addFullName(treeData.value, 'categoryName', ' / ');
}

const { onBeforeClose, markInitialized, resetInitialized } = useBeforeCloseDiff(
  {
    initializedGetter: formValueGetter,
    currentGetter: formValueGetter,
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

    const { id, parentId } = modalApi.getData() as {
      id?: number | string;
      parentId?: number | string;
    };
    isUpdate.value = !!id;

    if (isUpdate.value && id) {
      const record = await categoryInfo(id);
      formData.value = {
        ...getDefaultValues(),
        ...record,
      };
    }
    if (parentId) {
      formData.value.parentId = parentId;
    }
    await setupCategorySelect();
    await markInitialized();

    modalApi.modalLoading(false);
  },
});

async function handleConfirm() {
  try {
    modalApi.lock(true);
    await formInstance.value?.validate();
    const data = cloneDeep(formData.value);
    await (isUpdate.value ? categoryUpdate(data) : categoryAdd(data));
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
  <BasicModal :title="title" class="min-h-[500px]">
    <Form
      ref="formInstance"
      :model="formData"
      :label-col="{ style: { width: '80px' } }"
    >
      <FormItem label="父级分类" name="parentId" :rules="formRules.parentId">
        <TreeSelect
          class="w-full"
          :field-names="{ label: 'categoryName', value: 'categoryId' }"
          :get-popup-container="getPopupContainer"
          :tree-data="treeData"
          tree-default-expand-all
          :tree-line="{ showLeafIcon: false }"
          tree-node-label-prop="fullName"
          v-model:value="formData.parentId"
        />
      </FormItem>
      <FormItem
        label="分类名称"
        name="categoryName"
        :rules="formRules.categoryName"
      >
        <Input allow-clear class="w-full" v-model:value="formData.categoryName" />
      </FormItem>
      <FormItem label="排序" name="orderNum">
        <InputNumber class="w-full" v-model:value="formData.orderNum" />
      </FormItem>
    </Form>
  </BasicModal>
</template>
