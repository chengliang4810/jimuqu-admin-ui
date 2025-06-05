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
      fieldName: 'roleIds',
      label: '角色',
      rules: 'required',
      component: 'Select',
      componentProps: {
        multiple: true,
        placeholder: '请选择角色',
        getPopupContainer,
        valueField: 'id',
        labelField: 'roleName',
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
      const isUpdate = currentType.value === 'update';
      /** update时 禁用用户名修改 不显示密码框 */
      formApi.updateSchema([
        { componentProps: { disabled: isUpdate }, fieldName: 'userName' },
        {
          dependencies: { show: () => !isUpdate, triggerFields: ['id'] },
          fieldName: 'password',
        },
      ]);

      await initDeptSelect();
      await initRoleSelect(row, isUpdate);
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
  // 新增时默认选择第一个
  formApi.setFieldValue('deptId', options?.[0].id);
}

async function initRoleSelect(row: any, isUpdate: boolean = false) {
  // 需要动态更新TreeSelect组件 这里允许为空
  const { roles, user, postIds, roleIds } = await requestClient.get(
    `/system/user/${isUpdate ? row.id : ''}`,
  );
  if (user) {
    // 添加角色和岗位
    formApi.setFieldValue('postIds', postIds);
    formApi.setFieldValue('roleIds', roleIds);
  }

  // 添加基础信息
  formApi.setValues(user || row);

  formApi.updateSchema([
    {
      componentProps: {
        options: roles,
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
