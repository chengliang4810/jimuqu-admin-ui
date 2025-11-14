# VbenVxeTable 表格系统使用指南

## 概述

VbenVxeTable 是 Vue Vben Admin 中深度集成的表格系统，基于强大的 VxeTable 组件库。提供了统一的表格解决方案，包括数据展示、分页、排序、筛选、编辑等功能，与表单系统深度集成，支持多种单元格渲染器。

## 快速开始

### 基础表格

```vue
<template>
  <div>
    <Grid :options="gridOptions" />
  </div>
</template>

<script setup lang="ts">
import { Grid } from '@vben/plugins/vxe-table';
import { useVbenVxeGrid } from '@vben/plugins/vxe-table';

const gridOptions = {
  columns: [
    { field: 'id', title: 'ID', width: 80 },
    { field: 'name', title: '姓名', minWidth: 120 },
    { field: 'email', title: '邮箱', minWidth: 180 },
    { field: 'role', title: '角色', width: 100 },
    { field: 'status', title: '状态', width: 100 },
  ],
  data: [
    {
      id: 1,
      name: '张三',
      email: 'zhangsan@example.com',
      role: '管理员',
      status: 1,
    },
    { id: 2, name: '李四', email: 'lisi@example.com', role: '用户', status: 1 },
    {
      id: 3,
      name: '王五',
      email: 'wangwu@example.com',
      role: '用户',
      status: 0,
    },
  ],
  height: 400,
};

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions,
});
</script>
```

### 表格配置

````typescript
const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    // 列配置
    columns: [],

    // 数据配置
    data: [],

    // 表格配置
    height: 500,
    maxHeight: 600,
    stripe: true, // 斑马纹
    border: 'full', // 边框样式
    round: true, // 圆角
    size: 'small', // 尺寸: medium | small | mini

    // 分页配置
    pagerConfig: {
      enabled: true,
      currentPage: 1,
      pageSize: 20,
      pageSizes: [10, 20, 50, 100],
      layouts: ['PrevJump', 'PrevPage', 'Number', 'NextPage', 'NextJump', 'Sizes', 'FullJump', 'Total'],
    },

    // 工具栏配置
    toolbarConfig: {
      refresh: true, // 刷新按钮
      zoom: true, // 缩放按钮
      custom: true, // 自定义按钮
      search: true, // 搜索按钮
      slots: {
        buttons: 'toolbar_buttons',
      },
    },

    // 排序配置
    sortConfig: {
      trigger: 'cell', // 点击单元格排序
      remote: true, // 远程排序
    },

    // 筛选配置
    filterConfig: {
      remote: true, // 远程筛选
    },

    // 序号配置
    seqConfig: {
      seqType: 'row', // 序号类型
    },
  },
});

## 远程数据加载

### 代理配置

```typescript
const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: [
      { field: 'id', title: 'ID', width: 80 },
      { field: 'name', title: '姓名', minWidth: 120 },
      { field: 'email', title: '邮箱', minWidth: 180 },
      { field: 'role', title: '角色', width: 100 },
      { field: 'status', title: '状态', width: 100 },
    ],
    proxyConfig: {
      ajax: {
        query: async ({ page, sorts, filters, form }) => {
          // 构建查询参数
          const params = {
            page: page.currentPage,
            pageSize: page.pageSize,
            ...form,
          };

          // 处理排序
          if (sorts && sorts.length > 0) {
            const sort = sorts[0];
            params.sortBy = sort.field;
            params.sortOrder = sort.order;
          }

          // 处理筛选
          if (filters && filters.length > 0) {
            filters.forEach(filter => {
              params[filter.field] = filter.value;
            });
          }

          try {
            const response = await api.getUsers(params);
            return {
              result: response.data.items,
              total: response.data.total,
            };
          } catch (error) {
            console.error('加载数据失败:', error);
            return {
              result: [],
              total: 0,
            };
          }
        },
      },
    },

    // 响应数据结构映射
    proxyConfig: {
      props: {
        result: 'result', // 数据列表字段
        total: 'total',   // 总数字段
      },
    },

    // 分页配置
    pagerConfig: {
      enabled: true,
      currentPage: 1,
      pageSize: 20,
      pageSizes: [10, 20, 50, 100],
    },
  },
});

// 刷新数据
const refreshData = () => {
  gridApi.commitProxy('query');
};

// 重置查询
const resetQuery = () => {
  gridApi.commitProxy('reload');
};
````

### 表单集成

```typescript
const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    // 表格列配置
    columns: [
      { field: 'id', title: 'ID', width: 80 },
      { field: 'name', title: '姓名', minWidth: 120 },
      { field: 'email', title: '邮箱', minWidth: 180 },
      { field: 'role', title: '角色', width: 100 },
      { field: 'status', title: '状态', width: 100 },
    ],

    // 代理配置
    proxyConfig: {
      ajax: {
        query: async ({ page, form }) => {
          const params = {
            page: page.currentPage,
            pageSize: page.pageSize,
            ...form,
          };
          return await api.getUsers(params);
        },
      },
    },
  },

  // 表单配置
  formOptions: {
    schema: [
      {
        component: 'Input',
        fieldName: 'name',
        label: '姓名',
        componentProps: {
          placeholder: '请输入姓名',
        },
      },
      {
        component: 'Select',
        fieldName: 'role',
        label: '角色',
        componentProps: {
          placeholder: '请选择角色',
          options: [
            { label: '全部', value: '' },
            { label: '管理员', value: 'admin' },
            { label: '用户', value: 'user' },
          ],
        },
      },
      {
        component: 'Select',
        fieldName: 'status',
        label: '状态',
        componentProps: {
          placeholder: '请选择状态',
          options: [
            { label: '全部', value: '' },
            { label: '启用', value: 1 },
            { label: '禁用', value: 0 },
          ],
        },
      },
    ],
  },
});

