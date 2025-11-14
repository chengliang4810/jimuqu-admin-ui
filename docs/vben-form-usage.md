# VbenForm 表单系统使用指南

## 概述

VbenForm 是 Vue Vben Admin 的核心表单系统，提供统一、模式驱动的表单管理方案。基于 `vee-validate` + `Zod` 验证，支持多种 UI 框架，具备强大的字段依赖管理和动态表单能力。

## 快速开始

### 基础表单

```vue
<template>
  <div>
    <Form @submit="handleSubmit" />
  </div>
</template>

<script setup lang="ts">
import { useVbenForm } from '@vben/common-ui';

// 定义表单提交处理
const handleSubmit = async (values: any) => {
  console.log('表单数据:', values);
  // 调用API提交数据
};

// 使用VbenForm创建表单
const [Form, formApi] = useVbenForm({
  schema: [
    {
      component: 'Input',
      fieldName: 'username',
      label: '用户名',
      rules: 'required',
    },
    {
      component: 'InputPassword',
      fieldName: 'password',
      label: '密码',
      rules: 'required|min:6',
    },
  ],
  // 显示默认操作按钮
  showDefaultActions: true,
});
</script>
```

### 表单配置选项

```typescript
const [Form, formApi] = useVbenForm({
  // 表单结构定义
  schema: formSchema,

  // 表单配置
  showDefaultActions: true, // 是否显示默认操作按钮
  collapsed: false, // 是否折叠表单
  collapsedRows: 1, // 折叠时显示的行数
  submitButtonOptions: {
    // 提交按钮配置
    text: '提交',
    type: 'primary',
  },
  resetButtonOptions: {
    // 重置按钮配置
    text: '重置',
  },
  submitOnChange: false, // 表单值变化时是否自动提交
  submitOnEnter: true, // 回车键是否提交表单
  commonConfig: {
    // 通用配置
    labelWidth: 100, // 标签宽度
    labelCol: { span: 8 }, // 标签栅格
    wrapperCol: { span: 16 }, // 包装器栅格
  },
});
```

## 表单字段配置

### 基础字段类型

#### 1. 输入框

```typescript
{
  component: 'Input',
  fieldName: 'title',
  label: '标题',
  rules: 'required|max:50',
  componentProps: {
    placeholder: '请输入标题',
    maxlength: 50,
    showCount: true,
  },
}
```

#### 2. 密码框

```typescript
{
  component: 'InputPassword',
  fieldName: 'password',
  label: '密码',
  rules: 'required|min:6',
  componentProps: {
    placeholder: '请输入密码',
    showPasswordOn: 'click',
  },
}
```

#### 3. 文本域

```typescript
{
  component: 'InputTextarea',
  fieldName: 'description',
  label: '描述',
  rules: 'max:500',
  componentProps: {
    placeholder: '请输入描述',
    rows: 4,
    maxlength: 500,
    showCount: true,
  },
}
```

#### 4. 数字输入框

```typescript
{
  component: 'InputNumber',
  fieldName: 'age',
  label: '年龄',
  rules: 'required|min:18|max:100',
  componentProps: {
    placeholder: '请输入年龄',
    min: 18,
    max: 100,
    precision: 0,
  },
}
```

#### 5. 选择器

```typescript
{
  component: 'Select',
  fieldName: 'gender',
  label: '性别',
  rules: 'required',
  componentProps: {
    placeholder: '请选择性别',
    options: [
      { label: '男', value: 'male' },
      { label: '女', value: 'female' },
      { label: '其他', value: 'other' },
    ],
    filterable: true,
  },
}
```

#### 6. 多选选择器

```typescript
{
  component: 'Select',
  fieldName: 'hobbies',
  label: '爱好',
  componentProps: {
    placeholder: '请选择爱好',
    options: [
      { label: '阅读', value: 'reading' },
      { label: '运动', value: 'sports' },
      { label: '音乐', value: 'music' },
    ],
    multiple: true,
    maxTagCount: 3,
  },
}
```

#### 7. 日期选择器

```typescript
{
  component: 'DatePicker',
  fieldName: 'birthday',
  label: '生日',
  rules: 'required',
  componentProps: {
    placeholder: '请选择生日',
    format: 'YYYY-MM-DD',
    valueFormat: 'YYYY-MM-DD',
  },
}
```

#### 8. 日期范围选择器

```typescript
{
  component: 'RangePicker',
  fieldName: 'dateRange',
  label: '日期范围',
  componentProps: {
    placeholder: ['开始日期', '结束日期'],
    format: 'YYYY-MM-DD',
    valueFormat: 'YYYY-MM-DD',
  },
}
```

