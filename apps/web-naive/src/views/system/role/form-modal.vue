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
    title: '新增角色信息',
    url: '/system/role/add',
  },
  update: {
    title: '编辑角色信息',
    url: '/system/role/update',
  },
};

// 当前表单类型参数
const currentFormTypeData = computed(() => {
  return formTypeData[currentType.value];
});

// 表单字段配置
const [RoleForm, formApi] = useVbenForm({
  schema: [
    {
      label: '角色ID',
      fieldName: 'roleId',
      component: 'Input',
      dependencies: {
        // 使用css方式隐藏 但仍然可赋值
        show: () => false,
        // 注意这个一定要为['']  否则不能被正常隐藏
        triggerFields: [''],
      },
    },
    {
      fieldName: 'roleName',
      label: '角色名称',
      component: 'Input',
      rules: 'required',
      componentProps: {
        placeholder: '请输入角色名称',
      },
    },
    {
      fieldName: 'roleKey',
      label: '角色权限字符串',
      component: 'Input',
      rules: 'required',
      componentProps: {
        placeholder: '请输入角色权限字符串',
      },
    },
    {
      fieldName: 'roleSort',
      label: '显示顺序',
      component: 'Input',
      rules: 'required',
      componentProps: {
        placeholder: '请输入显示顺序',
      },
    },
    {
      fieldName: 'dataScope',
      label: '数据范围',
      component: 'Input',
      rules: 'required',
      componentProps: {
        placeholder: '请输入数据范围',
      },
    },
    {
      fieldName: 'menuCheckStrictly',
      label: '菜单树选择项是否关联显示',
      component: 'Input',
      rules: 'required',
      componentProps: {
        placeholder: '请输入菜单树选择项是否关联显示',
      },
    },
    {
      fieldName: 'deptCheckStrictly',
      label: '部门树选择项是否关联显示',
      component: 'Input',
      rules: 'required',
      componentProps: {
        placeholder: '请输入部门树选择项是否关联显示',
      },
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Input',
      rules: 'required',
      componentProps: {
        placeholder: '请输入备注',
      },
    },
  ],
  showDefaultActions: false,
});

// 角色信息表单弹窗
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
    <RoleForm />
  </FormModel>
</template>