// 手动提交表单
const handleSearch = () => {
  gridApi.commitProxy('query');
};
```

## 单元格渲染器

VbenVxeTable 提供了多种内置的单元格渲染器：

### 1. 图片渲染器 (CellImage)

```typescript
const columns = [
  {
    field: 'avatar',
    title: '头像',
    width: 100,
    cellRender: {
      name: 'CellImage',
      props: {
        width: 40,
        height: 40,
        borderRadius: '50%',
        fit: 'cover',
      },
    },
  },
];

// 数据格式
const data = [
  {
    avatar: 'https://example.com/avatar.jpg',
    // ... 其他字段
  },
];
```

### 2. 链接渲染器 (CellLink)

```typescript
const columns = [
  {
    field: 'website',
    title: '网站',
    minWidth: 150,
    cellRender: {
      name: 'CellLink',
      props: {
        target: '_blank',
        color: '#18a058',
      },
    },
  },
];

// 数据格式
const data = [
  {
    website: 'https://example.com',
    // ... 其他字段
  },
];
```

### 3. 标签渲染器 (CellTag)

```typescript
const columns = [
  {
    field: 'status',
    title: '状态',
    width: 100,
    cellRender: {
      name: 'CellTag',
      options: [
        { color: 'success', label: '启用', value: 1 },
        { color: 'error', label: '禁用', value: 0 },
        { color: 'warning', label: '待审核', value: 2 },
      ],
    },
  },
];

// 数据格式
const data = [
  {
    status: 1, // 对应 options 中的 value
    // ... 其他字段
  },
];
```

### 4. 开关渲染器 (CellSwitch)

```typescript
const columns = [
  {
    field: 'enabled',
    title: '启用状态',
    width: 100,
    cellRender: {
      name: 'CellSwitch',
      props: {
        checkedValue: 1,
        uncheckedValue: 0,
        checkedText: '启用',
        uncheckedText: '禁用',
      },
      events: {
        change: async ({ row }) => {
          try {
            await updateUserStatus(row.id, row.enabled);
            message.success('状态更新成功');
          } catch (error) {
            message.error('状态更新失败');
            // 恢复原状态
            row.enabled = !row.enabled;
          }
        },
      },
    },
  },
];
```

### 5. 操作按钮渲染器 (CellOperation)

```typescript
const columns = [
  {
    field: 'operation',
    title: '操作',
    width: 200,
    cellRender: {
      name: 'CellOperation',
      options: [
        // 预设按钮
        'edit', // 编辑按钮
        'delete', // 删除按钮

        // 自定义按钮
        {
          code: 'view',
          text: '查看',
          icon: 'EyeIcon',
          type: 'default',
          show: ({ row }) => row.status === 1, // 条件显示
        },
        {
          code: 'reset-password',
          text: '重置密码',
          icon: 'KeyIcon',
          type: 'warning',
          confirm: {
            title: '确认重置密码',
            content: '确定要重置该用户的密码吗？',
          },
        },
      ],
    },
    events: {
      click: ({ code, row }) => {
        switch (code) {
          case 'edit':
            handleEdit(row);
            break;
          case 'delete':
            handleDelete(row);
            break;
          case 'view':
            handleView(row);
            break;
          case 'reset-password':
            handleResetPassword(row);
            break;
        }
      },
    },
  },
];

// 操作处理函数
const handleEdit = (row) => {
  console.log('编辑:', row);
  // 打开编辑弹窗
};

const handleDelete = async (row) => {
  try {
    await deleteUser(row.id);
    message.success('删除成功');
    gridApi.commitProxy('query');
  } catch (error) {
    message.error('删除失败');
  }
};

const handleView = (row) => {
  console.log('查看:', row);
  // 打开详情弹窗
};