#### 9. 开关

```typescript
{
  component: 'Switch',
  fieldName: 'enabled',
  label: '启用状态',
  componentProps: {
    checkedText: '启用',
    uncheckedText: '禁用',
  },
}
```

#### 10. 单选框组

```typescript
{
  component: 'RadioGroup',
  fieldName: 'type',
  label: '类型',
  rules: 'required',
  componentProps: {
    options: [
      { label: '选项A', value: 'a' },
      { label: '选项B', value: 'b' },
      { label: '选项C', value: 'c' },
    ],
  },
}
```

#### 11. 复选框组

```typescript
{
  component: 'CheckboxGroup',
  fieldName: 'permissions',
  label: '权限',
  componentProps: {
    options: [
      { label: '读取', value: 'read' },
      { label: '写入', value: 'write' },
      { label: '删除', value: 'delete' },
    ],
  },
}
```

#### 12. 上传组件

```typescript
{
  component: 'Upload',
  fieldName: 'avatar',
  label: '头像',
  componentProps: {
    accept: '.jpg,.png,.jpeg',
    maxCount: 1,
    listType: 'picture-card',
    beforeUpload: (file) => {
      const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
      if (!isJpgOrPng) {
        message.error('只能上传 JPG/PNG 格式的图片!');
      }
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        message.error('图片大小不能超过 2MB!');
      }
      return isJpgOrPng && isLt2M;
    },
  },
}
```

## 验证规则

### 内置验证规则

```typescript
const schema = [
  // 必填验证
  {
    fieldName: 'email',
    label: '邮箱',
    rules: 'required', // 等同于 z.string().min(1, '请输入邮箱')
  },

  // 邮箱验证
  {
    fieldName: 'email',
    label: '邮箱',
    rules: 'required|email', // 邮箱格式验证
  },

  // 长度验证
  {
    fieldName: 'name',
    label: '姓名',
    rules: 'required|min:2|max:20', // 最小2个字符，最大20个字符
  },

  // 数值范围验证
  {
    fieldName: 'age',
    label: '年龄',
    rules: 'required|min_value:18|max_value:100', // 18-100之间
  },

  // 正则表达式验证
  {
    fieldName: 'phone',
    label: '手机号',
    rules: 'required|regex:/^1[3-9]\\d{9}$', // 中国手机号
  },
];
```

### 自定义验证规则

```typescript
const schema = [
  {
    fieldName: 'confirmPassword',
    label: '确认密码',
    rules: (value, formValues, field) => {
      if (!value) {
        return '请确认密码';
      }
      if (value !== formValues.password) {
        return '两次输入的密码不一致';
      }
      return true;
    },
  },

  // 使用Zod进行复杂验证
  {
    fieldName: 'idCard',
    label: '身份证号',
    rules: z
      .string()
      .regex(
        /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/,
        '请输入有效的身份证号',
      ),
  },
];
```

## 字段依赖

### 条件显示

```typescript
const schema = [
  {
    component: 'RadioGroup',
    fieldName: 'hasAccount',
    label: '是否有账户',
    rules: 'required',
    componentProps: {
      options: [
        { label: '有', value: true },
        { label: '没有', value: false },
      ],
    },
  },
  {
    component: 'Input',
    fieldName: 'accountName',
    label: '账户名',
    rules: 'required',
    // 依赖字段：当 hasAccount 为 true 时显示
    dependencies: {
      show: ({ values }) => values.hasAccount === true,
    },
  },
  {
    component: 'Input',
    fieldName: 'newAccountName',
    label: '新账户名',
    rules: 'required',
    // 依赖字段：当 hasAccount 为 false 时显示
    dependencies: {
      show: ({ values }) => values.hasAccount === false,
    },
  },
];
```

### 动态验证规则

```typescript
const schema = [
  {
    component: 'RadioGroup',
    fieldName: 'userType',
    label: '用户类型',
    rules: 'required',
    componentProps: {
      options: [
        { label: '个人用户', value: 'personal' },
        { label: '企业用户', value: 'enterprise' },
      ],
    },
  },
  {
    component: 'Input',
    fieldName: 'companyName',
    label: '公司名称',
    rules: (value, formValues) => {
      // 动态验证规则：企业用户时必填
      if (formValues.userType === 'enterprise') {
        return 'required|min:2';
      }
      return 'optional';
    },
    dependencies: {
      show: ({ values }) => values.userType === 'enterprise',
    },
  },
];
```

