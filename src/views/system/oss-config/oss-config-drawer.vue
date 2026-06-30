<script setup lang="ts">
import type { OssConfig } from '@/api/system/oss-config/model';
import type { AntdFormRules } from '@/types/form';
import type { FormInstance } from 'antdv-next';

import { computed, ref } from 'vue';

import {
  ossConfigAdd,
  ossConfigInfo,
  ossConfigUpdate,
} from '@/api/system/oss-config';
import { useVbenDrawer } from '@/components';
import {
  FormInput as Input,
  FormTextArea as TextArea,
} from '@/components/global/form';
import { DictEnum } from '@/constants';
import { $t } from '@/locales';
import { cloneDeep } from '@/utils';
import { getDictOptions } from '@/utils/dict';
import { useBeforeCloseDiff } from '@/utils/popup';
import {
  Divider,
  Form,
  FormItem,
  RadioGroup,
  SpaceAddon,
  SpaceCompact,
} from 'antdv-next';

const emit = defineEmits<{ reload: [] }>();

const isUpdate = ref(false);
const title = computed(() => {
  return isUpdate.value ? $t('pages.common.edit') : $t('pages.common.add');
});

const accessPolicyOptions = [
  { color: 'orange', label: '私有', value: '0' },
  { color: 'green', label: '公开', value: '1' },
  { color: 'blue', label: '自定义', value: '2' },
];

type FormData = Partial<OssConfig>;

function getDefaultValues(): FormData {
  return {
    accessKey: '',
    accessPolicy: '0',
    bucketName: '',
    configKey: '',
    domainUrl: '',
    endpoint: '',
    isHttps: 'N',
    ossConfigId: undefined,
    prefix: '',
    region: '',
    remark: '',
    secretKey: '',
  };
}

const formData = ref<FormData>(getDefaultValues());
const formInstance = ref<FormInstance>();

const formRules = ref<AntdFormRules<FormData>>({
  accessKey: [{ required: true, message: $t('ui.formRules.required') }],
  bucketName: [{ required: true, message: $t('ui.formRules.required') }],
  configKey: [{ required: true, message: $t('ui.formRules.required') }],
  endpoint: [
    { message: '请输入正确的域名, 不需要http(s)', required: true },
    {
      validator: async (_rule, value) => {
        if (!value || !/^https?:\/\/.*/.test(value)) {
          return;
        }
        throw new Error('请输入正确的域名, 不需要http(s)');
      },
    },
  ],
  isHttps: [{ required: true, message: $t('ui.formRules.required') }],
  secretKey: [{ required: true, message: $t('ui.formRules.required') }],
});

function customFormValueGetter() {
  return JSON.stringify(formData.value);
}

const { onBeforeClose, markInitialized, resetInitialized } = useBeforeCloseDiff(
  {
    initializedGetter: customFormValueGetter,
    currentGetter: customFormValueGetter,
  },
);

const [BasicDrawer, drawerApi] = useVbenDrawer({
  onBeforeClose,
  onClosed: handleClosed,
  onConfirm: handleConfirm,
  async onOpenChange(isOpen) {
    if (!isOpen) {
      return null;
    }
    drawerApi.drawerLoading(true);

    const { id } = drawerApi.getData() as { id?: number | string };
    isUpdate.value = !!id;
    if (isUpdate.value && id) {
      const record = await ossConfigInfo(id);
      formData.value = {
        ...getDefaultValues(),
        ...record,
        remark: record.remark ?? '',
      };
    }
    await markInitialized();

    drawerApi.drawerLoading(false);
  },
});

async function handleConfirm() {
  try {
    drawerApi.lock(true);
    await formInstance.value?.validate();
    const data = cloneDeep(formData.value);
    await (isUpdate.value ? ossConfigUpdate(data) : ossConfigAdd(data));
    resetInitialized();
    emit('reload');
    drawerApi.close();
  } catch (error) {
    console.error(error);
  } finally {
    drawerApi.lock(false);
  }
}

async function handleClosed() {
  formData.value = getDefaultValues();
  formInstance.value?.resetFields();
  resetInitialized();
}
</script>

<template>
  <BasicDrawer :title="title" :size="650">
    <Form
      ref="formInstance"
      :model="formData"
      :label-col="{ style: { width: '100px' } }"
    >
      <Divider>基本信息</Divider>
      <FormItem label="配置名称" name="configKey" :rules="formRules.configKey">
        <Input allow-clear class="w-full" v-model:value="formData.configKey" />
      </FormItem>
      <FormItem label="服务地址" name="endpoint" :rules="formRules.endpoint">
        <SpaceCompact class="w-full">
          <SpaceAddon>
            {{ formData.isHttps === 'Y' ? 'https://' : 'http://' }}
          </SpaceAddon>
          <Input allow-clear class="w-full" v-model:value="formData.endpoint">
          </Input>
        </SpaceCompact>
      </FormItem>
      <FormItem
        label="自定义域名"
        name="domainUrl"
        extra="后端v6已经支持私有桶自定义域名"
      >
        <Input allow-clear class="w-full" v-model:value="formData.domainUrl" />
      </FormItem>

      <Divider>认证信息</Divider>
      <FormItem label="accessKey" name="accessKey" :rules="formRules.accessKey">
        <Input allow-clear class="w-full" v-model:value="formData.accessKey" />
      </FormItem>
      <FormItem label="secretKey" name="secretKey" :rules="formRules.secretKey">
        <Input allow-clear class="w-full" v-model:value="formData.secretKey" />
      </FormItem>

      <Divider>其他信息</Divider>
      <FormItem label="桶名称" name="bucketName" :rules="formRules.bucketName">
        <Input allow-clear class="w-full" v-model:value="formData.bucketName" />
      </FormItem>
      <FormItem label="前缀" name="prefix">
        <Input allow-clear class="w-full" v-model:value="formData.prefix" />
      </FormItem>
      <FormItem label="权限桶类型" name="accessPolicy">
        <RadioGroup
          button-style="solid"
          option-type="button"
          :options="accessPolicyOptions"
          v-model:value="formData.accessPolicy"
        />
      </FormItem>
      <FormItem label="是否https" name="isHttps" :rules="formRules.isHttps">
        <RadioGroup
          button-style="solid"
          option-type="button"
          :options="getDictOptions(DictEnum.SYS_YES_NO)"
          v-model:value="formData.isHttps"
        />
      </FormItem>
      <FormItem label="区域" name="region">
        <Input allow-clear class="w-full" v-model:value="formData.region" />
      </FormItem>
      <FormItem label="备注" name="remark">
        <TextArea allow-clear class="w-full" v-model:value="formData.remark" />
      </FormItem>
    </Form>
  </BasicDrawer>
</template>
