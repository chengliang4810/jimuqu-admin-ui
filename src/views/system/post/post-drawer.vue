<script setup lang="ts">
import type { Post } from '@/api/system/post/model';
import type { DeptTree } from '@/api/system/user/model';
import type { AntdFormRules } from '@/types/form';
import type { FormInstance } from 'antdv-next';

import { computed, ref } from 'vue';

import { postAdd, postInfo, postUpdate } from '@/api/system/post';
import { getDeptTree } from '@/api/system/user';
import {
  FormInput as Input,
  FormInputNumber as InputNumber,
  FormTextArea as TextArea,
  FormTreeSelect as TreeSelect,
} from '@/components/global/form';
import { DictEnum } from '@/constants';
import { useVbenDrawer } from '@/components';
import { $t } from '@/locales';
import { addFullName, cloneDeep, getPopupContainer } from '@/utils';
import { getDictOptions } from '@/utils/dict';
import { useBeforeCloseDiff } from '@/utils/popup';
import { Form, FormItem, RadioGroup } from 'antdv-next';

const emit = defineEmits<{ reload: [] }>();

const isUpdate = ref(false);
const title = computed(() => {
  return isUpdate.value ? $t('pages.common.edit') : $t('pages.common.add');
});

type FormData = Partial<Post> & {
  deptId?: number | string;
  postCategory?: string;
};

function getDefaultValues(): FormData {
  return {
    deptId: undefined,
    postCategory: '',
    postCode: '',
    postId: undefined,
    postName: '',
    postSort: 1,
    remark: '',
    status: '0',
  };
}

const formData = ref<FormData>(getDefaultValues());
const formInstance = ref<FormInstance>();
const deptTreeData = ref<DeptTree[]>([]);

const formRules = ref<AntdFormRules<FormData>>({
  deptId: [{ required: true, message: $t('ui.formRules.selectRequired') }],
  postCode: [{ required: true, message: $t('ui.formRules.required') }],
  postName: [{ required: true, message: $t('ui.formRules.required') }],
  postSort: [{ required: true, message: $t('ui.formRules.required') }],
  status: [{ required: true, message: $t('ui.formRules.required') }],
});

async function setupDeptSelect() {
  const deptTree = await getDeptTree();
  // 选中后显示在输入框的值 即父节点 / 子节点
  addFullName(deptTree, 'label', ' / ');
  deptTreeData.value = deptTree;
}

function customFormValueGetter() {
  return JSON.stringify(formData.value);
}

const { onBeforeClose, markInitialized, resetInitialized } = useBeforeCloseDiff(
  {
    initializedGetter: customFormValueGetter,
    currentGetter: customFormValueGetter,
  },
);

const [BasicDrawer, drawerApi] = useVbenDrawer({
  onBeforeClose,
  onClosed: handleClosed,
  onConfirm: handleConfirm,
  async onOpenChange(isOpen) {
    if (!isOpen) {
      return null;
    }
    drawerApi.drawerLoading(true);
    const { id } = drawerApi.getData() as { id?: number | string };
    isUpdate.value = !!id;
    // 初始化
    await setupDeptSelect();
    // 更新 && 赋值
    if (isUpdate.value && id) {
      const record = await postInfo(id);
      formData.value = {
        ...getDefaultValues(),
        ...record,
        remark: record.remark ?? '',
      };
    }
    await markInitialized();
    drawerApi.drawerLoading(false);
  },
});

async function handleConfirm() {
  try {
    drawerApi.lock(true);
    await formInstance.value?.validate();
    const data = cloneDeep(formData.value);
    await (isUpdate.value ? postUpdate(data) : postAdd(data));
    resetInitialized();
    emit('reload');
    drawerApi.close();
  } catch (error) {
    console.error(error);
  } finally {
    drawerApi.lock(false);
  }
}

async function handleClosed() {
  formData.value = getDefaultValues();
  formInstance.value?.resetFields();
  deptTreeData.value = [];
  resetInitialized();
}
</script>

<template>
  <BasicDrawer :title="title" :size="600">
    <Form
      ref="formInstance"
      :model="formData"
      :label-col="{ style: { width: '80px' } }"
    >
      <FormItem label="所属部门" name="deptId" :rules="formRules.deptId">
        <TreeSelect
          allow-clear
          class="w-full"
          :field-names="{ label: 'label', value: 'id', children: 'children' }"
          :get-popup-container="getPopupContainer"
          show-search
          :tree-data="deptTreeData"
          tree-default-expand-all
          :tree-line="{ showLeafIcon: false }"
          tree-node-filter-prop="label"
          tree-node-label-prop="fullName"
          v-model:value="formData.deptId"
        />
      </FormItem>
      <FormItem label="岗位名称" name="postName" :rules="formRules.postName">
        <Input allow-clear class="w-full" v-model:value="formData.postName" />
      </FormItem>
      <FormItem label="岗位编码" name="postCode" :rules="formRules.postCode">
        <Input allow-clear class="w-full" v-model:value="formData.postCode" />
      </FormItem>
      <FormItem label="类别编码" name="postCategory">
        <Input
          allow-clear
          class="w-full"
          v-model:value="formData.postCategory"
        />
      </FormItem>
      <FormItem label="岗位排序" name="postSort" :rules="formRules.postSort">
        <InputNumber
          :style="{ width: '100%' }"
          v-model:value="formData.postSort"
        />
      </FormItem>
      <FormItem label="岗位状态" name="status" :rules="formRules.status">
        <RadioGroup
          button-style="solid"
          option-type="button"
          :options="getDictOptions(DictEnum.SYS_NORMAL_DISABLE)"
          v-model:value="formData.status"
        />
      </FormItem>
      <FormItem label="备注" name="remark">
        <TextArea allow-clear class="w-full" v-model:value="formData.remark" />
      </FormItem>
    </Form>
  </BasicDrawer>
</template>
