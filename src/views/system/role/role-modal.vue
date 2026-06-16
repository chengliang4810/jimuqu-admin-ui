<script setup lang="ts">
import type { Role } from '@/api/system/role/model';
import type { AntdFormRules } from '@/types/form';
import type { FormInstance } from 'antdv-next';

import { computed, ref } from 'vue';

import { roleAdd, roleInfo, roleUpdate } from '@/api/system/role';
import {
  FormInput as Input,
  FormInputNumber as InputNumber,
  FormSelect as Select,
  FormTextArea as TextArea,
} from '@/components/global/form';
import { DictEnum } from '@/constants';
import { useVbenModal } from '@/effects/common-ui';
import { $t } from '@/locales';
import { cloneDeep, getPopupContainer } from '@/utils';
import { getDictOptions } from '@/utils/dict';
import { useBeforeCloseDiff } from '@/utils/popup';
import { Form, FormItem } from 'antdv-next';

const emit = defineEmits<{ reload: [] }>();

const isUpdate = ref(false);
const title = computed(() => {
  return isUpdate.value ? $t('pages.common.edit') : $t('pages.common.add');
});

type FormData = Partial<Role> & {
  deptIds?: (number | string)[];
  menuIds?: (number | string)[];
};

function getDefaultValues(): FormData {
  return {
    deptIds: [],
    menuIds: [],
    remark: '',
    roleId: undefined,
    roleKey: '',
    roleName: '',
    roleSort: 1,
    status: '0',
  };
}

const formData = ref<FormData>(getDefaultValues());
const formInstance = ref<FormInstance>();

const formRules = ref<AntdFormRules<FormData>>({
  roleKey: [{ required: true, message: $t('ui.formRules.required') }],
  roleName: [{ required: true, message: $t('ui.formRules.required') }],
  roleSort: [{ required: true, message: $t('ui.formRules.required') }],
  status: [{ required: true, message: $t('ui.formRules.selectRequired') }],
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
  width: 550,
  onBeforeClose,
  onClosed: handleClosed,
  onConfirm: handleConfirm,
  async onOpenChange(isOpen) {
    if (!isOpen) {
      return null;
    }
    modalApi.modalLoading(true);

    const { id } = modalApi.getData() as { id?: number | string };
    isUpdate.value = !!id;

    if (isUpdate.value && id) {
      const record = await roleInfo(id);
      formData.value = {
        ...getDefaultValues(),
        deptIds: [],
        menuIds: [],
        remark: record.remark ?? '',
        roleId: record.roleId,
        roleKey: record.roleKey,
        roleName: record.roleName,
        roleSort: record.roleSort,
        status: record.status,
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
    await (isUpdate.value ? roleUpdate(data) : roleAdd(data));
    emit('reload');
    resetInitialized();
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
      <div class="grid grid-cols-1 gap-x-4 lg:grid-cols-2">
        <FormItem label="角色名称" name="roleName" :rules="formRules.roleName">
          <Input allow-clear class="w-full" v-model:value="formData.roleName" />
        </FormItem>
        <FormItem
          extra="如: test simpleUser等"
          label="权限标识"
          name="roleKey"
          :rules="formRules.roleKey"
        >
          <Input allow-clear class="w-full" v-model:value="formData.roleKey" />
        </FormItem>
        <FormItem label="角色排序" name="roleSort" :rules="formRules.roleSort">
          <InputNumber
            v-model:value="formData.roleSort"
            :style="{ width: '100%' }"
          />
        </FormItem>
        <FormItem
          extra="修改后, 拥有该角色的用户将自动下线."
          label="角色状态"
          name="status"
          :rules="formRules.status"
        >
          <Select
            class="w-full"
            :allow-clear="false"
            :get-popup-container="getPopupContainer"
            :options="getDictOptions(DictEnum.SYS_NORMAL_DISABLE)"
            v-model:value="formData.status"
          />
        </FormItem>
      </div>
      <FormItem label="备注" name="remark">
        <TextArea allow-clear class="w-full" v-model:value="formData.remark" />
      </FormItem>
    </Form>
  </BasicModal>
</template>
