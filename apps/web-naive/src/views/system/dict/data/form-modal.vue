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
    title: '新增字典数据',
    url: '/system/dict/data/add',
  },
  update: {
    title: '编辑字典数据',
    url: '/system/dict/data/update',
  },
};

// 当前表单类型参数
const currentFormTypeData = computed(() => {
  return formTypeData[currentType.value];
});

// 表单字段配置
const [DictDataForm, formApi] = useVbenForm({
  schema: [
    {
      label: '字典ID',
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
      fieldName: 'parentId',
      label: '父级ID',
      component: 'Input',
      rules: 'required',
      componentProps: {
        placeholder: '请输入父级ID',
      },
    },
    {
      fieldName: 'dictSort',
      label: '字典排序',
      component: 'Input',
      rules: 'required',
      componentProps: {
        placeholder: '请输入字典排序',
      },
    },
    {
      fieldName: 'dictLabel',
      label: '字典标签',
      component: 'Input',
      rules: 'required',
      componentProps: {
        placeholder: '请输入字典标签',
      },
    },
    {
      fieldName: 'dictValue',
      label: '字典键值',
      component: 'Input',
      rules: 'required',
      componentProps: {
        placeholder: '请输入字典键值',
      },
    },
    {
      fieldName: 'dictTypeKey',
      label: '字典类型',
      component: 'Input',
      rules: 'required',
      componentProps: {
        placeholder: '请输入字典类型',
      },
    },
    {
      fieldName: 'cssClass',
      label: '样式属性',
      component: 'Input',
      rules: 'required',
      componentProps: {
        placeholder: '请输入样式属性',
      },
    },
    {
      fieldName: 'listClass',
      label: '表格回显样式',
      component: 'Input',
      rules: 'required',
      componentProps: {
        placeholder: '请输入表格回显样式',
      },
    },
    {
      fieldName: 'isDefault',
      label: '是否默认',
      component: 'Input',
      rules: 'required',
      componentProps: {
        placeholder: '请输入是否默认',
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

// 字典数据表单弹窗
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
    <DictDataForm />
  </FormModel>
</template>
