<script setup lang="ts">
import { useVbenModal } from '@vben/common-ui';
import { cloneDeep, getPopupContainer } from '@vben/utils';

import { requestClient } from '#/api/request';

const emit = defineEmits<{ reload: [] }>();

const message = useMessage();

// 表单类型
export type FormType = 'add' | 'update';
const currentType: Ref<FormType> = ref('add');

// 表单不同类型参数
const formTypeData: Record<FormType, Record<string, any>> = {
  add: {
    title: '新增用户信息',
    url: '/system/user/add',
  },
  update: {
    title: '编辑用户信息',
    url: '/system/user/update',
  },
};

// 当前表单类型参数
const currentFormTypeData = computed(() => {
  return formTypeData[currentType.value];
});

// 表单字段配置
const [UserForm, formApi] = useVbenForm({
  schema: [
    {
      label: '用户ID',
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
      fieldName: 'userName',
      label: '账号',
      component: 'Input',
      rules: 'required',
      componentProps: {
        placeholder: '请输入用户账号',
      },
    },
    {
      fieldName: 'password',
      label: '密码',
      component: 'Input',
      rules: 'required',
      defaultValue: '123456',
      componentProps: {
        type: 'password',
        showPasswordOn: 'click',
        placeholder: '请输入密码',
      },
    },
    {
      fieldName: 'nickName',
      label: '昵称',
      component: 'Input',
      rules: 'required',
      componentProps: {
        placeholder: '请输入用户昵称',
      },
    },
    {
      fieldName: 'deptId',
      label: '所属部门',
      rules: 'required',
      component: 'TreeSelect',
      componentProps: {
        placeholder: '请选择部门',
        getPopupContainer,
        keyField: 'id',
        labelField: 'label',
        showPath: true,
        defaultExpandAll: true,
        virtualScroll: false,
      },
    },
    {
      fieldName: 'roleIds',
      label: '角色',
      rules: 'required',
      component: 'Select',
      componentProps: {
        placeholder: '请选择角色',
        getPopupContainer,
        keyField: 'id',
        labelField: 'label',
      },
    },
    {
      fieldName: 'phonenumber',
      label: '手机号码',
      component: 'Input',
      componentProps: {
        placeholder: '请输入手机号码',
      },
    },
    {
      fieldName: 'email',
      label: '邮箱',
      component: 'Input',
      componentProps: {
        placeholder: '请输入用户邮箱',
      },
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Input',
      componentProps: {
        placeholder: '请输入备注',
      },
    },
  ],
  showDefaultActions: false,
});

// 用户信息表单弹窗
const [FormModel, formModelApi] = useVbenModal({
  onConfirm: handleConfirm,
  async onOpenChange(isOpen: boolean) {
    if (isOpen) {
      const { formType, row } = formModelApi.getData<Record<string, any>>();
      currentType.value = formType;
      if (row) {
        formApi.setValues(row);
      }

      await initDeptSelect();
      await initRoleSelect();
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

async function initDeptSelect() {
  // 需要动态更新TreeSelect组件 这里允许为空
  const options = await requestClient.get('/system/dept/tree');
  formApi.updateSchema([
    {
      componentProps: {
        options,
      },
      fieldName: 'deptId',
    },
  ]);
}

async function initRoleSelect() {
  // 需要动态更新TreeSelect组件 这里允许为空
  const options = await requestClient.get('/system/user/');
  formApi.updateSchema([
    {
      componentProps: {
        options,
      },
      fieldName: 'roleIds',
    },
  ]);
}
</script>
<template>
  <FormModel :title="currentFormTypeData.title">
    <UserForm />
  </FormModel>
</template>
