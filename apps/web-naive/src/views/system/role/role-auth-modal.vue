<script setup lang="ts">
import { useVbenModal } from '@vben/common-ui';
import { cloneDeep, getPopupContainer } from '@vben/utils';

import { requestClient } from '#/api/request';

const emit = defineEmits<{ reload: [] }>();

const message = useMessage();

/**
 * authScopeOptions user也会用到
 */
const authScopeOptions = [
  { type: 'info', label: '全部数据权限', value: '1' },
  // { type: 'default', label: '自定数据权限', value: '2' },
  { type: 'success', label: '本部门数据权限', value: '3' },
  { type: 'warning', label: '本部门及以下数据权限', value: '4' },
  { type: 'error', label: '仅本人数据权限', value: '5' },
  { type: 'warning', label: '部门及以下或本人数据权限', value: '6' },
];

// 表单字段配置
const [RoleForm, formApi] = useVbenForm({
  schema: [
    {
      label: '角色ID',
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
      component: 'Input',
      dependencies: {
        show: () => false,
        triggerFields: [''],
      },
      fieldName: 'roleId',
      label: '角色ID',
    },
    {
      component: 'Radio',
      dependencies: {
        show: () => false,
        triggerFields: [''],
      },
      fieldName: 'deptCheckStrictly',
      label: 'deptCheckStrictly',
    },
    {
      component: 'Input',
      componentProps: {
        disabled: true,
      },
      fieldName: 'roleName',
      label: '角色名称',
    },
    {
      component: 'Input',
      componentProps: {
        disabled: true,
      },
      fieldName: 'roleKey',
      label: '权限标识',
    },
    {
      component: 'Input',
      componentProps: {
        disabled: true,
      },
      dependencies: {
        // 使用css方式隐藏 但仍然可赋值
        show: () => false,
        // 注意这个一定要为['']  否则不能被正常隐藏
        triggerFields: [''],
      },
      fieldName: 'roleSort',
      label: '排序',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: false,
        getPopupContainer,
        options: authScopeOptions,
      },
      fieldName: 'dataScope',
      help: '更改后需要用户重新登录才能生效',
      label: '权限范围',
    },
    // {
    //   component: 'TreeSelect',
    //   defaultValue: [],
    //   dependencies: {
    //     show: (values) => values.dataScope === '2',
    //     triggerFields: ['dataScope'],
    //   },
    //   fieldName: 'deptIds',
    //   help: '更改后立即生效',
    //   label: '部门权限',
    // },
  ],
  showDefaultActions: false,
});

// 角色信息表单弹窗
const [FormModel, formModelApi] = useVbenModal({
  onConfirm: handleConfirm,
  async onOpenChange(isOpen: boolean) {
    if (isOpen) {
      const { row } = formModelApi.getData<Record<string, any>>();
      const roleInfo = await requestClient.get(`/system/role/${row.id}`);
      formApi.setValues(roleInfo);
    }
  },
});

// 表单提交
async function handleConfirm() {
  const loading = message.loading(`正在提交数据...`);
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
    await requestClient.post('/system/role/update', {
      ...data,
    });

    // 提示成功
    message.success(`更新成功`);

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
  <FormModel title="分配数据权限">
    <RoleForm />
  </FormModel>
</template>
