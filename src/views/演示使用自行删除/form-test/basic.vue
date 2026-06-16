<script lang="ts" setup>
import type { AntdFormRules } from '@/types/form';
import type { FormInstance } from 'antdv-next';

import { ref } from 'vue';

import { Tiptap } from '@/components/tiptap';
import { FileUpload, ImageUpload } from '@/components/upload';
import { IconPicker, Page } from '@/effects/common-ui';
import {
  AutoComplete,
  Button,
  Card,
  Cascader,
  Checkbox,
  CheckboxGroup,
  DatePicker,
  DateRangePicker,
  Form,
  FormItem,
  Input,
  InputNumber,
  InputPassword,
  Mentions,
  Radio,
  RadioGroup,
  Rate,
  Select,
  Switch,
  TextArea,
  TimePicker,
  TimeRangePicker,
  TreeSelect,
  Upload,
} from 'antdv-next';

/**
 * 该页面用于「校验边框样式」验证：
 * 使用原生 antdv-next 表单覆盖常用输入组件。
 */

const treeData = [
  {
    label: '浙江',
    value: 'zhejiang',
    children: [
      {
        label: '杭州',
        value: 'hangzhou',
        children: [
          { label: '西湖', value: 'xihu' },
          { label: '余杭', value: 'yuhang' },
        ],
      },
    ],
  },
  {
    label: '江苏',
    value: 'jiangsu',
    children: [
      {
        label: '南京',
        value: 'nanjing',
        children: [{ label: '中华门', value: 'zhonghuamen' }],
      },
    ],
  },
];

const simpleOptions = [
  { label: '选项一', value: '1' },
  { label: '选项二', value: '2' },
  { label: '选项三', value: '3' },
];

function getDefaultValues() {
  return {
    autoComplete: undefined,
    cascader: undefined,
    checkbox: false,
    checkboxGroup: [],
    datePicker: undefined,
    fileUpload: '',
    iconPicker: '',
    imageUpload: '',
    input: '',
    inputNumber: undefined,
    inputPassword: '',
    mentions: '',
    radio: false,
    radioGroup: undefined,
    rangePicker: undefined,
    rate: undefined,
    richTextarea: '',
    select: undefined,
    switch: false,
    textarea: '',
    timePicker: undefined,
    timeRangePicker: undefined,
    treeSelect: undefined,
    upload: [],
  };
}

type FormData = Record<string, any>;

const formData = ref<FormData>(getDefaultValues());
const formInstance = ref<FormInstance>();

const requiredRule = { message: '请填写', required: true };
const selectRule = { message: '请选择', required: true };

const formRules = ref<AntdFormRules<FormData>>({
  autoComplete: [requiredRule],
  cascader: [selectRule],
  checkbox: [
    {
      validator: async (_rule: any, value: any) => {
        if (value) {
          return Promise.resolve();
        }
        return Promise.reject(new Error('请勾选'));
      },
    },
  ],
  checkboxGroup: [selectRule],
  datePicker: [selectRule],
  fileUpload: [selectRule],
  iconPicker: [selectRule],
  imageUpload: [selectRule],
  input: [requiredRule],
  inputNumber: [requiredRule],
  inputPassword: [requiredRule],
  mentions: [requiredRule],
  radioGroup: [selectRule],
  rangePicker: [selectRule],
  select: [selectRule],
  textarea: [requiredRule],
  timePicker: [selectRule],
  timeRangePicker: [selectRule],
  treeSelect: [selectRule],
});

async function handleValidate() {
  await formInstance.value?.validate();
}

function handleReset() {
  formData.value = getDefaultValues();
  formInstance.value?.resetFields();
}
</script>

