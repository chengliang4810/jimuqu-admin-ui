<script setup lang="ts">
import { useVbenModal } from '@vben/common-ui';
import {
  addFullName,
  cloneDeep,
  getPopupContainer,
  listToTree,
} from '@vben/utils';

import { z } from '#/adapter/form';
import { requestClient } from '#/api/request';
import { getDictOptions } from '#/utils/dict';

const emit = defineEmits<{ reload: [] }>();

const message = useMessage();

// 表单类型
export type FormType = 'add' | 'update';
const currentType: Ref<FormType> = ref('add');

// 表单不同类型参数
const formTypeData: Record<FormType, Record<string, any>> = {
  add: {
    title: '新增部门',
    url: '/system/dept/add',
  },
  update: {
    title: '编辑部门',
    url: '/system/dept/update',
  },
};

// 当前表单类型参数
const currentFormTypeData = computed(() => {
  return formTypeData[currentType.value];
});

// 表单字段配置
const [DeptForm, formApi] = useVbenForm({
  schema: [
    {
      component: 'Input',
      dependencies: {
        show: () => false,
        triggerFields: [''],
      },
      fieldName: 'id',
    },
    {
      component: 'Cascader',
      componentProps: {
        getPopupContainer,
      },
      dependencies: {
        show: (model) => model.parentId !== 0,
        triggerFields: ['parentId'],
      },
      fieldName: 'parentId',
      label: '上级部门',
      rules: 'selectRequired',
    },
    {
      component: 'Input',
      fieldName: 'deptName',
      label: '部门名称',
      rules: 'required',
    },
    {
      component: 'InputNumber',
      fieldName: 'orderNum',
      label: '显示排序',
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'deptCategory',
      label: '类别编码',
    },
    {
      component: 'Select',
      componentProps: {
        // 选中了就只能修改 不能重置为无负责人
        allowClear: false,
        getPopupContainer,
      },
      fieldName: 'leader',
      label: '负责人',
    },
    {
      component: 'Input',
      fieldName: 'phone',
      label: '联系电话',
      rules: z
        .string()
        .regex(/^1[3,4578]\d{9}$/, { message: '请输入正确的手机号' })
        .optional()
        .or(z.literal('')),
    },
    {
      component: 'Input',
      fieldName: 'email',
      label: '邮箱',
      rules: z
        .string()
        .email({ message: '请输入正确的邮箱' })
        .optional()
        .or(z.literal('')),
    },
    {
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        options: getDictOptions('sys_normal_disable'),
        optionType: 'button',
      },
      defaultValue: '0',
      fieldName: 'status',
      label: '状态',
    },
  ],
  showDefaultActions: false,
});

// 部门表单弹窗
const [FormModel, formModelApi] = useVbenModal({
  onConfirm: handleConfirm,
  async onOpenChange(isOpen: boolean) {
    if (isOpen) {
      const { formType, row } = formModelApi.getData<Record<string, any>>();
      currentType.value = formType;
      if (row) {
        formApi.setValues(row);
      }

      await (currentType.value === 'update' && row.id
        ? initDeptUsers(row.id)
        : setLeaderOptions());
      /** 部门选择 下拉框 */
      await initDeptSelect(row.id);
      // await markInitialized();
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

async function getDeptTree(deptId?: number | string, exclude = false) {
  let ret: any[] = [];
  ret = await (!deptId || exclude
    ? requestClient.get('/system/dept/list')
    : requestClient.get(`/system/dept/list/exclude${deptId}`));
  const treeData = listToTree(ret, { id: 'id', pid: 'parentId' });
  // 添加部门名称 如 xx-xx-xx
  addFullName(treeData, 'deptName', ' / ');
  return treeData;
}

async function initDeptSelect(deptId?: number | string) {
  // 需要动态更新TreeSelect组件 这里允许为空
  const options = await getDeptTree(deptId, currentType.value !== 'update');
  formApi.updateSchema([
    {
      componentProps: {
        valueField: 'id',
        labelField: 'deptName',
        cascade: true,
        showPath: true,
        checkStrategyIsChild: true,
        options,
        // 'default-expand-all': true,
        // 选中后显示在输入框的值
        // treeNodeLabelProp: 'fullName',
      },
      fieldName: 'parentId',
    },
  ]);
}

/**
 * 部门管理员下拉框 更新时才会enable
 * @param deptId
 */
async function initDeptUsers(_deptId: number | string) {
  // const ret = await requestClient.get(deptId);
  // const options = ret.map((user) => ({
  //   label: `${user.userName} | ${user.nickName}`,
  //   value: user.userId,
  // }));
  // formApi.updateSchema([
  //   {
  //     componentProps: {
  //       disabled: ret.length === 0,
  //       options,
  //       placeholder: ret.length === 0 ? '该部门暂无用户' : '请选择部门负责人',
  //     },
  //     fieldName: 'leader',
  //   },
  // ]);
}

async function setLeaderOptions() {
  formApi.updateSchema([
    {
      componentProps: {
        disabled: true,
        options: [],
        placeholder: '仅在更新时可选部门负责人',
      },
      fieldName: 'leader',
    },
  ]);
}
</script>
<template>
  <FormModel :title="currentFormTypeData.title">
    <DeptForm />
  </FormModel>
</template>
