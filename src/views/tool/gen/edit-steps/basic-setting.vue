<script setup lang="ts">
import type { Column, GenInfo } from '@/api/tool/gen/model';
import type { AntdFormRules } from '@/types/form';
import type { FormInstance, SelectProps } from 'antdv-next';

import type { Ref } from 'vue';

import { inject, onMounted, ref } from 'vue';

import { menuList } from '@/api/system/menu';
import {
  FormInput as Input,
  FormSelect as Select,
  FormTextArea as Textarea,
  FormTreeSelect as TreeSelect,
} from '@/components/global/form';
import { $t } from '@/locales';
import { addFullName, getPopupContainer, listToTree } from '@/utils';
import {
  Col,
  Divider,
  Form,
  FormItem,
  RadioGroup,
  Row,
  Switch,
} from 'antdv-next';

/**
 * 从父组件注入
 */
const genInfoData = inject('genInfoData') as Ref<GenInfo['info']>;

type SelectOptions = NonNullable<SelectProps['options']>;

interface FormData {
  businessName?: string;
  className?: string;
  enableExport?: boolean;
  enableSort?: boolean;
  enableStatus?: boolean;
  enableUnique?: boolean;
  formComponent?: string;
  frontendType?: string;
  functionAuthor?: string;
  functionName?: string;
  moduleName?: string;
  packageName?: string;
  parentMenuId?: number | string;
  popupComponent?: string;
  remark?: string;
  sortField?: string;
  statusField?: string;
  tableComment?: string;
  tableName?: string;
  tplCategory?: string;
  treeAncestorsField?: string;
  treeCode?: string;
  treeName?: string;
  treeOrderField?: string;
  treeParentCode?: string;
  treeRootValue?: string;
  uniqueFields?: string[];
}

function getDefaultValues(): FormData {
  return {
    enableExport: true,
    enableSort: false,
    enableStatus: false,
    enableUnique: false,
    formComponent: 'native',
    frontendType: 'vue',
    popupComponent: 'modal',
    remark: '',
    tplCategory: 'crud',
    treeRootValue: '0',
    uniqueFields: [],
  };
}

const formData = ref<FormData>(getDefaultValues());
const formInstance = ref<FormInstance>();
const columnOptions = ref<SelectOptions>([]);
const sortableColumnOptions = ref<SelectOptions>([]);
const menuTreeData = ref<any[]>([]);

const formRules = ref<AntdFormRules<FormData>>({
  businessName: [{ required: true, message: $t('ui.formRules.required') }],
  className: [{ required: true, message: $t('ui.formRules.required') }],
  frontendType: [
    { message: '请选择前端模板', required: true },
    { message: '仅支持字母、数字、下划线和中划线', pattern: /^[\w-]+$/ },
  ],
  functionAuthor: [{ required: true, message: $t('ui.formRules.required') }],
  functionName: [{ required: true, message: $t('ui.formRules.required') }],
  moduleName: [{ required: true, message: $t('ui.formRules.required') }],
  packageName: [{ required: true, message: $t('ui.formRules.required') }],
  sortField: [{ required: true, message: $t('ui.formRules.selectRequired') }],
  statusField: [{ required: true, message: $t('ui.formRules.selectRequired') }],
  tableComment: [{ required: true, message: $t('ui.formRules.required') }],
  tableName: [{ required: true, message: $t('ui.formRules.required') }],
  tplCategory: [{ required: true, message: $t('ui.formRules.selectRequired') }],
  treeCode: [{ required: true, message: $t('ui.formRules.selectRequired') }],
  treeName: [{ required: true, message: $t('ui.formRules.selectRequired') }],
  treeParentCode: [
    { required: true, message: $t('ui.formRules.selectRequired') },
  ],
  treeRootValue: [{ required: true, message: $t('ui.formRules.required') }],
  uniqueFields: [
    { required: true, message: $t('ui.formRules.selectRequired'), type: 'array' },
  ],
});

const tplCategoryOptions = [
  { label: '单表(增删改查)', value: 'crud' },
  { label: '树表(增删改查)', value: 'tree' },
];

const frontendTypeOptions = [
  { label: 'Vue', value: 'vue' },
  { label: 'React', value: 'react' },
];

const popupComponentOptions = [
  { label: 'modal弹窗', value: 'modal' },
  { label: 'drawer抽屉', value: 'drawer' },
];

const formComponentOptions = [{ label: 'antd原生表单', value: 'native' }];

/**
 * 树表需要用到的数据
 */
async function initTreeSelect(columns: Column[]) {
  columnOptions.value = columns.map((item) => {
    const label = `${item.columnName} | ${item.columnComment}`;
    return { label, value: item.columnName };
  });
  sortableColumnOptions.value = columns
    .filter((item) =>
      ['BigDecimal', 'Double', 'Integer', 'LocalDateTime', 'Long'].includes(
        item.javaType,
      ),
    )
    .map((item) => {
      const label = `${item.columnName} | ${item.columnComment}`;
      return { label, value: item.columnName };
    });
}

/**
 * 加载菜单选择
 */