<template>
  <Page
    content-class="flex flex-col gap-4"
    description="覆盖常用原生表单组件，用于验证表单校验失败时的边框/聚焦阴影样式。测试使用"
    title="表单组件 - 边框校验验证"
  >
    <Card title="全部组件">
      <template #extra>
        <div class="flex gap-2">
          <Button type="primary" @click="handleValidate">校验全部</Button>
          <Button @click="handleReset">重置</Button>
        </div>
      </template>
      <Form
        ref="formInstance"
        :model="formData"
        class="grid grid-cols-1 gap-x-4 md:grid-cols-2 lg:grid-cols-3"
      >
        <FormItem label="Input" name="input" :rules="formRules.input">
          <Input class="w-full" v-model:value="formData.input" />
        </FormItem>
        <FormItem
          label="InputPassword"
          name="inputPassword"
          :rules="formRules.inputPassword"
        >
          <InputPassword class="w-full" v-model:value="formData.inputPassword" />
        </FormItem>
        <FormItem
          label="InputNumber"
          name="inputNumber"
          :rules="formRules.inputNumber"
        >
          <InputNumber
            class="w-full"
            suffix="¥"
            v-model:value="formData.inputNumber"
          />
        </FormItem>
        <FormItem label="Textarea" name="textarea" :rules="formRules.textarea">
          <TextArea class="w-full" :rows="2" v-model:value="formData.textarea" />
        </FormItem>
        <FormItem label="Mentions" name="mentions" :rules="formRules.mentions">
          <Mentions
            class="w-full"
            :options="[
              { label: 'afc163', value: 'afc163' },
              { label: 'zombieJ', value: 'zombieJ' },
            ]"
            placeholder="输入 @ 触发提及"
            v-model:value="formData.mentions"
          />
        </FormItem>
        <FormItem
          label="AutoComplete"
          name="autoComplete"
          :rules="formRules.autoComplete"
        >
          <AutoComplete
            class="w-full"
            :options="simpleOptions"
            v-model:value="formData.autoComplete"
          />
        </FormItem>
        <FormItem label="Select" name="select" :rules="formRules.select">
          <Select
            allow-clear
            class="w-full"
            show-search
            :options="simpleOptions"
            v-model:value="formData.select"
          />
        </FormItem>
        <FormItem label="Cascader" name="cascader" :rules="formRules.cascader">
          <Cascader
            allow-clear
            class="w-full"
            show-search
            :options="treeData"
            v-model:value="formData.cascader"
          />
        </FormItem>
        <FormItem
          label="TreeSelect"
          name="treeSelect"
          :rules="formRules.treeSelect"
        >
          <TreeSelect
            allow-clear
            class="w-full"
            show-search
            tree-node-filter-prop="label"
            :tree-data="treeData"
            v-model:value="formData.treeSelect"
          />
        </FormItem>
        <FormItem
          label="DatePicker"
          name="datePicker"
          :rules="formRules.datePicker"
        >
          <DatePicker class="w-full" v-model:value="formData.datePicker" />
        </FormItem>
        <FormItem
          label="RangePicker"
          name="rangePicker"
          :rules="formRules.rangePicker"
        >
          <DateRangePicker class="w-full" v-model:value="formData.rangePicker" />
        </FormItem>
        <FormItem
          label="TimePicker"
          name="timePicker"
          :rules="formRules.timePicker"
        >
          <TimePicker class="w-full" v-model:value="formData.timePicker" />
        </FormItem>
        <FormItem
          label="TimeRangePicker"
          name="timeRangePicker"
          :rules="formRules.timeRangePicker"
        >
          <TimeRangePicker
            class="w-full"
            v-model:value="formData.timeRangePicker"
          />
        </FormItem>
        <FormItem
          label="IconPicker"
          name="iconPicker"
          :rules="formRules.iconPicker"
        >
          <IconPicker v-model="formData.iconPicker" />
        </FormItem>
        <FormItem label="Rate" name="rate">
          <Rate v-model:value="formData.rate" />
        </FormItem>
        <FormItem label="Switch" name="switch">
          <Switch class="w-auto" v-model:checked="formData.switch" />
        </FormItem>
        <FormItem label="Radio" name="radio">
          <Radio v-model:checked="formData.radio">单个 Radio</Radio>
        </FormItem>
        <FormItem
          label="RadioGroup"
          name="radioGroup"
          :rules="formRules.radioGroup"
        >
          <RadioGroup :options="simpleOptions" v-model:value="formData.radioGroup" />
        </FormItem>
        <FormItem label="Checkbox" name="checkbox" :rules="formRules.checkbox">
          <Checkbox v-model:checked="formData.checkbox">我已阅读并同意</Checkbox>
        </FormItem>
        <FormItem
          label="CheckboxGroup"
          name="checkboxGroup"
          :rules="formRules.checkboxGroup"
        >
          <CheckboxGroup
            :options="simpleOptions"
            v-model:value="formData.checkboxGroup"
          />
        </FormItem>
        <FormItem
          label="ImageUpload"
          name="imageUpload"
          :rules="formRules.imageUpload"
        >
          <ImageUpload v-model:value="formData.imageUpload" />
        </FormItem>
        <FormItem
          label="FileUpload"
          name="fileUpload"
          :rules="formRules.fileUpload"
        >
          <FileUpload v-model:value="formData.fileUpload" />
        </FormItem>
        <FormItem label="Upload" name="upload">
          <Upload v-model:file-list="formData.upload">
            <Button>点击上传</Button>
          </Upload>
        </FormItem>
        <FormItem
          label="RichTextarea"
          name="richTextarea"
          class="md:col-span-2 lg:col-span-3"
        >
          <Tiptap v-model="formData.richTextarea" />
        </FormItem>
      </Form>
    </Card>
  </Page>
</template>
