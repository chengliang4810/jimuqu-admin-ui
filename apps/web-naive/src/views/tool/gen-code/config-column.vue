<script setup lang="tsx">
import type { DataTableColumns } from 'naive-ui';

import { NInput, NSelect, NSwitch } from 'naive-ui';

import { requestClient } from '#/api/request';

/**
 * 从父组件注入
 */
const genInfoData = inject<any>('genInfoData');

// 当genInfoData有值时，设置表单值
watch(genInfoData, async (val) => {
  if (val) {
    const rows = genInfoData.value?.rows;
    data.value = rows;
  }
});

const data = ref<any[]>([]);

const JavaTypes: string[] = [
  'Long',
  'String',
  'Integer',
  'Double',
  'BigDecimal',
  'Date',
  'Boolean',
  'LocalDate',
  'LocalDateTime',
];

const queryTypeOptions = [
  { label: '=', value: 'EQ' },
  { label: '!=', value: 'NE' },
  { label: '>', value: 'GT' },
  { label: '>=', value: 'GE' },
  { label: '<', value: 'LT' },
  { label: '<=', value: 'LE' },
  { label: 'LIKE', value: 'LIKE' },
  { label: 'BETWEEN', value: 'BETWEEN' },
];

const componentsOptions = [
  { label: '文本框', value: 'input' },
  { label: '文本域', value: 'textarea' },
  { label: '下拉框', value: 'select' },
  { label: '单选框', value: 'radio' },
  { label: '复选框', value: 'checkbox' },
  { label: '日期控件', value: 'datetime' },
  { label: '图片上传', value: 'imageUpload' },
  { label: '文件上传', value: 'fileUpload' },
  { label: '富文本', value: 'editor' },
];

const dictOptions = reactive<{ label: string; value: string }[]>([
  { label: '未设置', value: '' },
]);

/**
 * 在这里初始化字典下拉框
 */
(async function init() {
  const data = await requestClient.get('/system/dict/type/all');
  data.forEach((dict: any) => {
    const option = {
      label: `${dict.dictName} | ${dict.dictKey}`,
      value: dict.dictKey,
    };
    dictOptions.push(option);
  });
})();

