<script setup lang="ts">
import { useVbenForm } from '@vben/common-ui';
import { getPopupContainer } from '@vben/utils';

/**
 * 从父组件注入
 */
const genInfoData = inject<any>('genInfoData');

// 当genInfoData有值时，设置表单值
watch(genInfoData, async (val) => {
  if (val) {
    const info = genInfoData.value?.info;
    await formApi.setValues(info);
  }
});

onMounted(async () => {});
const [BasicForm, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
      formItemClass: 'col-span-1',
    },
    labelWidth: 150,
  },
  schema: [
    {
      component: 'Divider',
      componentProps: {
        orientation: 'left',
      },
      fieldName: 'divider2',
      formItemClass: 'col-span-2',
      label: '生成信息',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: false,
      },
      dependencies: {
        show: (values) => values.tplCategory === 'tree',
        triggerFields: ['tplCategory'],
      },
      fieldName: 'treeParentCode',
      help: '树节点显示的父编码字段名， 如: parent_Id (相当于parentId)',
      label: '树父编码字段',
      rules: 'selectRequired',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: false,
      },
      dependencies: {
        show: (values) => values.tplCategory === 'tree',
        triggerFields: ['tplCategory'],
      },
      fieldName: 'treeName',
      help: '树节点的显示名称字段名， 如: dept_name (相当于label)',
      label: '树名称字段',
      rules: 'selectRequired',
    },
    {
      component: 'Input',
      fieldName: 'packageName',
      help: '生成在哪个java包下, 例如 com.ruoyi.system',
      label: '生成包路径',
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'moduleName',
      help: '可理解为子系统名，例如 system',
      label: '生成模块名',
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'businessName',
      help: '可理解为功能英文名，例如 user',
      label: '生成业务名',
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'functionName',
      help: '用作类描述，例如 用户',
      label: '生成功能名',
      rules: 'required',
    },
    {
      component: 'TreeSelect',
      componentProps: {
        allowClear: false,
        getPopupContainer,
      },
      defaultValue: 0,
      fieldName: 'parentMenuId',
      label: '上级菜单',
    },
    // {
    //   component: 'RadioGroup',
    //   componentProps: {
    //     buttonStyle: 'solid',
    //     options: [
    //       { label: 'modal弹窗', value: 'modal' },
    //       { label: 'drawer抽屉', value: 'drawer' },
    //     ],
    //     optionType: 'button',
    //   },
    //   help: '自定义功能, 需要后端支持',
    //   defaultValue: 'modal',
    //   fieldName: 'popupComponent',
    //   label: '弹窗组件类型',
    // },
    // {
    //   component: 'RadioGroup',
    //   componentProps: {
    //     buttonStyle: 'solid',
    //     options: [
    //       { label: 'useVbenForm', value: 'useForm' },
    //       { label: 'antd原生表单', value: 'native' },
    //     ],
    //     optionType: 'button',
    //   },
    //   help: '自定义功能, 需要后端支持\n复杂(布局, 联动等)表单建议用antd原生表单',
    //   defaultValue: 'useForm',
    //   fieldName: 'formComponent',
    //   label: '生成表单类型',
    // },
    {
      component: 'Divider',
      componentProps: {
        orientation: 'left',
      },
      fieldName: 'divider1',
      formItemClass: 'col-span-2',
      label: '对象信息',
    },
    {
      component: 'Input',
      fieldName: 'tableName',
      label: '表名称',
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'tableComment',
      label: '表描述',
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'className',
      label: '实体类名称',
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'functionAuthor',
      label: '作者',
      rules: 'required',
    },

    {
      component: 'Textarea',
      fieldName: 'remark',
      formItemClass: 'col-span-2',
      label: '备注',
    },
  ],
  showDefaultActions: false,
  wrapperClass: 'grid-cols-2',
});

/**
 * 校验表单
 */
async function validateForm() {
  const { valid } = await formApi.validate();
  if (!valid) {
    return false;
  }
  return true;
}

/**
 * 获取表单值
 */
async function getFormValues() {
  return await formApi.getValues();
}

defineExpose({
  validateForm,
  getFormValues,
});
</script>
<template>
  <BasicForm />
</template>