### 动态字段属性

```typescript
const schema = [
  {
    component: 'Select',
    fieldName: 'country',
    label: '国家',
    rules: 'required',
    componentProps: {
      placeholder: '请选择国家',
      options: [
        { label: '中国', value: 'CN' },
        { label: '美国', value: 'US' },
        { label: '其他', value: 'OTHER' },
      ],
    },
  },
  {
    component: 'Input',
    fieldName: 'otherCountry',
    label: '其他国家',
    // 动态组件属性
    dependencies: {
      componentProps: ({ values }) => ({
        placeholder:
          values.country === 'OTHER' ? '请输入国家名称' : '请选择中国或美国',
        disabled: values.country !== 'OTHER',
      }),
      show: ({ values }) => values.country === 'OTHER',
    },
  },
];
```

## 表单操作

### 获取表单数据

```typescript
// 获取所有表单数据
const formData = formApi.getValues();

// 获取特定字段值
const username = formApi.getFieldValue('username');

// 获取表单是否已修改
const isDirty = formApi.isDirty();

// 获取表单验证状态
const isValid = await formApi.validate();
```

### 设置表单数据

```typescript
// 设置所有表单数据
formApi.setValues({
  username: 'john',
  email: 'john@example.com',
  age: 25,
});

// 设置特定字段值
formApi.setFieldValue('username', 'john');

// 批量设置字段值
formApi.setFieldsValue({
  username: 'john',
  email: 'john@example.com',
});
```

### 表单验证

```typescript
// 验证整个表单
try {
  const isValid = await formApi.validate();
  console.log('表单验证结果:', isValid);
} catch (error) {
  console.log('验证失败:', error);
}

// 验证特定字段
try {
  const isValid = await formApi.validateField('email');
  console.log('邮箱验证结果:', isValid);
} catch (error) {
  console.log('邮箱验证失败:', error);
}

// 清除验证错误
formApi.clearValidate();

// 清除特定字段的验证错误
formApi.clearValidate('email');
```

### 表单重置

```typescript
// 重置表单到初始值
formApi.resetForm();

// 重置表单到指定值
formApi.resetForm({
  username: '',
  email: '',
});

// 重置特定字段
formApi.resetField('username');
```

### 表单提交

```typescript
// 手动提交表单
const handleSubmit = async () => {
  try {
    // 验证表单
    await formApi.validate();

    // 获取表单数据
    const values = formApi.getValues();

    // 提交数据
    const result = await submitForm(values);

    // 处理提交结果
    if (result.success) {
      message.success('提交成功');
      formApi.resetForm();
    } else {
      message.error(result.message);
    }
  } catch (error) {
    message.error('表单验证失败');
  }
};
```

## 高级用法

### 自定义字段组件

```typescript
// 1. 创建自定义组件
const CustomFieldComponent = defineComponent({
  props: {
    value: [String, Number],
    placeholder: String,
  },
  emits: ['update:value'],
  setup(props, { emit }) {
    const inputValue = computed({
      get: () => props.value,
      set: (val) => emit('update:value', val),
    });

    return () => (
      <n-input
        value={inputValue.value}
        placeholder={props.placeholder}
        onUpdate:value={inputValue.value = $event}
      />
    );
  },
});

// 2. 注册自定义组件
import { globalShareState } from '@vben-core/shared';

globalShareState.setComponents({
  CustomField: CustomFieldComponent,
});

// 3. 在表单中使用
const schema = [
  {
    component: 'CustomField',
    fieldName: 'customField',
    label: '自定义字段',
    componentProps: {
      placeholder: '请输入自定义内容',
    },
  },
];
```

### 动态表单

```typescript
const [Form, formApi] = useVbenForm({
  schema: computed(() => {
    const baseSchema = [
      {
        component: 'Select',
        fieldName: 'type',
        label: '类型',
        rules: 'required',
        componentProps: {
          options: [
            { label: '个人', value: 'personal' },
            { label: '企业', value: 'enterprise' },
          ],
        },
      },
    ];

    // 根据类型动态添加字段
    const formType = formApi?.getFieldValue('type');

    if (formType === 'personal') {
      baseSchema.push(
        {
          component: 'Input',
          fieldName: 'name',
          label: '姓名',
          rules: 'required',
        },
        {
          component: 'Input',
          fieldName: 'idCard',
          label: '身份证号',
          rules:
            'required|regex:/^[1-9]\\d{5}(18|19|20)\\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\\d{3}[0-9Xx]$/',
        },
      );
    } else if (formType === 'enterprise') {
      baseSchema.push(
        {
          component: 'Input',
          fieldName: 'companyName',
          label: '公司名称',
          rules: 'required',
        },
        {
          component: 'Input',
          fieldName: 'businessLicense',
          label: '营业执照号',
          rules: 'required',
        },
      );
    }

    return baseSchema;
  }),
});
```