async function initMenuSelect() {
  const list = await menuList();
  // support i18n
  list.forEach((item) => {
    item.menuName = $t(item.menuName);
  });
  const tree = listToTree(list, { id: 'menuId', pid: 'parentId' });
  menuTreeData.value = [
    {
      fullName: $t('menu.root'),
      menuId: 0,
      menuName: $t('menu.root'),
      children: tree,
    },
  ];
  addFullName(menuTreeData.value, 'menuName', ' / ');
}

onMounted(async () => {
  const info = genInfoData.value;
  const options = info.options ? JSON.parse(info.options) : {};
  formData.value = {
    ...getDefaultValues(),
    ...info,
    enableExport: info.enableExport ?? true,
    enableSort: info.enableSort ?? false,
    enableStatus: info.enableStatus ?? false,
    enableUnique: info.enableUnique ?? false,
    frontendType: info.frontendType || 'vue',
    treeRootValue: info.treeRootValue || '0',
    uniqueFields: info.uniqueFields ?? [],
  };
  // 弹出框类型需要手动赋值
  if (info.options) {
    const { formComponent, popupComponent } = options;
    if (popupComponent) {
      formData.value.popupComponent = popupComponent;
    }
    if (formComponent) {
      formData.value.formComponent = 'native';
    }
  }
  await Promise.all([initTreeSelect(info.columns), initMenuSelect()]);
});

/**
 * 校验表单
 */
