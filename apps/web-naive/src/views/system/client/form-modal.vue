<script setup lang="ts">
import { useVbenModal } from '@vben/common-ui';
import { cloneDeep } from '@vben/utils';

import { requestClient } from '#/api/request';

const emit = defineEmits<{ reload: [] }>();

const message = useMessage();

// 表单类型
export type FormType = 'add' | 'update';
const currentType: Ref<FormType> = ref('add');

// 表单不同类型参数
const formTypeData: Record<FormType, Record<string, any>> = {
  add: {
    title: '新增授权管理对象 sys_client',
    url: '/system/client/add',
  },
  update: {
    title: '编辑授权管理对象 sys_client',
    url: '/system/client/update',
  },
};

// 当前表单类型参数
const currentFormTypeData = computed(() => {
  return formTypeData[currentType.value];
});

// 表单字段配置
const [ClientForm, formApi] = useVbenForm({
  schema: [
    {
      label: '主键',
      fieldName: 'id',
      component: 'Input',
      dependencies: {
        // 使用css方式隐藏 但仍然可赋值
        show: () => false,
        // 注意这个一定要为['']  否则不能被正常隐藏
        triggerFields: [''],
      },
    },
    {
      fieldName: 'clientId',
      label: '客户端id',
      component: 'Input',
      rules: 'required',
      componentProps: {
        placeholder: '请输入客户端id',
      },
    },
    {
      fieldName: 'clientKey',
      label: '客户端key',
      component: 'Input',
      rules: 'required',
      componentProps: {
        placeholder: '请输入客户端key',
      },
    },
    {
      fieldName: 'clientSecret',
      label: '客户端秘钥',
      component: 'Input',
      rules: 'required',
      componentProps: {
        placeholder: '请输入客户端秘钥',
      },
    },
    {
      fieldName: 'activeTimeout',
      label: 'token活跃超时时间',
      component: 'Input',
      rules: 'required',
      componentProps: {
        placeholder: '请输入token活跃超时时间',
      },
    },
    {
      fieldName: 'timeout',
      label: 'token固定超时时间',
      component: 'Input',
      rules: 'required',
      componentProps: {
        placeholder: '请输入token固定超时时间',
      },
    },
  ],
  showDefaultActions: false,
});

// 授权管理对象 sys_client表单弹窗
const [FormModel, formModelApi] = useVbenModal({
  onConfirm: handleConfirm,
  onOpenChange(isOpen: boolean) {
    if (isOpen) {
      const { formType, row } = formModelApi.getData<Record<string, any>>();
      currentType.value = formType;
      if (row) {
        formApi.setValues(row);
      }
    }
  },
});

// 表单提交
async function handleConfirm() {
  const loading = message.loading(`正在${currentFormTypeData.value.title}...`);
  try {
    // 锁定表单弹窗禁止操作
    formModelApi.lock();

    // 校验表单
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }

    // 表单数据
    const data = cloneDeep(await formApi.getValues());
    await requestClient.post(currentFormTypeData.value.url, {
      ...data,
      category: 'default',
    });

    // 提示成功
    message.success(`${currentFormTypeData.value.title}成功`);

    // 刷新表格
    emit('reload');
    // 关闭表单弹窗
    formModelApi.close();
  } catch (error) {
    console.error(error);
  } finally {
    // 解锁表单弹窗
    formModelApi.lock(false);
    loading.destroy();
  }
}
</script>
<template>
  <FormModel :title="currentFormTypeData.title">
    <ClientForm />
  </FormModel>
</template>
