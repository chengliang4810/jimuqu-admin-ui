<script setup lang="ts">
import { useVbenModal } from '@vben/common-ui';
import { cloneDeep, getPopupContainer } from '@vben/utils';

import { requestClient } from '#/api/request';

const emit = defineEmits<{ reload: [] }>();

const message = useMessage();

export type FormType = 'add' | 'update';

interface JobHandlerVo {
  handlerKey: string;
  handlerName: string;
  beanName: string;
  methodName: string;
}

const currentType = ref<FormType>('add');

const formTypeData: Record<FormType, { title: string; url: string }> = {
  add: {
    title: '新增定时任务',
    url: '/system/job/add',
  },
  update: {
    title: '编辑定时任务',
    url: '/system/job/update',
  },
};

const currentFormTypeData = computed(() => formTypeData[currentType.value]);

async function loadHandlers() {
  const handlers = await requestClient.get<JobHandlerVo[]>(
    '/system/job/handlers',
  );
  const options = handlers.map((item) => ({
    label: `${item.handlerName || item.handlerKey}（${item.handlerKey}）`,
    value: item.handlerKey,
  }));

  formApi.updateSchema([
    {
      componentProps: {
        clearable: true,
        filterable: true,
        getPopupContainer,
        options,
        placeholder: '请选择处理器',
      },
      fieldName: 'handlerKey',
    },
  ]);
}

const [JobForm, formApi] = useVbenForm({
  schema: [
    {
      component: 'Input',
      dependencies: {
        show: () => false,
        triggerFields: [''],
      },
      fieldName: 'id',
      label: '任务ID',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入任务名称',
      },
      fieldName: 'jobName',
      label: '任务名称',
      rules: 'required',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '默认 DEFAULT',
      },
      fieldName: 'jobGroup',
      label: '任务分组',
    },
    {
      component: 'Select',
      componentProps: {
        clearable: true,
        filterable: true,
        getPopupContainer,
        options: [],
        placeholder: '请选择处理器',
      },
      fieldName: 'handlerKey',
      label: '处理器',
      rules: 'required',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '例如：0/30 * * * * ?',
      },
      fieldName: 'cronExpression',
      label: 'Cron表达式',
      rules: 'required',
    },
    {
      component: 'RadioGroup',
      componentProps: {
        options: [
          { label: '启用', value: 0 },
          { label: '停用', value: 1 },
        ],
      },
      defaultValue: 1,
      fieldName: 'status',
      label: '任务状态',
      rules: 'required',
    },
    {
      component: 'RadioGroup',
      componentProps: {
        options: [
          { label: '允许', value: true },
          { label: '禁止', value: false },
        ],
      },
      defaultValue: false,
      fieldName: 'allowConcurrent',
      label: '并发执行',
    },
    {
      component: 'Textarea',
      componentProps: {
        autosize: {
          maxRows: 8,
          minRows: 3,
        },
        placeholder: '请输入处理器参数JSON，可留空',
      },
      fieldName: 'handlerParam',
      label: '任务参数',
    },
    {
      component: 'Textarea',
      componentProps: {
        autosize: {
          maxRows: 5,
          minRows: 2,
        },
        placeholder: '请输入备注',
      },
      fieldName: 'remark',
      label: '备注',
    },
  ],
  showDefaultActions: false,
});

const [FormModal, formModalApi] = useVbenModal({
  onConfirm: handleConfirm,
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }

    await loadHandlers();
    const { formType, row } = formModalApi.getData<Record<string, any>>();
    currentType.value = formType;
    formApi.resetForm();
    formApi.setValues({
      allowConcurrent: false,
      jobGroup: 'DEFAULT',
      status: 1,
      ...row,
    });
  },
});

async function handleConfirm() {
  const loading = message.loading(`正在${currentFormTypeData.value.title}...`);
  try {
    formModalApi.lock();

    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }

    const data = cloneDeep(await formApi.getValues());
    await requestClient.post(currentFormTypeData.value.url, data);
    message.success(`${currentFormTypeData.value.title}成功`);
    emit('reload');
    formModalApi.close();
  } finally {
    formModalApi.lock(false);
    loading.destroy();
  }
}
</script>

<template>
  <FormModal :title="currentFormTypeData.title">
    <JobForm />
  </FormModal>
</template>