const handleResetPassword = async (row) => {
  try {
    await resetPassword(row.id);
    message.success('密码重置成功');
  } catch (error) {
    message.error('密码重置失败');
  }
};
```

## 高级功能

### 树形表格

```typescript
const gridOptions = {
  columns: [
    { field: 'name', title: '名称', treeNode: true, minWidth: 200 },
    { field: 'size', title: '大小', width: 100 },
    { field: 'type', title: '类型', width: 100 },
    {
      field: 'operation',
      title: '操作',
      width: 150,
      cellRender: {
        name: 'CellOperation',
        options: ['edit', 'delete', { code: 'append', text: '添加子项' }],
      },
    },
  ],

  // 树形配置
  treeConfig: {
    transform: true,
    rowField: 'id',
    parentField: 'parentId',
    expandAll: true,
    accordion: false,
    indent: 20,
  },

  data: [
    { id: 1, name: '根目录', parentId: null, size: '0B', type: 'folder' },
    { id: 2, name: '子目录1', parentId: 1, size: '100KB', type: 'folder' },
    { id: 3, name: '文件1.txt', parentId: 2, size: '50KB', type: 'file' },
    { id: 4, name: '文件2.txt', parentId: 2, size: '50KB', type: 'file' },
  ],
};
```

### 可编辑表格

#### 单元格编辑

```typescript
const gridOptions = {
  columns: [
    {
      field: 'name',
      title: '姓名',
      editRender: {
        name: 'Input',
        props: {
          placeholder: '请输入姓名',
        },
      },
    },
    {
      field: 'email',
      title: '邮箱',
      editRender: {
        name: 'Input',
        props: {
          placeholder: '请输入邮箱',
        },
      },
    },
    {
      field: 'role',
      title: '角色',
      editRender: {
        name: 'Select',
        props: {
          placeholder: '请选择角色',
          options: [
            { label: '管理员', value: 'admin' },
            { label: '用户', value: 'user' },
          ],
        },
      },
    },
  ],

  // 编辑配置
  editConfig: {
    trigger: 'click', // click | manual
    mode: 'cell', // cell | row
    showStatus: true,
  },

  // 编辑规则
  editRules: {
    name: [
      { required: true, message: '姓名不能为空' },
      { min: 2, max: 20, message: '姓名长度在2-20个字符之间' },
    ],
    email: [
      { required: true, message: '邮箱不能为空' },
      { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: '邮箱格式不正确' },
    ],
  },
};
```

#### 行编辑

```typescript
const gridOptions = {
  columns: [
    {
      field: 'name',
      title: '姓名',
      editRender: {
        name: 'Input',
      },
    },
    {
      field: 'email',
      title: '邮箱',
      editRender: {
        name: 'Input',
      },
    },
    {
      field: 'role',
      title: '角色',
      editRender: {
        name: 'Select',
        props: {
          options: [
            { label: '管理员', value: 'admin' },
            { label: '用户', value: 'user' },
          ],
        },
      },
    },
  ],

  editConfig: {
    trigger: 'click',
    mode: 'row',
    showStatus: true,
  },

  // 行操作配置
  toolbarConfig: {
    buttons: [
      {
        code: 'insert',
        name: '新增',
        status: 'primary',
        icon: 'AddIcon',
      },
      {
        code: 'delete',
        name: '删除',
        status: 'danger',
        icon: 'DeleteIcon',
      },
      {
        code: 'save',
        name: '保存',
        status: 'success',
        icon: 'SaveIcon',
      },
      {
        code: 'cancel',
        name: '取消',
        icon: 'CancelIcon',
      },
    ],
  },

  // 处理行操作
  toolbarConfig: {
    slots: {
      buttons: 'toolbar_buttons',
    },
  },
};

// 处理工具栏事件
const handleToolbarEvent = ({ code }) => {
  switch (code) {
    case 'insert':
      handleInsert();
      break;
    case 'delete':
      handleDelete();
      break;
    case 'save':
      handleSave();
      break;
    case 'cancel':
      handleCancel();
      break;
  }
};
```

### 虚拟滚动

```typescript
const gridOptions = {
  columns: [
    { field: 'id', title: 'ID', width: 80 },
    { field: 'name', title: '姓名', minWidth: 120 },
    { field: 'email', title: '邮箱', minWidth: 180 },
    // ... 更多列
  ],

  // 大量数据
  data: largeDataArray,

  // 虚拟滚动配置
  scrollY: {
    enabled: true,
    gt: 50, // 超过50条数据时启用虚拟滚动
    oSize: 2, // 缓冲大小
  },

  height: 600,
};
```

### 固定列和行

```typescript
const gridOptions = {
  columns: [
    // 左侧固定列
    { field: 'checkbox', type: 'checkbox', width: 50, fixed: 'left' },
    { field: 'id', title: 'ID', width: 80, fixed: 'left' },
    { field: 'name', title: '姓名', minWidth: 120 },

    // 中间列
    { field: 'email', title: '邮箱', minWidth: 180 },
    { field: 'phone', title: '手机号', width: 120 },
    { field: 'address', title: '地址', minWidth: 200 },
    { field: 'remark', title: '备注', minWidth: 300 },

    // 右侧固定列
    {
      field: 'operation',
      title: '操作',
      width: 150,
      fixed: 'right',
      cellRender: {
        name: 'CellOperation',
        options: ['edit', 'delete'],
      },
    },
  ],

  scrollX: {
    enabled: true,
  },

  height: 500,
};
```

### 复选框功能

```typescript
const gridOptions = {
  columns: [
    { type: 'checkbox', width: 50, fixed: 'left' },
    { field: 'id', title: 'ID', width: 80 },
    { field: 'name', title: '姓名', minWidth: 120 },
    { field: 'email', title: '邮箱', minWidth: 180 },
    {
      field: 'operation',
      title: '操作',
      width: 150,
      cellRender: {
        name: 'CellOperation',
        options: ['edit', 'delete'],
      },
    },
  ],

  checkboxConfig: {
    highlight: true, // 高亮选中行
    range: true, // 范围选择
  },

  // 获取选中的行
  onCheckboxChange: ({ checked, records, reserves }) => {
    console.log('选中行:', records);
    console.log('半选中行:', reserves);
  },
};
```

## 表格API方法

### 数据操作

```typescript
// 获取表格数据
const tableData = gridApi.getTableData();

// 获取选中的行
const selectedRows = gridApi.getCheckboxRecords();

// 清除选中状态
gridApi.clearCheckboxRow();

// 选中指定行
gridApi.setCheckboxRow([1, 2, 3], true);

// 反选指定行
gridApi.setCheckboxRow([1, 2, 3], false);

// 全选
gridApi.setAllCheckboxRow(true);

// 取消全选
gridApi.setAllCheckboxRow(false);
```

### 表格操作

```typescript
// 刷新数据
gridApi.commitProxy('query');

// 重新加载
gridApi.commitProxy('reload');

