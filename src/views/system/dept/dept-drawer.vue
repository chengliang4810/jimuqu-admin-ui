<script setup lang="ts">
import type { Dept } from '@/api/system/dept/model';
import type { AntdFormRules } from '@/types/form';
import type { FormInstance, SelectProps } from 'antdv-next';

import { computed, ref } from 'vue';

import {
  deptAdd,
  deptInfo,
  deptList,
  deptNodeList,
  deptUpdate,
} from '@/api/system/dept';
import { listUserByDeptId } from '@/api/system/user';
import { useVbenDrawer } from '@/components';
import {
  FormInput as Input,
  FormInputNumber as InputNumber,
  FormSelect as Select,
  FormTreeSelect as TreeSelect,
} from '@/components/global/form';
import { DictEnum } from '@/constants';
import { $t } from '@/locales';
import { addFullName, cloneDeep, getPopupContainer, listToTree } from '@/utils';
import { getDictOptions } from '@/utils/dict';
import { useBeforeCloseDiff } from '@/utils/popup';
import { Form, FormItem, RadioGroup } from 'antdv-next';

const emit = defineEmits<{ reload: [] }>();

interface DrawerProps {
  id?: number | string;
  update: boolean;
}

const isUpdate = ref(false);
const title = computed(() => {
  return isUpdate.value ? $t('pages.common.edit') : $t('pages.common.add');
});

type FormData = Partial<Dept> & {
  deptCategory?: string;
};
type SelectOptions = NonNullable<SelectProps['options']>;

function getDefaultValues(): FormData {
  return {
    deptCategory: '',
    deptId: undefined,
    deptName: '',
    email: '',
    leader: undefined,
    orderNum: 1,
    parentId: 0,
    phone: '',
    status: '0',
  };
}

const formData = ref<FormData>(getDefaultValues());
const formInstance = ref<FormInstance>();
const deptTreeData = ref<Dept[]>([]);
const leaderOptions = ref<SelectOptions>([]);
const leaderDisabled = ref(true);
const leaderPlaceholder = ref('仅在更新时可选部门负责人');

const formRules = ref<AntdFormRules<FormData>>({
  deptName: [{ required: true, message: $t('ui.formRules.required') }],
  email: [{ message: '请输入正确的邮箱', type: 'email' }],
  orderNum: [{ required: true, message: $t('ui.formRules.required') }],
  parentId: [{ required: true, message: $t('ui.formRules.selectRequired') }],
  phone: [{ message: '请输入正确的手机号', pattern: /^1[3,4578]\d{9}$/ }],
});

async function getDeptTree(deptId?: number | string, exclude = false) {
  const ret: Dept[] = await (!deptId || exclude
    ? deptList({})
    : deptNodeList(deptId));
  const treeData = listToTree(ret, { id: 'deptId', pid: 'parentId' });
  // 添加部门名称 如 xx-xx-xx
  addFullName(treeData, 'deptName', ' / ');
  return treeData;
}

async function initDeptSelect(deptId?: number | string) {
  // 需要动态更新TreeSelect组件 这里允许为空
  deptTreeData.value = await getDeptTree(deptId, !isUpdate.value);
}

/**
 * 部门管理员下拉框 更新时才会enable
 * @param deptId
 */
async function initDeptUsers(deptId: number | string) {
  const ret = await listUserByDeptId(deptId);
  leaderOptions.value = ret.map((user) => ({
    label: `${user.userName} | ${user.nickName}`,
    value: user.userId,
  }));
  leaderDisabled.value = ret.length === 0;
  leaderPlaceholder.value =
    ret.length === 0 ? '该部门暂无用户' : '请选择部门负责人';
}

async function setLeaderOptions() {
  leaderDisabled.value = true;
  leaderOptions.value = [];
  leaderPlaceholder.value = '仅在更新时可选部门负责人';
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

    const { id, update } = drawerApi.getData() as DrawerProps;
    isUpdate.value = update;

    if (id) {
      formData.value.parentId = id;
      if (update) {
        const record = await deptInfo(id);
        formData.value = {
          ...getDefaultValues(),
          ...record,
          email: record.email ?? '',
          leader: record.leader || undefined,
          phone: record.phone ?? '',
        };
      }
    }

    await (update && id ? initDeptUsers(id) : setLeaderOptions());
    /** 部门选择 下拉框 */
    await initDeptSelect(id);
    await markInitialized();

    drawerApi.drawerLoading(false);
  },
});

async function handleConfirm() {
  try {
    drawerApi.lock(true);
    await formInstance.value?.validate();
    const data = cloneDeep(formData.value);
    await (isUpdate.value ? deptUpdate(data) : deptAdd(data));
    resetInitialized();
    emit('reload');
    await drawerApi.close();
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
  leaderOptions.value = [];
  leaderDisabled.value = true;
  leaderPlaceholder.value = '仅在更新时可选部门负责人';
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
      <FormItem
        v-if="formData.parentId !== 0"
        label="上级部门"
        name="parentId"
        :rules="formRules.parentId"
      >
        <TreeSelect
          class="w-full"
          :field-names="{ label: 'deptName', value: 'deptId' }"
          :get-popup-container="getPopupContainer"
          show-search
          :tree-data="deptTreeData"
          tree-default-expand-all
          :tree-line="{ showLeafIcon: false }"
          tree-node-filter-prop="deptName"
          tree-node-label-prop="fullName"
          v-model:value="formData.parentId"
        />
      </FormItem>
      <FormItem label="部门名称" name="deptName" :rules="formRules.deptName">
        <Input allow-clear class="w-full" v-model:value="formData.deptName" />
      </FormItem>
      <FormItem label="显示排序" name="orderNum" :rules="formRules.orderNum">
        <InputNumber
          class="w-full"
          v-model:value="formData.orderNum"
          :style="{ width: '100%' }"
        />
      </FormItem>
      <FormItem label="类别编码" name="deptCategory">
        <Input
          allow-clear
          class="w-full"
          v-model:value="formData.deptCategory"
        />
      </FormItem>
      <FormItem label="负责人员" name="leader">
        <Select
          class="w-full"
          :allow-clear="false"
          :disabled="leaderDisabled"
          :get-popup-container="getPopupContainer"
          :options="leaderOptions"
          :placeholder="leaderPlaceholder"
          v-model:value="formData.leader"
        />
      </FormItem>
      <FormItem label="手机号码" name="phone" :rules="formRules.phone">
        <Input allow-clear class="w-full" v-model:value="formData.phone" />
      </FormItem>
      <FormItem label="电子邮箱" name="email" :rules="formRules.email">
        <Input allow-clear class="w-full" v-model:value="formData.email" />
      </FormItem>
      <FormItem label="部门状态" name="status">
        <RadioGroup
          button-style="solid"
          option-type="button"
          :options="getDictOptions(DictEnum.SYS_NORMAL_DISABLE)"
          v-model:value="formData.status"
        />
      </FormItem>
    </Form>
  </BasicDrawer>
</template>