/**
 * {
    title: '字段列名',
    field: 'columnName',
    showOverflow: 'tooltip',
    fixed: 'left',
    minWidth: 150,
  },
  {
    title: '字段描述',
    field: 'columnComment',
    minWidth: 150,
    slots: {
      edit: ({ row }) => {
        return <Input v-model:value={row.columnComment}></Input>;
      },
    },
    editRender: {},
  },
  {
    title: 'db类型',
    field: 'columnType',
    minWidth: 120,
    showOverflow: 'tooltip',
  },
  {
    title: 'Java类型',
    field: 'javaType',
    minWidth: 150,
    slots: {
      edit: ({ row }) => {
        const javaTypeOptions = JavaTypes.map((type) => ({
          label: type,
          value: type,
        }));
        return (
          <Select
            class="w-full"
            getPopupContainer={getPopupContainer}
            options={javaTypeOptions}
            v-model:value={row.javaType}
          ></Select>
        );
      },
    },
    editRender: {},
  },
  {
    title: 'Java属性名',
    field: 'javaField',
    minWidth: 150,
    showOverflow: 'tooltip',
    slots: {
      edit: ({ row }) => {
        return <Input v-model:value={row.javaField}></Input>;
      },
    },
    editRender: {},
  },
  {
    title: '插入',
    field: 'insert',
    minWidth: 80,
    showOverflow: 'tooltip',
    align: 'center',
    slots: {
      default: ({ row }) => {
        return renderBooleanTag(row, 'insert');
      },
      edit: ({ row }) => {
        return renderBooleanCheckbox(row, 'insert');
      },
    },
    editRender: {},
  },
  {
    title: '编辑',
    field: 'edit',
    showOverflow: 'tooltip',
    align: 'center',
    minWidth: 80,
    slots: {
      default: ({ row }) => {
        return renderBooleanTag(row, 'edit');
      },
      edit: ({ row }) => {
        return renderBooleanCheckbox(row, 'edit');
      },
    },
    editRender: {},
  },
  {
    title: '列表',
    field: 'list',
    showOverflow: 'tooltip',
    align: 'center',
    minWidth: 80,
    slots: {
      default: ({ row }) => {
        return renderBooleanTag(row, 'list');
      },
      edit: ({ row }) => {
        return renderBooleanCheckbox(row, 'list');
      },
    },
    editRender: {},
  },
  {
    title: '查询',
    field: 'query',
    showOverflow: 'tooltip',
    align: 'center',
    minWidth: 80,
    slots: {
      default: ({ row }) => {
        return renderBooleanTag(row, 'query');
      },
      edit: ({ row }) => {
        return renderBooleanCheckbox(row, 'query');
      },
    },
    editRender: {},
  },
  {
    title: '查询方式',
    field: 'queryType',
    showOverflow: 'tooltip',
    align: 'center',
    minWidth: 150,
    slots: {
      default: ({ row }) => {
        const queryType = row.queryType;
        const found = queryTypeOptions.find((item) => item.value === queryType);
        if (found) {
          return found.label;
        }
        return queryType;
      },
      edit: ({ row }) => {
        return (
          <Select
            class="w-full"
            getPopupContainer={getPopupContainer}
            options={queryTypeOptions}
            v-model:value={row.queryType}
          ></Select>
        );
      },
    },
    editRender: {},
  },
  {
    title: '必填',
    field: 'required',
    showOverflow: 'tooltip',
    align: 'center',
    minWidth: 80,
    slots: {
      default: ({ row }) => {
        return renderBooleanTag(row, 'required');
      },
      edit: ({ row }) => {
        return renderBooleanCheckbox(row, 'required');
      },
    },
    editRender: {},
  },
  {
    title: '显示类型',
    field: 'htmlType',
    showOverflow: 'tooltip',
    minWidth: 150,
    align: 'center',
    slots: {
      default: ({ row }) => {
        const htmlType = row.htmlType;
        const found = componentsOptions.find((item) => item.value === htmlType);
        if (found) {
          return found.label;
        }
        return htmlType;
      },
      edit: ({ row }) => {
        return (
          <Select
            class="w-full"
            getPopupContainer={getPopupContainer}
            options={componentsOptions}
            v-model:value={row.htmlType}
          ></Select>
        );
      },
    },
    editRender: {},
  },
  {
    title: '字典类型',
    field: 'dictType',
    showOverflow: 'tooltip',
    minWidth: 230,
    align: 'center',
    titlePrefix: {
      message: `仅'下拉框', '单选框', '复选框'支持字典类型`,
    },
    slots: {
      default: ({ row }) => {
        const dictType = row.dictType;
        const found = dictOptions.find((item) => item.value === dictType);
        if (found) {
          return found.label;
        }
        return dictType;
      },
      edit: ({ row }) => {
        // 清除的回调 需要设置为空字符串 否则不会提交
        const onDeselect = () => {
          row.dictType = '';
        };
        const disabled =
          row.htmlType !== 'select' &&
          row.htmlType !== 'radio' &&
          row.htmlType !== 'checkbox';
        return (
          <Select
            allowClear={true}
            class="w-full"
            disabled={disabled}
            getPopupContainer={getPopupContainer}
            onDeselect={onDeselect}
            options={dictOptions}
            placeholder="请选择字典类型"
            v-model:value={row.dictType}
          ></Select>
        );
      },
    },
    editRender: {},
  },
 */

/**
 * 渲染input
 * @param row 行数据
 * @param index 行索引
 * @param field 字段名
 */
function renderInput(row: any, index: number, field: string) {
  return (
    <NInput
      on-update:value={(v: any) => (data.value[index][field] = v)}
      value={row[field]}
    ></NInput>
  );
}

/**
 * 渲染input
 * @param row 行数据
 * @param index 行索引
 * @param field 字段名
 */
function renderSelect(
  row: any,
  index: number,
  field: string,
  options: any[],
  disabled = false,
) {
  return (
    <NSelect
      default-value={row[field]}
      disabled={disabled}
      on-update:value={(v: any) => (data.value[index][field] = v)}
      options={options}
    ></NSelect>
  );
}