// 获取表格实例
const tableInstance = gridApi.getTableInstance();

// 获取列配置
const columns = gridApi.getColumns();

// 更新列配置
gridApi.updateColumn([
  { field: 'name', title: '用户名' },
  { field: 'email', title: '邮箱地址' },
]);

// 刷新列
gridApi.refreshColumn();
```

### 分页操作

```typescript
// 获取当前页码
const currentPage = gridApi.getPageInfo()?.currentPage;

// 设置页码
gridApi.setPageInfo({ currentPage: 2 });

// 获取分页大小
const pageSize = gridApi.getPageInfo()?.pageSize;

// 设置分页大小
gridApi.setPageInfo({ pageSize: 50 });
```

## 事件处理

### 表格事件

```typescript
const gridOptions = {
  onCellClick: ({ row, column }) => {
    console.log('单元格点击:', row, column);
  },

  onCellDblclick: ({ row, column }) => {
    console.log('单元格双击:', row, column);
  },

  onSortChange: ({ column, property, order }) => {
    console.log('排序变化:', column, property, order);
  },

  onFilterChange: ({ column, property, filters }) => {
    console.log('筛选变化:', column, property, filters);
  },

  onCheckboxChange: ({ checked, row, rowIndex }) => {
    console.log('复选框变化:', checked, row, rowIndex);
  },

  onCheckboxAll: ({ checked, records, reserves }) => {
    console.log('全选变化:', checked, records, reserves);
  },
};
```

### 工具栏事件

```typescript
const gridOptions = {
  toolbarConfig: {
    buttons: [
      {
        code: 'add',
        name: '新增',
        status: 'primary',
        onClick: () => {
          console.log('新增按钮点击');
        },
      },
      {
        code: 'delete',
        name: '批量删除',
        status: 'danger',
        onClick: () => {
          const selectedRows = gridApi.getCheckboxRecords();
          if (selectedRows.length === 0) {
            message.warning('请选择要删除的数据');
            return;
          }
          handleBatchDelete(selectedRows);
        },
      },
    ],
  },
};
```

## 常见使用场景

### 用户管理表格

```vue
<template>
  <div>
    <div class="mb-4 flex justify-between">
      <div>
        <n-button type="primary" @click="handleAdd">
          <template #icon>
            <n-icon><AddIcon /></n-icon>
          </template>
          新增用户
        </n-button>
        <n-button
          type="error"
          :disabled="selectedRows.length === 0"
          @click="handleBatchDelete"
        >
          批量删除
        </n-button>
      </div>

      <div>
        <n-button @click="refreshData">
          <template #icon>
            <n-icon><RefreshIcon /></n-icon>
          </template>
          刷新
        </n-button>
        <n-button @click="exportData">
          <template #icon>
            <n-icon><DownloadIcon /></n-icon>
          </template>
          导出
        </n-button>
      </div>
    </div>

    <Grid :options="gridOptions" />
  </div>
</template>

<script setup lang="ts">
const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: [
      { type: 'checkbox', width: 50, fixed: 'left' },
      { field: 'id', title: 'ID', width: 80 },
      {
        field: 'avatar',
        title: '头像',
        width: 80,
        cellRender: { name: 'CellImage' },
      },
      { field: 'name', title: '姓名', minWidth: 120 },
      { field: 'email', title: '邮箱', minWidth: 180 },
      { field: 'role', title: '角色', width: 100 },
      {
        field: 'status',
        title: '状态',
        width: 100,
        cellRender: { name: 'CellTag' },
      },
      {
        field: 'operation',
        title: '操作',
        width: 200,
        cellRender: {
          name: 'CellOperation',
          options: ['edit', 'delete'],
        },
      },
    ],
    proxyConfig: {
      ajax: {
        query: async ({ page, form }) => {
          return await api.getUsers({
            page: page.currentPage,
            pageSize: page.pageSize,
            ...form,
          });
        },
      },
    },
    pagerConfig: {
      enabled: true,
      currentPage: 1,
      pageSize: 20,
    },
    checkboxConfig: {
      highlight: true,
      range: true,
    },
  },
});

// 获取选中的行
const selectedRows = computed(() => {
  return gridApi.getCheckboxRecords();
});

// 新增用户
const handleAdd = () => {
  // 打开新增弹窗
  openUserModal();
};

// 编辑用户
const handleEdit = (row) => {
  // 打开编辑弹窗
  openUserModal(row);
};

// 删除用户
const handleDelete = async (row) => {
  try {
    await api.deleteUser(row.id);
    message.success('删除成功');
    gridApi.commitProxy('query');
  } catch (error) {
    message.error('删除失败');
  }
};

// 批量删除
const handleBatchDelete = async () => {
  try {
    const ids = selectedRows.value.map((row) => row.id);
    await api.batchDeleteUsers(ids);
    message.success(`成功删除 ${ids.length} 条记录`);
    gridApi.commitProxy('query');
  } catch (error) {
    message.error('批量删除失败');
  }
};

// 刷新数据
const refreshData = () => {
  gridApi.commitProxy('reload');
};

