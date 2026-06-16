<script setup lang="ts">
import type { DictData } from '@/api/system/dict/dict-data-model';
import type { AntdFormRules } from '@/types/form';
import type { FormInstance } from 'antdv-next';

import { computed, ref } from 'vue';

import {
  dictDataAdd,
  dictDataUpdate,
  dictDetailInfo,
} from '@/api/system/dict/dict-data';
import { tagTypes } from '@/components/dict';
import {
  FormInput as Input,
  FormInputNumber as InputNumber,
  FormTextArea as TextArea,
} from '@/components/global/form';
import { useVbenDrawer } from '@/effects/common-ui';
import { $t } from '@/locales';
import { cloneDeep } from '@/utils';
import { useBeforeCloseDiff } from '@/utils/popup';
import { Form, FormItem } from 'antdv-next';

import TagStylePicker from './tag-style-picker.vue';

const emit = defineEmits<{ reload: [] }>();

interface DrawerProps {
  dictCode?: number | string;
  dictType: string;
}

const isUpdate = ref(false);
const title = computed(() => {
  return isUpdate.value ? $t('pages.common.edit') : $t('pages.common.add');
});

type FormData = Partial<DictData>;

function getDefaultValues(): FormData {
  return {
    cssClass: '',
    dictCode: undefined,
    dictLabel: '',
    dictSort: 1,
    dictType: '',
    dictValue: '',
    listClass: undefined,
    remark: '',
  };
}

const formData = ref<FormData>(getDefaultValues());
const formInstance = ref<FormInstance>();

const formTooltips = {
  cssClass: '标签的css样式, 可添加已经编译的css类名',
};

const formRules = ref<AntdFormRules<FormData>>({
  dictLabel: [{ required: true, message: $t('ui.formRules.required') }],
  dictSort: [{ required: true, message: $t('ui.formRules.required') }],
  dictValue: [{ required: true, message: $t('ui.formRules.required') }],
});

/**
 * 标签样式选择器
 * default: 预设标签样式
 * custom: 自定义标签样式
 */
type SelectType = 'custom' | 'default';
const selectType = ref<SelectType>('default');
/**
 * 根据标签样式判断是自定义还是默认
 * @param listClass 标签样式
 */
function setupSelectType(listClass: string) {
  // 判断是自定义还是预设
  const isDefault = Reflect.has(tagTypes, listClass);
  selectType.value = isDefault ? 'default' : 'custom';
}

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

    const { dictCode, dictType } = drawerApi.getData() as DrawerProps;
    isUpdate.value = !!dictCode;
    formData.value.dictType = dictType;

    if (dictCode && isUpdate.value) {
      const record = await dictDetailInfo(dictCode);
      setupSelectType(record.listClass ?? '');
      formData.value = {
        ...getDefaultValues(),
        ...record,
        cssClass: record.cssClass ?? '',
        listClass: record.listClass || undefined,
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
    // 需要置空的情况 undefined不会提交给后端 需要改为空字符串
    if (!data.listClass) {
      data.listClass = '';
    }
    await (isUpdate.value ? dictDataUpdate(data) : dictDataAdd(data));
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
  selectType.value = 'default';
  resetInitialized();
}

/**
 * 取消标签选中 必须设置为undefined才行
 */
function handleDeSelect() {
  formData.value.listClass = undefined;
}
</script>

<template>
  <BasicDrawer :title="title" :size="600">
    <Form
      ref="formInstance"
      :model="formData"
      :label-col="{ style: { width: '80px' } }"
    >
      <FormItem label="字典类型" name="dictType">
        <Input disabled class="w-full" v-model:value="formData.dictType" />
      </FormItem>
      <FormItem label="标签样式" name="listClass">
        <TagStylePicker
          v-model:value="formData.listClass"
          v-model:select-type="selectType"
          @deselect="handleDeSelect"
        />
      </FormItem>
      <FormItem label="数据标签" name="dictLabel" :rules="formRules.dictLabel">
        <Input allow-clear class="w-full" v-model:value="formData.dictLabel" />
      </FormItem>
      <FormItem label="数据键值" name="dictValue" :rules="formRules.dictValue">
        <Input allow-clear class="w-full" v-model:value="formData.dictValue" />
      </FormItem>
      <FormItem
        label="css类名"
        name="cssClass"
        :tooltip="formTooltips.cssClass"
      >
        <TextArea
          allow-clear
          class="w-full"
          placeholder="可使用tailwind类名 如bg-blue w-full h-full等"
          v-model:value="formData.cssClass"
        />
      </FormItem>
      <FormItem label="显示排序" name="dictSort" :rules="formRules.dictSort">
        <InputNumber class="w-full" v-model:value="formData.dictSort" />
      </FormItem>
      <FormItem label="备注" name="remark">
        <TextArea allow-clear class="w-full" v-model:value="formData.remark" />
      </FormItem>
    </Form>
  </BasicDrawer>
</template>