async function validateForm() {
  try {
    await formInstance.value?.validate();
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

/**
 * 获取表单值
 */
async function getFormValues() {
  return { ...formData.value };
}

defineExpose({
  validateForm,
  getFormValues,
});
</script>

<template>
  <Row justify="center">
    <Col v-bind="{ xs: 24, sm: 24, md: 20, lg: 16, xl: 16 }">
      <Form
        ref="formInstance"
        :model="formData"
        :label-col="{ style: { width: '150px' } }"
      >
        <Divider title-placement="left">基本信息</Divider>
        <div class="grid grid-cols-1 gap-x-4 md:grid-cols-2">
          <FormItem label="表名称" name="tableName" :rules="formRules.tableName">
            <Input class="w-full" v-model:value="formData.tableName" />
          </FormItem>
          <FormItem
            label="表描述"
            name="tableComment"
            :rules="formRules.tableComment"
          >
            <Input class="w-full" v-model:value="formData.tableComment" />
          </FormItem>
          <FormItem label="实体类名称" name="className" :rules="formRules.className">
            <Input class="w-full" v-model:value="formData.className" />
          </FormItem>
          <FormItem
            label="作者"
            name="functionAuthor"
            :rules="formRules.functionAuthor"
          >
            <Input class="w-full" v-model:value="formData.functionAuthor" />
          </FormItem>
        </div>

        <Divider title-placement="left">生成信息</Divider>
        <div class="grid grid-cols-1 gap-x-4 md:grid-cols-2">
          <FormItem
            label="模板类型"
            name="tplCategory"
            :rules="formRules.tplCategory"
          >
            <Select
              class="w-full"
              :allow-clear="false"
              :get-popup-container="getPopupContainer"
              :options="tplCategoryOptions"
              v-model:value="formData.tplCategory"
            />
          </FormItem>
          <FormItem
            v-if="formData.tplCategory === 'tree'"
            label="树编码字段"
            name="treeCode"
            :rules="formRules.treeCode"
            extra="树节点显示的编码字段名， 如: dept_id (相当于id)"
          >
            <Select
              class="w-full"
              :get-popup-container="getPopupContainer"
              :options="columnOptions"
              v-model:value="formData.treeCode"
            />
          </FormItem>
          <FormItem
            v-if="formData.tplCategory === 'tree'"
            label="树父编码字段"
            name="treeParentCode"
            :rules="formRules.treeParentCode"
            extra="树节点显示的父编码字段名， 如: parent_Id (相当于parentId)"
          >
            <Select
              class="w-full"
              :allow-clear="false"
              :options="columnOptions"
              v-model:value="formData.treeParentCode"
            />
          </FormItem>
          <FormItem
            v-if="formData.tplCategory === 'tree'"
            label="树名称字段"
            name="treeName"
            :rules="formRules.treeName"
            extra="树节点的显示名称字段名， 如: dept_name (相当于label)"
          >
            <Select
              class="w-full"
              :allow-clear="false"
              :options="columnOptions"
              v-model:value="formData.treeName"
            />
          </FormItem>
          <FormItem
            label="生成包路径"
            name="packageName"
            :rules="formRules.packageName"
            extra="生成在哪个java包下, 例如 com.ruoyi.system"
          >
            <Input class="w-full" v-model:value="formData.packageName" />
          </FormItem>
          <FormItem label="生成模块名" name="moduleName" :rules="formRules.moduleName">
            <Input class="w-full" v-model:value="formData.moduleName" />
          </FormItem>
          <FormItem
            label="生成业务名"
            name="businessName"
            :rules="formRules.businessName"
          >
            <Input class="w-full" v-model:value="formData.businessName" />
          </FormItem>
          <FormItem
            label="生成功能名"
            name="functionName"
            :rules="formRules.functionName"
          >
            <Input class="w-full" v-model:value="formData.functionName" />
          </FormItem>
          <FormItem label="上级菜单" name="parentMenuId">
            <TreeSelect
              class="w-full"
              :allow-clear="false"
              :field-names="{ label: 'menuName', value: 'menuId' }"
              :list-height="300"
              :tree-data="menuTreeData"
              :tree-default-expanded-keys="[0]"
              :tree-line="{ showLeafIcon: false }"
              tree-node-label-prop="fullName"
              v-model:value="formData.parentMenuId"
            />
          </FormItem>
          <FormItem
            label="前端模板"
            name="frontendType"
            :rules="formRules.frontendType"
            extra="对应后端 resources/vm 下的模板目录，例如 vue、react"
          >
            <RadioGroup
              button-style="solid"
              option-type="button"
              :options="frontendTypeOptions"
              v-model:value="formData.frontendType"
            />
          </FormItem>
          <FormItem
            label="弹窗组件类型"
            name="popupComponent"
            extra="自定义功能, 需要后端支持"
          >
            <RadioGroup
              button-style="solid"
              option-type="button"
              :options="popupComponentOptions"
              v-model:value="formData.popupComponent"
            />
          </FormItem>
          <FormItem
            label="生成表单类型"
            name="formComponent"
            extra="自定义功能, 需要后端支持"
          >
            <RadioGroup
              button-style="solid"
              option-type="button"
              :options="formComponentOptions"
              v-model:value="formData.formComponent"
            />
          </FormItem>
        </div>

        <Divider title-placement="left">增强选项</Divider>
        <div class="grid grid-cols-1 gap-x-4 md:grid-cols-2">
          <FormItem label="导出能力" name="enableExport">
            <Switch class="w-fit" v-model:checked="formData.enableExport" />
          </FormItem>
          <FormItem label="状态切换" name="enableStatus">
            <Switch class="w-fit" v-model:checked="formData.enableStatus" />
          </FormItem>
          <FormItem
            v-if="formData.enableStatus"
            label="状态字段"
            name="statusField"
            :rules="formRules.statusField"
          >
            <Select
              allow-clear
              class="w-full"
              option-filter-prop="label"
              show-search
              :get-popup-container="getPopupContainer"
              :options="columnOptions"
              v-model:value="formData.statusField"
            />
          </FormItem>
          <FormItem label="组合唯一校验" name="enableUnique">
            <Switch class="w-fit" v-model:checked="formData.enableUnique" />
          </FormItem>
          <FormItem
            v-if="formData.enableUnique"
            label="唯一字段"
            name="uniqueFields"
            :rules="formRules.uniqueFields"
          >
            <Select
              allow-clear
              class="w-full"
              mode="multiple"
              option-filter-prop="label"
              show-search
              :get-popup-container="getPopupContainer"
              :options="columnOptions"
              v-model:value="formData.uniqueFields"
            />
          </FormItem>
          <FormItem label="排序调整" name="enableSort">
            <Switch class="w-fit" v-model:checked="formData.enableSort" />
          </FormItem>
          <FormItem
            v-if="formData.enableSort"
            label="排序字段"
            name="sortField"
            :rules="formRules.sortField"
          >
            <Select
              allow-clear
              class="w-full"
              option-filter-prop="label"
              show-search
              :get-popup-container="getPopupContainer"
              :options="sortableColumnOptions"
              v-model:value="formData.sortField"
            />
          </FormItem>
          <FormItem
            v-if="formData.tplCategory === 'tree'"
            label="根节点值"
            name="treeRootValue"
            :rules="formRules.treeRootValue"
            extra="默认是 0，用于根节点 parentId 的默认值"
          >
            <Input class="w-full" v-model:value="formData.treeRootValue" />
          </FormItem>
          <FormItem
            v-if="formData.tplCategory === 'tree'"
            label="祖级字段"
            name="treeAncestorsField"
            extra="选择 ancestors 一类字段后，生成器会自动维护祖级链"
          >
            <Select
              allow-clear
              class="w-full"
              option-filter-prop="label"
              show-search
              :get-popup-container="getPopupContainer"
              :options="columnOptions"
              v-model:value="formData.treeAncestorsField"
            />
          </FormItem>
          <FormItem
            v-if="formData.tplCategory === 'tree'"
            label="树排序字段"
            name="treeOrderField"
            extra="树列表默认按祖级、父节点、树排序字段、主键升序排列"
          >
            <Select
              allow-clear
              class="w-full"
              option-filter-prop="label"
              show-search
              :get-popup-container="getPopupContainer"
              :options="sortableColumnOptions"
              v-model:value="formData.treeOrderField"
            />
          </FormItem>
          <FormItem label="备注" name="remark" class="md:col-span-2">
            <Textarea class="w-full" v-model:value="formData.remark" />
          </FormItem>
        </div>
      </Form>
    </Col>
  </Row>
</template>