// 导出数据
const exportData = () => {
  const selectedRows = gridApi.getCheckboxRecords();
  const data = selectedRows.length > 0 ? selectedRows : gridApi.getTableData();

  // 导出为Excel
  exportToExcel(data);
};
</script>
```

### 数据分析表格

```typescript
const gridOptions = {
  columns: [
    { field: 'date', title: '日期', width: 120 },
    { field: 'pageViews', title: '页面访问量', width: 120 },
    { field: 'uniqueVisitors', title: '独立访客', width: 120 },
    { field: 'bounceRate', title: '跳出率', width: 100 },
    { field: 'avgSessionDuration', title: '平均会话时长', width: 120 },
    {
      field: 'trend',
      title: '趋势',
      width: 100,
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'success', label: '上升', value: 'up' },
          { color: 'error', label: '下降', value: 'down' },
          { color: 'default', label: '持平', value: 'stable' },
        ],
      },
    },
  ],

  proxyConfig: {
    ajax: {
      query: async ({ page, form }) => {
        return await api.getAnalytics({
          page: page.currentPage,
          pageSize: page.pageSize,
          startDate: form.dateRange?.[0],
          endDate: form.dateRange?.[1],
        });
      },
    },
  },

  formOptions: {
    schema: [
      {
        component: 'RangePicker',
        fieldName: 'dateRange',
        label: '日期范围',
      },
    ],
  },
};
```

## 性能优化

### 1. 虚拟滚动

```typescript
// 大数据量时启用虚拟滚动
const gridOptions = {
  scrollY: {
    enabled: true,
    gt: 100, // 超过100条数据时启用
  },
  height: 500,
};
```

### 2. 数据懒加载

```typescript
const gridOptions = {
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        // 分页加载，避免一次性加载大量数据
        const response = await api.getData({
          page: page.currentPage,
          pageSize: Math.min(page.pageSize, 100), // 限制单次加载数量
        });
        return response;
      },
    },
  },
};
```

### 3. 组件懒加载

```typescript
// 复杂组件使用懒加载
const gridOptions = {
  columns: [
    {
      field: 'details',
      title: '详情',
      width: 200,
      cellRender: {
        name: 'CellExpand',
        lazy: true, // 懒加载
        loadMethod: async ({ row }) => {
          return await loadRowDetails(row.id);
        },
      },
    },
  ],
};
```

## 样式定制

### 全局样式

```scss
.vben-table {
  .vxe-table {
    font-size: 14px;

    .vxe-header {
      background-color: var(--background);
      font-weight: 600;
    }

    .vxe-body--row.row--stripe {
      background-color: var(--muted);
    }

    .vxe-body--row:hover {
      background-color: var(--accent);
    }
  }

  .vxe-pager {
    .vxe-pager--wrapper {
      justify-content: flex-end;
    }
  }
}
```

### 响应式配置

```typescript
const gridOptions = {
  height: computed(() => {
    // 根据屏幕高度动态设置
    const { height } = useWindowSize();
    return Math.min(height.value - 200, 600);
  }),

  // 移动端隐藏部分列
  columns: computed(() => {
    const { width } = useWindowSize();
    const baseColumns = [
      { field: 'id', title: 'ID', width: 60 },
      { field: 'name', title: '姓名', minWidth: 100 },
      { field: 'operation', title: '操作', width: 100 },
    ];

    if (width.value > 768) {
      return [
        ...baseColumns,
        { field: 'email', title: '邮箱', minWidth: 150 },
        { field: 'role', title: '角色', width: 80 },
      ];
    }

    return baseColumns;
  }),
};
```

## 常见问题

### Q1: 如何处理大量数据的性能问题？

```typescript
// 1. 启用虚拟滚动
const gridOptions = {
  scrollY: { enabled: true, gt: 100 },
};

// 2. 分页加载
const gridOptions = {
  pagerConfig: {
    enabled: true,
    pageSize: 20,
  },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        // 只请求当前页的数据
        return await api.getData({
          page: page.currentPage,
          pageSize: page.pageSize,
        });
      },
    },
  },
};

// 3. 列配置优化
const gridOptions = {
  columns: [
    // 只设置必要的列属性
    { field: 'name', title: '姓名', minWidth: 120 },
    // 避免使用复杂的cellRender
  ],
};
```

### Q2: 如何实现表格的导出功能？

```typescript
const exportToExcel = (data: any[]) => {
  import * as XLSX from 'xlsx';

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

  XLSX.writeFile(wb, '表格数据.xlsx');
};

// 按钮配置
const gridOptions = {
  toolbarConfig: {
    buttons: [
      {
        code: 'export',
        name: '导出',
        icon: 'DownloadIcon',
        onClick: () => {
          const selectedRows = gridApi.getCheckboxRecords();
          const data =
            selectedRows.length > 0 ? selectedRows : gridApi.getTableData();
          exportToExcel(data);
        },
      },
    ],
  },
};
```

### Q3: 如何实现表格的搜索功能？

```typescript
const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: tableColumns,
  },

  formOptions: {
    schema: [
      {
        component: 'Input',
        fieldName: 'keyword',
        label: '关键词',
      },
      {
        component: 'Select',
        fieldName: 'status',
        label: '状态',
        componentProps: {
          options: [
            { label: '全部', value: '' },
            { label: '启用', value: 1 },
            { label: '禁用', value: 0 },
          ],
        },
      },
      {
        component: 'RangePicker',
        fieldName: 'dateRange',
        label: '日期范围',
      },
    ],
  },
});

// 手动触发搜索
const handleSearch = () => {
  gridApi.commitProxy('query');
};

