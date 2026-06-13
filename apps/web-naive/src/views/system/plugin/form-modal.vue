<script setup lang="ts">
import { useVbenModal } from '@vben/common-ui';
import { cloneDeep } from '@vben/utils';

import { requestClient } from '#/api/request';

const emit = defineEmits<{ reload: [] }>();

const message = useMessage();

export type FormType = 'add' | 'update';
const currentType: Ref<FormType> = ref('add');

const formTypeData: Record<FormType, Record<string, any>> = {
  add: {
    title: '新增在线插件',
    url: '/system/plugin/add',
  },
  update: {
    title: '编辑在线插件',
    url: '/system/plugin/update',
  },
};

const currentFormTypeData = computed(() => formTypeData[currentType.value]);

const [PluginForm, formApi] = useVbenForm({
  schema: [
    {
      component: 'Input',
      dependencies: {
        show: () => false,
        triggerFields: [''],
      },
      fieldName: 'id',
      label: '插件主键',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入插件编码',
      },
      fieldName: 'pluginKey',
      label: '插件编码',
      rules: 'required',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入插件名称',
      },
      fieldName: 'pluginName',
      label: '插件名称',
      rules: 'required',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入版本号',
      },
      fieldName: 'version',
      label: '版本',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入作者',
      },
      fieldName: 'author',
      label: '作者',
    },
    {
      component: 'Select',
      componentProps: {
        options: [
          { label: '本地插件', value: 'local' },
          { label: '插件包', value: 'package' },
          { label: '业务扩展', value: 'extension' },
        ],
      },
      defaultValue: 'local',
      fieldName: 'pluginType',
      label: '插件类型',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入入口类',
      },
      fieldName: 'entryClass',
      label: '入口类',
    },
    {
      component: 'Select',
      componentProps: {
        options: [
          { label: '启用', value: 0 },
          { label: '停用', value: 1 },
        ],
      },
      defaultValue: 1,
      fieldName: 'status',
      label: '状态',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入插件包路径',
      },
      fieldName: 'packagePath',
      label: '插件包路径',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入描述文件路径',
      },
      fieldName: 'descriptorPath',
      label: '描述文件路径',
    },
    {
      component: 'Textarea',
      componentProps: {
        placeholder: '请输入插件描述',
        rows: 3,
      },
      fieldName: 'description',
      label: '插件描述',
    },
  ],
  showDefaultActions: false,
});

const [FormModel, formModelApi] = useVbenModal({
  onConfirm: handleConfirm,
  onOpenChange(isOpen: boolean) {
    if (isOpen) {
      const { formType, row } = formModelApi.getData<Record<string, any>>();
      currentType.value = formType;
      formApi.resetForm();
      formApi.setValues(row || {});
    }
  },
});

async function handleConfirm() {
  const loading = message.loading(`正在${currentFormTypeData.value.title}...`);
  try {
    formModelApi.lock();
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }

    const data = cloneDeep(await formApi.getValues());
    await requestClient.post(currentFormTypeData.value.url, data);
    message.success(`${currentFormTypeData.value.title}成功`);
    emit('reload');
    formModelApi.close();
  } catch (error) {
    console.error(error);
  } finally {
    formModelApi.lock(false);
    loading.destroy();
  }
}
</script>

<template>
  <FormModel :title="currentFormTypeData.title">
    <PluginForm />
  </FormModel>
</template>
