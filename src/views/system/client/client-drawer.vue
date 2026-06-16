<script setup lang="ts">
import type { Client } from '@/api/system/client/model';
import type { AntdFormRules } from '@/types/form';
import type { FormInstance } from 'antdv-next';

import { computed, ref } from 'vue';

import { clientAdd, clientInfo, clientUpdate } from '@/api/system/client';
import {
  FormInput as Input,
  FormInputNumber as InputNumber,
  FormSelect as Select,
} from '@/components/global/form';
import { DEFAULT_CLIENT_ID, DictEnum } from '@/constants';
import { useVbenDrawer } from '@/effects/common-ui';
import { $t } from '@/locales';
import { cloneDeep, getPopupContainer } from '@/utils';
import { getDictOptions } from '@/utils/dict';
import { useBeforeCloseDiff } from '@/utils/popup';
import { Form, FormItem, RadioGroup } from 'antdv-next';

import SecretInput from './secret-input.vue';

const emit = defineEmits<{ reload: [] }>();

const isUpdate = ref(false);
const title = computed(() => {
  return isUpdate.value ? $t('pages.common.edit') : $t('pages.common.add');
});

type FormData = Omit<Partial<Client>, 'accessPath' | 'ipWhitelist'> & {
  accessPath?: string[];
  ipWhitelist?: string[];
};

function getDefaultValues(): FormData {
  return {
    activeTimeout: 1800,
    accessPath: [],
    clientId: '',
    clientKey: '',
    clientSecret: '',
    deviceType: undefined,
    grantTypeList: [],
    id: undefined,
    ipWhitelist: [],
    status: '0',
    timeout: 604_800,
  };
}

const formData = ref<FormData>(getDefaultValues());
const formInstance = ref<FormInstance>();
const statusDisabled = ref(false);

const tokenSeparators = [',', ';', ' ', '\n'];

const formTooltips = {
  accessPath:
    '输入后回车确认，可粘贴多个自动拆分；为空表示允许访问所有接口路径',
  activeTimeout: '指定时间无操作则过期(单位：秒), 默认30分钟(1800秒)',
  ipWhitelist:
    '支持精确IP、通配符和CIDR；输入后回车确认，可粘贴多个自动拆分；为空表示允许所有IP',
  timeout: '指定时间必定过期(单位：秒)，默认七天(604800秒)',
};