// 重置搜索
const handleReset = () => {
  const formApi = gridApi.getFormApi();
  formApi?.resetForm();
  gridApi.commitProxy('reload');
};
```

## 最佳实践

1. **数据量控制**: 大数据量时使用虚拟滚动和分页
2. **列配置优化**: 只设置必要的列属性，避免过度渲染
3. **事件处理**: 合理使用防抖和节流
4. **内存管理**: 及时清理不需要的数据和事件监听器
5. **用户体验**: 提供加载状态和操作反馈
6. **代码复用**: 将通用配置提取为可复用的函数
7. **类型安全**: 使用TypeScript定义数据类型和接口

通过 VbenVxeTable 系统，可以快速构建功能强大、性能优秀的表格页面，满足各种业务场景的需求。

```vue
<template>
  <div>
    <Grid :options="gridOptions" />
  </div>
</template>

<script setup lang="ts">
import { Grid } from '@vben/plugins/vxe-table';
import { useVbenVxeGrid } from '@vben/plugins/vxe-table';

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: [
      { field: 'id', title: 'ID', width: 80 },
      { field: 'name', title: '名称' },
      { field: 'age', title: '年龄' },
      { field: 'address', title: '地址' },
    ],
    data: [
      { id: 1, name: '张三', age: 25, address: '北京市朝阳区' },
      { id: 2, name: '李四', age: 30, address: '上海市浦东新区' },
    ],
    height: 400,
  },
});
</script>
```

### 2. 远程数据加载

```vue
<script setup lang="ts">
import type { VxeGridProps } from 'vxe-table';

const gridOptions: VxeGridProps = {
  columns: [
    { field: 'id', title: 'ID' },
    { field: 'name', title: '名称' },
    { field: 'email', title: '邮箱' },
  ],
  proxyConfig: {
    ajax: {
      query: async ({ page, sorts, filters, form }) => {
        // 处理查询参数
        const params = {
          page: page.currentPage,
          pageSize: page.pageSize,
          ...form,
        };

        // 调用API获取数据
        const response = await getUserList(params);

        return {
          result: response.data.items,
          total: response.data.total,
        };
      },
    },
  },
  formConfig: {
    items: [
      { field: 'name', title: '名称', itemRender: { name: 'VbenInput' } },
      { field: 'email', title: '邮箱', itemRender: { name: 'VbenInput' } },
    ],
  },
  toolbarConfig: {
    refresh: true,
    zoom: true,
    custom: true,
  },
};

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions,
  formOptions: {
    schema: [
      {
        component: 'Input',
        fieldName: 'name',
        label: '名称',
      },
      {
        component: 'Input',
        fieldName: 'email',
        label: '邮箱',
      },
    ],
  },
});
</script>
```

## 单元格渲染器

### 内置渲染器类型

项目提供了多种内置单元格渲染器：

#### 1. CellImage - 图片渲染

```typescript
const columns = [
  {
    field: 'avatar',
    title: '头像',
    width: 100,
    cellRender: {
      name: 'CellImage',
      props: {
        width: 40,
        height: 40,
        borderRadius: '50%',
      },
    },
  },
];
```

#### 2. CellLink - 链接渲染

```typescript
const columns = [
  {
    field: 'website',
    title: '网站',
    cellRender: {
      name: 'CellLink',
      props: {
        target: '_blank',
      },
    },
  },
];
```

#### 3. CellTag - 标签渲染

```typescript
const columns = [
  {
    field: 'status',
    title: '状态',
    cellRender: {
      name: 'CellTag',
      options: [
        { color: 'success', label: '启用', value: 1 },
        { color: 'error', label: '禁用', value: 0 },
        { color: 'warning', label: '待审核', value: 2 },
      ],
    },
  },
];
```

#### 4. CellSwitch - 开关渲染

```typescript
const columns = [
  {
    field: 'enabled',
    title: '启用状态',
    width: 100,
    cellRender: {
      name: 'CellSwitch',
      props: {
        checkedValue: 1,
        uncheckedValue: 0,
      },
      events: {
        change: async ({ row }) => {
          // 处理状态切换
          await updateUserStatus(row.id, row.enabled);
        },
      },
    },
  },
];
```

#### 5. CellOperation - 操作按钮渲染

```typescript
const columns = [
  {
    field: 'operation',
    title: '操作',
    width: 200,
    cellRender: {
      name: 'CellOperation',
      options: [
        'edit', // 预设的编辑按钮
        'delete', // 预设的删除按钮
        {
          code: 'view',
          text: '查看',
          icon: 'EyeIcon',
        },
        {
          code: 'reset-password',
          text: '重置密码',
          color: 'warning',
          visible: ({ row }) => row.status === 1,
        },
      ],
    },
    events: {
      click: ({ code, row }) => {
        switch (code) {
          case 'edit':
            handleEdit(row);
            break;
          case 'delete':
            handleDelete(row);
            break;
          case 'view':
            handleView(row);
            break;
          case 'reset-password':
            handleResetPassword(row);
            break;
        }
      },
    },
  },
];
```

## 表单集成

### 搜索表单配置

VxeTable与VbenForm系统深度集成，支持复杂的搜索表单：

```typescript
const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    // 表格配置
  },
  formOptions: {
    schema: [
      {
        component: 'Input',
        fieldName: 'name',
        label: '名称',
        rules: 'max:50',
      },
      {
        component: 'Select',
        fieldName: 'status',
        label: '状态',
        componentProps: {
          options: [
            { label: '全部', value: '' },
            { label: '启用', value: 1 },
            { label: '禁用', value: 0 },
          ],
        },
      },
      {
        component: 'RangePicker',
        fieldName: 'dateRange',
        label: '日期范围',
      },
      {
        component: 'Select',
        fieldName: 'departmentId',
        label: '部门',
        dependencies: {
          triggerFields: ['companyId'],
          show: ({ values }) => values.companyId,
        },
      },
    ],
  },
});
```

### 表单提交处理

```typescript
const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    // 表单配置
    handleSubmit: async (values) => {
      // 自定义提交逻辑
      const searchParams = {
        ...values,
        startDate: values.dateRange?.[0],
        endDate: values.dateRange?.[1],
      };

      // 手动刷新表格数据
      await gridApi.query(searchParams);
    },
  },
});
```

## 高级功能

### 1. 树形表格

```typescript
const gridOptions: VxeGridProps = {
  columns: [
    { field: 'name', title: '名称', treeNode: true },
    { field: 'size', title: '大小' },
    { field: 'type', title: '类型' },
  ],
  treeConfig: {
    transform: true,
    rowField: 'id',
    parentField: 'parentId',
    expandAll: true,
    accordion: false,
  },
  data: [
    { id: 1, name: '文件夹1', parentId: null },
    { id: 2, name: '子文件夹1-1', parentId: 1 },
    { id: 3, name: '文件1-1-1', parentId: 2 },
    { id: 4, name: '文件夹2', parentId: null },
  ],
};
```

### 2. 可编辑表格

#### 单元格编辑

```typescript
const columns = [
  {
    field: 'name',
    title: '名称',
    editRender: {
      name: 'VbenInput',
      props: {
        placeholder: '请输入名称',
      },
    },
  },
  {
    field: 'status',
    title: '状态',
    editRender: {
      name: 'VbenSelect',
      props: {
        options: [
          { label: '启用', value: 1 },
          { label: '禁用', value: 0 },
        ],
      },
    },
  },
];