/**
 * 渲染switch
 * @param row 行数据
 * @param index 行索引
 * @param field 字段名
 */
function renderSwitch(row: any, index: number, field: string) {
  return (
    <NSwitch
      checked-value={'1'}
      on-update:value={(v: any) => (data.value[index][field] = v)}
      unchecked-value={'0'}
      v-slots={{
        checked: () => '是',
        unchecked: () => '否',
      }}
      value={row[field]}
    ></NSwitch>
  );
}

const columns: DataTableColumns = [
  {
    title: '序号',
    key: 'index',
    width: 60,
    align: 'center',
    fixed: 'left',
    render: (_row, index) => index + 1,
  },
  {
    title: '字段列名',
    key: 'columnName',
    width: 150,
    fixed: 'left',
  },
  {
    title: '字段描述',
    fixed: 'left',
    key: 'columnComment',
    width: 150,
    render(row: any, index) {
      return h(NInput, {
        value: row.columnComment || '',
        onUpdateValue(v) {
          data.value[index].columnComment = v;
        },
      });
    },
  },
  {
    title: 'db类型',
    key: 'columnType',
    minWidth: 120,
    render(row: any, index) {
      return renderInput(row, index, 'columnType');
    },
  },
  {
    title: 'Java类型',
    key: 'javaType',
    minWidth: 150,
    render(row: any, index) {
      const javaTypeOptions = JavaTypes.map((type) => ({
        label: type,
        value: type,
      }));
      return renderSelect(row, index, 'javaType', javaTypeOptions);
    },
  },
  {
    title: 'Java属性名',
    key: 'javaField',
    minWidth: 150,
    render(row: any, index) {
      return renderInput(row, index, 'javaField');
    },
  },
  {
    title: '插入',
    key: 'isInsert',
    align: 'center',
    minWidth: 80,
    render(row, index) {
      return renderSwitch(row, index, 'isInsert');
    },
  },
  {
    title: '编辑',
    key: 'isEdit',
    align: 'center',
    minWidth: 80,
    render(row, index) {
      return renderSwitch(row, index, 'isEdit');
    },
  },
  {
    title: '列表',
    key: 'isList',
    align: 'center',
    minWidth: 80,
    render(row, index) {
      return renderSwitch(row, index, 'isList');
    },
  },
  {
    title: '查询',
    key: 'isQuery',
    align: 'center',
    minWidth: 80,
    render(row, index) {
      return renderSwitch(row, index, 'isQuery');
    },
  },
  {
    title: '查询方式',
    key: 'queryType',
    align: 'center',
    minWidth: 150,
    render(row: any, index) {
      return renderSelect(row, index, 'queryType', queryTypeOptions);
    },
  },
  {
    title: '必填',
    key: 'isRequired',
    align: 'center',
    minWidth: 80,
    render(row, index) {
      return renderSwitch(row, index, 'isRequired');
    },
  },
  {
    title: '显示类型',
    key: 'htmlType',
    align: 'center',
    minWidth: 150,
    render(row: any, index) {
      return renderSelect(row, index, 'htmlType', componentsOptions);
    },
  },
  {
    title: '字典类型',
    key: 'dictType',
    align: 'center',
    minWidth: 230,
    render(row: any, index) {
      const disabled =
        row.htmlType !== 'select' &&
        row.htmlType !== 'radio' &&
        row.htmlType !== 'checkbox';
      return renderSelect(row, index, 'dictType', dictOptions, disabled);
    },
  },
];

/**
 * 校验表单
 */
async function validateForm() {
  // 检测data 中的 字段描述和属性名是否为空
  for (const item of data.value) {
    if (!item.columnComment || !item.javaField) {
      return false;
    }
  }
  return true;
}

/**
 * 获取表单值
 */
function getFormValues() {
  return data.value;
}

defineExpose({
  validateForm,
  getFormValues,
});
</script>
<template>
  <n-data-table
    size="small"
    :columns="columns"
    :data="data"
    :pagination="false"
  />
</template>