const formRules = ref<AntdFormRules<FormData>>({
  activeTimeout: [{ required: true, message: $t('ui.formRules.required') }],
  clientKey: [{ required: true, message: $t('ui.formRules.required') }],
  clientSecret: [{ required: true, message: $t('ui.formRules.required') }],
  deviceType: [{ required: true, message: $t('ui.formRules.selectRequired') }],
  grantTypeList: [
    {
      message: $t('ui.formRules.selectRequired'),
      required: true,
      type: 'array',
    },
  ],
  timeout: [{ required: true, message: $t('ui.formRules.required') }],
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
    statusDisabled.value = false;

    if (isUpdate.value && id) {
      const record = await clientInfo(id);
      statusDisabled.value = record.id === DEFAULT_CLIENT_ID;
      formData.value = {
        ...getDefaultValues(),
        ...record,
        accessPath: record.accessPathList ?? [],
        ipWhitelist: record.ipWhitelistList ?? [],
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
    const data = cloneDeep(formData.value) as Partial<Client> & {
      accessPath?: string | string[];
      ipWhitelist?: string | string[];
    };
    if (Array.isArray(data.accessPath)) {
      data.accessPath = data.accessPath.join('\n');
    }
    if (Array.isArray(data.ipWhitelist)) {
      data.ipWhitelist = data.ipWhitelist.join('\n');
    }
    await (isUpdate.value ? clientUpdate(data) : clientAdd(data));
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
  statusDisabled.value = false;
  formInstance.value?.resetFields();
  resetInitialized();
}
</script>

<template>
  <BasicDrawer :title="title" :size="600">
    <Form
      ref="formInstance"
      :model="formData"
      class="grid grid-cols-1 gap-x-4 lg:grid-cols-2"
      layout="vertical"
    >
      <FormItem
        v-if="isUpdate"
        label="客户端ID"
        name="clientId"
        class="col-span-1 lg:col-span-2"
      >
        <Input disabled class="w-full" v-model:value="formData.clientId" />
      </FormItem>
      <FormItem
        label="客户端key"
        name="clientKey"
        :rules="formRules.clientKey"
        class="col-span-1 lg:col-span-2"
      >
        <Input
          allow-clear
          class="w-full"
          :disabled="isUpdate"
          v-model:value="formData.clientKey"
        />
      </FormItem>
      <FormItem
        label="客户端密钥"
        name="clientSecret"
        :rules="formRules.clientSecret"
        class="col-span-1 lg:col-span-2"
      >
        <SecretInput
          :disabled="isUpdate"
          v-model:value="formData.clientSecret"
        />
      </FormItem>
      <FormItem
        label="授权类型"
        name="grantTypeList"
        :rules="formRules.grantTypeList"
        class="col-span-1 lg:col-span-2"
      >
        <Select
          class="w-full"
          mode="multiple"
          option-filter-prop="label"
          :get-popup-container="getPopupContainer"
          :options="getDictOptions(DictEnum.SYS_GRANT_TYPE)"
          v-model:value="formData.grantTypeList"
        />
      </FormItem>
      <FormItem
        label="设备类型"
        name="deviceType"
        :rules="formRules.deviceType"
        class="col-span-1 lg:col-span-2"
      >
        <Select
          :allow-clear="false"
          class="w-full"
          :get-popup-container="getPopupContainer"
          :options="getDictOptions(DictEnum.SYS_DEVICE_TYPE)"
          v-model:value="formData.deviceType"
        />
      </FormItem>
      <FormItem
        label="允许访问路径"
        name="accessPath"
        :tooltip="formTooltips.accessPath"
        class="col-span-1 lg:col-span-2"
      >
        <Select
          class="w-full"
          mode="tags"
          :open="false"
          placeholder="/app/**"
          :get-popup-container="getPopupContainer"
          :token-separators="tokenSeparators"
          v-model:value="formData.accessPath"
        />
      </FormItem>
      <FormItem
        label="IP白名单"
        name="ipWhitelist"
        :tooltip="formTooltips.ipWhitelist"
        class="col-span-1 lg:col-span-2"
      >
        <Select
          class="w-full"
          mode="tags"
          :open="false"
          placeholder="127.0.0.1"
          :get-popup-container="getPopupContainer"
          :token-separators="tokenSeparators"
          v-model:value="formData.ipWhitelist"
        />
      </FormItem>
      <FormItem
        label="Token活跃超时时间"
        name="activeTimeout"
        :rules="formRules.activeTimeout"
        :tooltip="formTooltips.activeTimeout"
        class="col-span-1"
      >
        <InputNumber
          addon-after="秒"
          class="w-full"
          placeholder="请输入"
          :style="{ '--ant-border-radius': 'var(--radius) 0 0 var(--radius)' }"
          v-model:value="formData.activeTimeout"
        />
      </FormItem>
      <FormItem
        label="Token固定超时时间"
        name="timeout"
        :rules="formRules.timeout"
        :tooltip="formTooltips.timeout"
        class="col-span-1"
      >
        <InputNumber
          addon-after="秒"
          class="w-full"
          :style="{ '--ant-border-radius': 'var(--radius) 0 0 var(--radius)' }"
          v-model:value="formData.timeout"
        />
      </FormItem>
      <FormItem label="状态" name="status" class="col-span-1 lg:col-span-2">
        <RadioGroup
          button-style="solid"
          option-type="button"
          :disabled="statusDisabled"
          :options="getDictOptions(DictEnum.SYS_NORMAL_DISABLE)"
          v-model:value="formData.status"
        />
      </FormItem>
    </Form>
  </BasicDrawer>
</template>