const gridOptions: VxeGridProps = {
  columns,
  editConfig: {
    trigger: 'click',
    mode: 'cell',
  },
  editRules: {
    name: [{ required: true, message: '名称不能为空' }],
  },
};
```

#### 行编辑

```typescript
const gridOptions: VxeGridProps = {
  columns,
  editConfig: {
    trigger: 'click',
    mode: 'row',
  },
  toolbarConfig: {
    buttons: [
      {
        code: 'insert',
        name: '新增',
        status: 'primary',
      },
      {
        code: 'delete',
        name: '删除',
        status: 'danger',
      },
      {
        code: 'save',
        name: '保存',
        status: 'success',
      },
    ],
  },
};
```

### 3. 虚拟滚动

```typescript
const gridOptions: VxeGridProps = {
  columns,
  data: [], // 大量数据
  scrollY: {
    enabled: true,
    gt: 50, // 超过50条数据时启用虚拟滚动
  },
  height: 600,
};
```

### 4. 固定列和行

```typescript
const columns = [
  { field: 'id', title: 'ID', width: 80, fixed: 'left' },
  { field: 'name', title: '姓名', width: 120, fixed: 'left' },
  // ... 中间列
  { field: 'operation', title: '操作', width: 150, fixed: 'right' },
];

const gridOptions: VxeGridProps = {
  columns,
  data: [], // 大量数据
  scrollX: {
    enabled: true,
  },
  scrollY: {
    enabled: true,
  },
};
```

## 事件处理

### 表格事件

```typescript
const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    onCellClick: ({ row, column }) => {
      console.log('单元格点击', row, column);
    },
    onCellDblclick: ({ row, column }) => {
      console.log('单元格双击', row, column);
    },
    onSortChange: ({ column, property, order }) => {
      console.log('排序变化', column, property, order);
    },
    onFilterChange: ({ column, property, filters }) => {
      console.log('过滤变化', column, property, filters);
    },
    onCheckboxChange: ({
      checked,
      row,
      rowIndex,
      $rowIndex,
      column,
      columnIndex,
      $columnIndex,
      $table,
    }) => {
      console.log('复选框变化', checked, row);
    },
    onCheckboxAll: ({ checked, records, reserves }) => {
      console.log('全选变化', checked, records);
    },
  },
});
```

### 工具栏事件

```typescript
const gridOptions: VxeGridProps = {
  toolbarConfig: {
    buttons: [
      {
        code: 'custom-add',
        name: '新增',
        status: 'primary',
        events: {
          click: () => {
            handleAdd();
          },
        },
      },
    ],
    refresh: {
      query: () => {
        // 刷新按钮点击事件
        gridApi.commitProxy('query');
      },
    },
    import: {
      show: true,
      events: {
        success: ({ file, body }) => {
          console.log('导入成功', file, body);
        },
      },
    },
    export: {
      show: true,
      filename: '用户列表',
      type: 'xlsx',
      events: {
        success: ({ body }) => {
          console.log('导出成功', body);
        },
      },
    },
  },
};
```

## 样式定制

### 主题适配

VxeTable会自动适配当前选择的主题：

```scss
// 自定义表格样式
.vxe-grid {
  .vxe-table {
    // 表头样式
    .vxe-header {
      background-color: var(--background);
    }

    // 斑马纹
    .vxe-body--row.row--stripe {
      background-color: var(--muted);
    }

    // 悬停效果
    .vxe-body--row:hover {
      background-color: var(--accent);
    }
  }
}
```

### 响应式设计

```typescript
import { useMediaQuery } from '@vueuse/core';

const isMobile = useMediaQuery('(max-width: 768px)');