### 表单数据监听

```typescript
import { watch } from 'vue';

const [Form, formApi] = useVbenForm({
  schema: formSchema,
});

// 监听表单数据变化
watch(
  () => formApi.getValues(),
  (newValues, oldValues) => {
    console.log('表单数据变化:', newValues);
  },
  { deep: true },
);

// 监听特定字段变化
watch(
  () => formApi.getFieldValue('type'),
  (newType) => {
    console.log('类型变化:', newType);
    // 可以在这里触发其他操作
  },
);
```

### 表单与表格联动

```typescript
const [Form, formApi] = useVbenForm({
  schema: searchFormSchema,
});

// 表格搜索
const handleSearch = async () => {
  const searchParams = formApi.getValues();

  // 处理搜索参数
  const params = {
    ...searchParams,
    page: 1,
    pageSize: 10,
  };

  // 重新加载表格数据
  await gridApi.commitProxy('query', params);
};

// 重置搜索
const handleReset = () => {
  formApi.resetForm();
  handleSearch();
};
```

## 表单样式定制

### 全局样式配置

```scss
// 在全局样式中自定义表单样式
.vben-form {
  .ant-form-item {
    margin-bottom: 16px;
  }

  .ant-form-item-label {
    font-weight: 500;
  }

  .ant-form-item-required::before {
    color: #ff4d4f;
  }

  .form-actions {
    text-align: center;
    margin-top: 24px;
  }
}
```

### 响应式布局

```typescript
const schema = [
  {
    component: 'Input',
    fieldName: 'title',
    label: '标题',
    // 响应式栅格配置
    formItemClass: 'col-span-12 md:col-span-6 lg:col-span-4',
    commonConfig: {
      labelCol: { span: 24, md: 8, lg: 6 },
      wrapperCol: { span: 24, md: 16, lg: 18 },
    },
  },
];
```

## 常见问题

### Q1: 如何处理文件上传的字段验证？

```typescript
{
  component: 'Upload',
  fieldName: 'file',
  label: '文件',
  rules: (value) => {
    if (!value || value.length === 0) {
      return '请上传文件';
    }
    if (value[0].size > 10 * 1024 * 1024) {
      return '文件大小不能超过10MB';
    }
    return true;
  },
  componentProps: {
    beforeUpload: (file) => {
      const isValidSize = file.size / 1024 / 1024 < 10;
      if (!isValidSize) {
        message.error('文件大小不能超过10MB');
      }
      return false; // 阻止自动上传
    },
  },
}
```

### Q2: 如何实现字段级异步验证？

```typescript
{
  component: 'Input',
  fieldName: 'username',
  label: '用户名',
  rules: async (value) => {
    if (!value) return '请输入用户名';

    // 异步检查用户名是否已存在
    try {
      const exists = await checkUsernameExists(value);
      if (exists) {
        return '用户名已存在';
      }
      return true;
    } catch (error) {
      return '验证失败，请重试';
    }
  },
  componentProps: {
    placeholder: '请输入用户名',
  },
}
```

### Q3: 如何实现表单数据的本地存储？

```typescript
const [Form, formApi] = useVbenForm({
  schema: formSchema,
});

// 从本地存储加载数据
onMounted(() => {
  const savedData = localStorage.getItem('formData');
  if (savedData) {
    try {
      const data = JSON.parse(savedData);
      formApi.setValues(data);
    } catch (error) {
      console.error('加载表单数据失败:', error);
    }
  }
});

// 自动保存表单数据到本地存储
watch(
  () => formApi.getValues(),
  (values) => {
    localStorage.setItem('formData', JSON.stringify(values));
  },
  { deep: true },
);
```

## 最佳实践

1. **统一验证规则**: 将常用的验证规则提取为常量，便于复用
2. **合理的字段分组**: 使用 `formItemClass` 进行字段分组，提高表单可读性
3. **错误处理**: 在表单提交时进行完整的错误处理和用户提示
4. **性能优化**: 对于复杂表单，使用 `computed` 动态计算schema，避免重复渲染
5. **用户体验**: 提供清晰的字段标签、占位符和错误提示信息

通过这些功能和最佳实践，VbenForm 可以满足各种复杂的表单需求，提供优秀的用户体验和开发体验。