const gridOptions = computed(() => ({
  columns: isMobile.value
    ? mobileColumns // 移动端列配置
    : desktopColumns, // 桌面端列配置
  height: isMobile.value ? 'auto' : 600,
}));
```

## 性能优化

### 1. 数据分页

```typescript
const gridOptions: VxeGridProps = {
  pagerConfig: {
    enabled: true,
    currentPage: 1,
    pageSize: 20,
    pageSizes: [10, 20, 50, 100],
  },
  proxyConfig: {
    props: {
      result: 'items', // 响应数据列表字段
      total: 'total', // 响应数据总数字段
    },
    ajax: {
      query: ({ page }) => {
        return fetchData(page.currentPage, page.pageSize);
      },
    },
  },
};
```

### 2. 懒加载

```typescript
const gridOptions: VxeGridProps = {
  columns: [
    {
      field: 'details',
      title: '详情',
      cellRender: {
        name: 'CellExpand',
        props: {
          lazy: true,
          loadMethod: async ({ row }) => {
            // 懒加载详情数据
            const details = await fetchDetails(row.id);
            return details;
          },
        },
      },
    },
  ],
};
```

### 3. 列宽优化

```typescript
const columns = [
  {
    field: 'id',
    title: 'ID',
    width: 80,
    resizable: false, // 固定宽度列禁用拖拽
  },
  {
    field: 'name',
    title: '名称',
    minWidth: 120, // 最小宽度
    showOverflow: 'tooltip', // 溢出显示tooltip
  },
];
```

## 最佳实践

### 1. 代码组织

```typescript
// types.ts
export interface User {
  id: number;
  name: string;
  email: string;
  status: number;
  createdAt: string;
}

// columns.ts
export const createUserColumns = (onAction: OnActionClickFn) => [
  { field: 'id', title: 'ID', width: 80 },
  { field: 'name', title: '名称', minWidth: 120 },
  { field: 'email', title: '邮箱', minWidth: 180 },
  {
    field: 'status',
    title: '状态',
    width: 100,
    cellRender: {
      name: 'CellTag',
      options: getStatusOptions(),
    },
  },
  {
    field: 'operation',
    title: '操作',
    width: 180,
    cellRender: {
      name: 'CellOperation',
      options: ['edit', 'delete'],
    },
  },
];

// useUserTable.ts
export function useUserTable() {
  const [Grid, gridApi] = useVbenVxeGrid({
    gridOptions: {
      columns: createUserColumns(handleAction),
      proxyConfig: {
        ajax: {
          query: userApi.getList,
        },
      },
    },
  });

  const handleAction = async ({ code, row }: ActionParams) => {
    // 处理操作逻辑
  };

  return {
    Grid,
    gridApi,
    refresh: () => gridApi.commitProxy('query'),
  };
}
```

### 2. 错误处理

```typescript
const gridOptions: VxeGridProps = {
  proxyConfig: {
    ajax: {
      query: async (params) => {
        try {
          const response = await userApi.getList(params);
          return {
            result: response.data.items,
            total: response.data.total,
          };
        } catch (error) {
          console.error('加载数据失败:', error);
          // 显示错误提示
          message.error('加载数据失败，请重试');
          return {
            result: [],
            total: 0,
          };
        }
      },
    },
  },
};
```

### 3. 类型安全

```typescript
import type { VxeGridProps } from 'vxe-table';
import type { User } from './types';

const gridOptions: VxeGridProps<User> = {
  columns: [
    { field: 'id', title: 'ID' },
    { field: 'name', title: '名称' },
    // TypeScript会自动检查字段名是否正确
  ],
  data: [] as User[], // 确保数据类型正确
};
```

## 常见问题

### Q1: 如何实现列的显示/隐藏？

```typescript
// 使用列配置功能
const gridOptions: VxeGridProps = {
  customConfig: {
    storage: true,
    checkMethod: ({ column }) => {
      // 控制某些列不允许配置
      return column.property !== 'operation';
    },
  },
};
```

### Q2: 如何实现表格数据导出？

```typescript
const gridOptions: VxeGridProps = {
  toolbarConfig: {
    export: {
      show: true,
      filename: '数据导出',
      sheetName: 'Sheet1',
      type: 'xlsx',
    },
  },
};
```

### Q3: 如何实现批量操作？

```typescript
const handleBatchDelete = async () => {
  const selectedRows = gridApi.getCheckboxRecords();
  if (selectedRows.length === 0) {
    message.warning('请选择要删除的数据');
    return;
  }

  const ids = selectedRows.map((row) => row.id);
  await userApi.batchDelete(ids);
  message.success('批量删除成功');
  gridApi.commitProxy('query');
};
```

### Q4: 如何实现搜索条件记忆？

```typescript
const { formApi } = useVbenForm({
  // 表单配置
});

// 保存搜索条件
const saveSearchState = () => {
  const formData = formApi?.getValues();
  localStorage.setItem('table-search', JSON.stringify(formData));
};

// 恢复搜索条件
const restoreSearchState = () => {
  const savedState = localStorage.getItem('table-search');
  if (savedState) {
    const formData = JSON.parse(savedState);
    formApi?.setValues(formData);
  }
};
```

## 总结

VxeTable在Vue Vben Admin中提供了完整的表格解决方案，具有以下优势：

1. **功能完整**: 支持排序、过滤、分页、编辑、树形等所有常用功能
2. **性能优秀**: 支持虚拟滚动、懒加载等性能优化方案
3. **集成度高**: 与VbenForm、权限系统等深度集成
4. **可扩展性强**: 支持自定义渲染器、事件处理等
5. **类型安全**: 完整的TypeScript支持

通过合理使用这些功能，可以快速构建出功能强大、性能优异的数据表格页面。
