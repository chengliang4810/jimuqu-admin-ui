# VbenModal/VbenDrawer 弹窗系统使用指南

## 概述

VbenModal 和 VbenDrawer 是 Vue Vben Admin 的弹窗系统，提供统一的模态框和抽屉组件。支持拖拽、全屏、自动关闭等功能，与表单系统深度集成，适用于各种弹窗交互场景。

## VbenModal 模态框

### 基础使用

```vue
<template>
  <div>
    <n-button @click="openModal">打开模态框</n-button>

    <!-- 模态框组件 -->
    <Modal />
  </div>
</template>

<script setup lang="ts">
import { useVbenModal } from '@vben/common-ui';

// 创建模态框
const [Modal, modalApi] = useVbenModal({
  // 模态框配置
  title: '用户信息',
  width: 600,
  draggable: true,
  fullscreen: true,

  // 内容组件
  contentComponent: UserInfoContent,

  // 事件回调
  onConfirm: handleConfirm,
  onCancel: handleCancel,
  onOpenChange: handleOpenChange,
});

// 打开模态框
const openModal = () => {
  modalApi.open();
};

// 处理确认
const handleConfirm = async () => {
  console.log('确认操作');
  modalApi.close();
};

// 处理取消
const handleCancel = () => {
  console.log('取消操作');
  modalApi.close();
};

// 处理打开状态变化
const handleOpenChange = (isOpen: boolean) => {
  console.log('模态框打开状态:', isOpen);
};
</script>

<!-- 内容组件 -->
<script lang="ts">
const UserInfoContent = defineComponent({
  name: 'UserInfoContent',
  setup() {
    // 模态框数据
    const modalData = ref({});

    // 监听模态框打开
    onMounted(() => {
      // 可以在这里初始化数据
      modalData.value = {
        name: '',
        email: '',
        age: null,
      };
    });

    return () => (
      <div>
        <n-form>
          <n-form-item label="姓名">
            <n-input v-model:value={modalData.value.name} />
          </n-form-item>
          <n-form-item label="邮箱">
            <n-input v-model:value={modalData.value.email} />
          </n-form-item>
          <n-form-item label="年龄">
            <n-input-number v-model:value={modalData.value.age} />
          </n-form-item>
        </n-form>
      </div>
    );
  },
});
</script>
```

### 高级配置

```typescript
const [Modal, modalApi] = useVbenModal({
  // 基础配置
  title: '高级模态框',
  width: 800,
  height: 600,
  draggable: true,
  resizable: true,
  fullscreen: true,

  // 样式配置
  class: 'custom-modal',
  style: {
    maxHeight: '80vh',
  },

  // 按钮配置
  showDefaultActions: true,
  confirmText: '确认',
  cancelText: '取消',
  confirmButtonProps: {
    type: 'primary',
    loading: false,
  },
  cancelButtonProps: {
    disabled: false,
  },

  // 行为配置
  closeOnEsc: true,
  closeOnClickOutside: false,
  destroyOnClose: false,
  centered: true,

  // 内容配置
  contentComponent: AdvancedContent,
  contentProps: {
    userId: 123,
    readonly: false,
  },

  // 事件配置
  onConfirm: async () => {
    // 确认操作
    try {
      modalApi.lock(true); // 锁定模态框
      await submitData();
      modalApi.close();
    } catch (error) {
      console.error('操作失败:', error);
    } finally {
      modalApi.unlock(); // 解锁模态框
    }
  },
  onCancel: () => {
    // 取消操作
  },
  onOpenChange: (isOpen) => {
    // 打开状态变化
  },
});
```

### 模态框 API 方法

```typescript
// 打开模态框
modalApi.open();

// 关闭模态框
modalApi.close();

// 切换模态框状态
modalApi.toggle();

// 检查模态框是否打开
const isOpen = modalApi.isOpen;

// 锁定模态框（显示loading状态）
modalApi.lock(true);
modalApi.unlock();

// 设置模态框数据
modalApi.setData({ userId: 123, action: 'edit' });

// 获取模态框数据
const data = modalApi.getData();

// 设置模态框标题
modalApi.setTitle('新标题');

// 更新模态框配置
modalApi.setState({
  width: 1000,
  fullscreen: false,
});

// 销毁模态框
modalApi.destroy();
```

## VbenDrawer 抽屉

### 基础使用

```vue
<template>
  <div>
    <n-button @click="openDrawer">打开抽屉</n-button>

    <!-- 抽屉组件 -->
    <Drawer />
  </div>
</template>

<script setup lang="ts">
import { useVbenDrawer } from '@vben/common-ui';

const [Drawer, drawerApi] = useVbenDrawer({
  title: '侧边栏详情',
  placement: 'right', // 'left' | 'right' | 'top' | 'bottom'
  width: 400,
  draggable: true,

  contentComponent: DrawerContent,

  onConfirm: handleConfirm,
});

const openDrawer = () => {
  drawerApi.open();
};

const handleConfirm = () => {
  console.log('抽屉确认');
  drawerApi.close();
};
</script>
```

### 抽屉配置

```typescript
const [Drawer, drawerApi] = useVbenDrawer({
  // 基础配置
  title: '侧边栏详情',
  placement: 'right',
  width: 500,
  height: '80%',
  draggable: true,

  // 样式配置
  class: 'custom-drawer',
  closable: true,
  closeIconPlacement: 'right', // 'left' | 'right'

  // 行为配置
  closeOnEsc: true,
  destroyOnClose: false,
  appendToMain: false, // 是否挂载到主内容区域

  // 内容配置
  contentComponent: DrawerContent,

  // 事件配置
  onOpenChange: (isOpen) => {
    console.log('抽屉状态变化:', isOpen);
  },
});
```

## 内容组件开发

### 连接组件模式

```vue
<template>
  <div>
    <n-button @click="openModal">编辑用户</n-button>
    <Modal />
  </div>
</template>

<script setup lang="ts">
import { useVbenModal } from '@vben/common-ui';

const [Modal, modalApi] = useVbenModal({
  title: '编辑用户',
  contentComponent: UserEditForm,
  connectedComponent: UserEditForm, // 连接组件
  onConfirm: handleConfirm,
});

const openModal = () => {
  // 设置初始数据
  modalApi.setData({
    userId: 123,
    mode: 'edit',
  });
  modalApi.open();
};

const handleConfirm = async () => {
  const formData = modalApi.getData()?.formData;
  await updateUser(formData);
  modalApi.close();
};
</script>

<!-- 连接组件 UserEditForm.vue -->
<script setup lang="ts">
import { useVbenModal } from '@vben/common-ui';

// 连接组件内部也有自己的modal实例
const [InternalModal, internalApi] = useVbenModal({
  title: '内部模态框',
  onConfirm: internalConfirm,
});

// 获取外部传递的数据
const externalData = defineProps<{
  userId?: number;
  mode?: 'edit' | 'create';
}>();

const formData = ref({
  name: '',
  email: '',
});

// 表单提交
const handleSubmit = async () => {
  const isValid = await validateForm();
  if (isValid) {
    // 可以通过外部API获取数据
    const parentModalData = (window as any).modalData;
    console.log('父组件数据:', parentModalData);

    // 或者返回数据给父组件
    (window as any).modalData = { formData };
  }
};

const internalConfirm = () => {
  console.log('内部确认');
};
</script>
```

### 独立内容组件

```vue
<!-- IndependentContent.vue -->
<script setup lang="ts">
import { useVbenModal } from '@vben/common-ui';

const props = defineProps<{
  userId?: number;
  mode?: 'view' | 'edit';
  onConfirm?: (data: any) => Promise<void>;
}>();

const emit = defineEmits<{
  confirm: [data: any];
  cancel: [];
}>();

const formData = ref({
  name: '',
  email: '',
});

// 调用外部传入的确认函数
const handleExternalConfirm = async () => {
  if (props.onConfirm) {
    await props.onConfirm(formData.value);
  }
  emit('confirm', formData.value);
};

// 获取父模态框的API（如果有）
const modalApi = inject('modalApi', null);
</script>

<template>
  <div>
    <n-form>
      <n-form-item label="姓名">
        <n-input v-model:value="formData.name" :readonly="mode === 'view'" />
      </n-form-item>
      <n-form-item label="邮箱">
        <n-input v-model:value="formData.email" :readonly="mode === 'view'" />
      </n-form-item>

      <!-- 可以包含自己的操作按钮 -->
      <div class="flex justify-end space-x-2">
        <n-button @click="emit('cancel')">取消</n-button>
        <n-button type="primary" @click="handleExternalConfirm">
          确认
        </n-button>
      </div>
    </n-form>
  </div>
</template>
```

## 表单集成

### 表单弹窗

```vue
<script setup lang="ts">
import { useVbenModal } from '@vben/common-ui';
import { useVbenForm } from '@vben/common-ui';

const [Modal, modalApi] = useVbenModal({
  title: '用户信息',
  width: 600,
  contentComponent: UserFormContent,
  onConfirm: handleConfirm,
});

// 创建表单
const [Form, formApi] = useVbenForm({
  schema: [
    {
      component: 'Input',
      fieldName: 'name',
      label: '姓名',
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'email',
      label: '邮箱',
      rules: 'required|email',
    },
    {
      component: 'InputNumber',
      fieldName: 'age',
      label: '年龄',
      rules: 'required|min_value:18',
    },
  ],
  showDefaultActions: false, // 关闭表单的默认按钮
});

// 表单内容组件
const UserFormContent = defineComponent({
  name: 'UserFormContent',
  setup() {
    const formData = ref({});

    // 监听父组件数据变化
    watch(
      () => modalApi.getData(),
      (data) => {
        if (data) {
          formApi.setValues(data);
          formData.value = data;
        }
      },
      { immediate: true },
    );

    // 处理表单提交
    const handleSubmit = async () => {
      try {
        await formApi.validate();
        const values = formApi.getValues();
        console.log('表单数据:', values);
        return values;
      } catch (error) {
        console.error('表单验证失败:', error);
        throw error;
      }
    };

    // 暴露提交方法给父组件
    defineExpose({
      submit: handleSubmit,
    });

    return () => (
      <div>
        <Form />
      </div>
    );
  },
});

const handleConfirm = async () => {
  try {
    const formContent = modalApi.getInnerComponent();
    const formData = await formContent?.submit();

    await saveUser(formData);
    modalApi.close();
  } catch (error) {
    console.error('保存失败:', error);
  }
};

const openModal = (userData = {}) => {
  modalApi.setData(userData);
  modalApi.open();
};
</script>
```

### 复杂表单弹窗

```vue
<script setup lang="ts">
const [Modal, modalApi] = useVbenModal({
  title: '高级用户设置',
  width: 800,
  fullscreen: true,
  draggable: true,

  contentComponent: AdvancedUserForm,

  // 自定义按钮
  confirmText: '保存设置',
  cancelText: '取消',
  showDefaultActions: true,

  onConfirm: async () => {
    const formContent = modalApi.getInnerComponent();

    try {
      modalApi.lock(true);
      await formContent?.submitAll();
      message.success('设置保存成功');
      modalApi.close();
    } catch (error) {
      message.error('保存失败');
    } finally {
      modalApi.unlock();
    }
  },
});

// 复杂表单内容组件
const AdvancedUserForm = defineComponent({
  name: 'AdvancedUserForm',
  setup() {
    // 用户基本信息表单
    const [BasicForm, basicFormApi] = useVbenForm({
      schema: basicFormSchema,
      showDefaultActions: false,
    });

    // 用户权限表单
    const [PermissionForm, permissionFormApi] = useVbenForm({
      schema: permissionFormSchema,
      showDefaultActions: false,
    });

    // 提交所有表单
    const submitAll = async () => {
      // 验证并提交基本信息
      await basicFormApi.validate();
      const basicData = basicFormApi.getValues();

      // 验证并提交权限信息
      await permissionFormApi.validate();
      const permissionData = permissionFormApi.getValues();

      // 合并数据并提交
      const combinedData = {
        ...basicData,
        permissions: permissionData,
      };

      return combinedData;
    };

    defineExpose({
      submit: submitAll,
    });

    return () => (
      <n-tabs>
        <n-tab-pane name="basic" tab="基本信息">
          <BasicForm />
        </n-tab-pane>
        <n-tab-pane name="permission" tab="权限设置">
          <PermissionForm />
        </n-tab-pane>
      </n-tabs>
    );
  },
});
</script>
```

## 常见使用场景

### 确认对话框

```typescript
const confirmDelete = async (item: any) => {
  const [ConfirmModal, confirmApi] = useVbenModal({
    title: '确认删除',
    width: 400,
    contentComponent: () => (
      <div>
        <p>确定要删除 "{item.name}" 吗？</p>
        <p class="text-red-500">此操作不可恢复！</p>
      </div>
    ),
    confirmText: '确定删除',
    cancelText: '取消',
    confirmButtonProps: {
      type: 'error',
    },
  });

  return new Promise((resolve, reject) => {
    confirmApi.open();

    confirmApi.onConfirm = async () => {
      try {
        await deleteItem(item.id);
        confirmApi.close();
        resolve(true);
      } catch (error) {
        reject(error);
      }
    };

    confirmApi.onCancel = () => {
      reject(new Error('用户取消操作'));
    };
  });
};
```

### 详情查看

```typescript
const viewDetails = async (item: any) => {
  const [DetailModal, detailApi] = useVbenModal({
    title: '详情信息',
    width: 800,
    fullscreen: true,
    contentComponent: DetailContent,
    showDefaultActions: false,
    closeButtonText: '关闭',
  });

  detailApi.setData(item);
  detailApi.open();
};
```

### 表格操作弹窗

```vue
<script setup lang="ts">
import { useVbenGrid } from '@vben/plugins/vxe-table';

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: [
      { field: 'name', title: '姓名' },
      { field: 'email', title: '邮箱' },
      {
        field: 'operation',
        title: '操作',
        cellRender: {
          name: 'CellOperation',
          options: ['edit', 'delete', 'view'],
        },
      },
    ],
  },
});

const openEditModal = async (row) => {
  const [EditModal, editApi] = useVbenModal({
    title: '编辑用户',
    contentComponent: EditUserForm,
    onConfirm: async () => {
      const formData = editApi.getData();
      await updateUser(row.id, formData);
      editApi.close();
      gridApi.commitProxy('query'); // 刷新表格
    },
  });

  editApi.setData(row);
  editApi.open();
};

const openDeleteConfirm = async (row) => {
  // 使用确认对话框实现删除
};
</script>
```

## 高级功能

### 弹窗嵌套

```typescript
const [ParentModal, parentApi] = useVbenModal({
  title: '父弹窗',
  contentComponent: ParentContent,
});

const ParentContent = defineComponent({
  setup() {
    const [ChildModal, childApi] = useVbenModal({
      title: '子弹窗',
      contentComponent: ChildContent,
    });

    const openChildModal = () => {
      childApi.open();
    };

    return () => (
      <div>
        <p>父弹窗内容</p>
        <n-button @click={openChildModal}>打开子弹窗</n-button>
        <ChildModal />
      </div>
    );
  },
});
```

### 动态内容

```typescript
const [DynamicModal, modalApi] = useVbenModal({
  title: '动态内容',
  width: 600,
});

const openWithContent = (contentType: string) => {
  let contentComponent;

  switch (contentType) {
    case 'user':
      contentComponent = UserForm;
      break;
    case 'product':
      contentComponent = ProductForm;
      break;
    case 'order':
      contentComponent = OrderForm;
      break;
  }

  modalApi.setState({
    contentComponent,
    title: `${contentType}管理`,
  });
  modalApi.open();
};
```

### 全屏模式

```typescript
const [FullModal, modalApi] = useVbenModal({
  title: '全屏编辑器',
  width: '90vw',
  height: '90vh',
  fullscreen: true,
  draggable: true,
  resizable: true,

  contentComponent: () => (
    <div class="h-full flex flex-col">
      <div class="flex-1">
        <n-input
          type="textarea"
          placeholder="请输入内容..."
          style="height: 100%; width: 100%;"
        />
      </div>
    </div>
  ),
});
```

## 样式定制

### 全局样式

```scss
// 模态框样式
.vben-modal {
  .modal-mask {
    background-color: rgba(0, 0, 0, 0.45);
  }

  .modal-content {
    border-radius: 8px;
    box-shadow: 0 6px 16px 0 rgba(0, 0, 0, 0.08);
  }

  .modal-header {
    border-bottom: 1px solid var(--border);
    padding: 16px 24px;

    .modal-title {
      font-size: 16px;
      font-weight: 600;
    }
  }

  .modal-body {
    padding: 24px;
    max-height: 70vh;
    overflow-y: auto;
  }

  .modal-footer {
    border-top: 1px solid var(--border);
    padding: 16px 24px;
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
}

// 抽屉样式
.vben-drawer {
  .drawer-content {
    border-radius: 0;
  }

  .drawer-header {
    border-bottom: 1px solid var(--border);
    padding: 16px 24px;
  }

  .drawer-body {
    padding: 24px;
  }
}
```

### 响应式配置

```typescript
const [ResponsiveModal, modalApi] = useVbenModal({
  title: '响应式模态框',
  width: computed(() => {
    // 根据屏幕尺寸设置宽度
    const { width } = useWindowSize();
    if (width.value < 768) {
      return '90vw';
    } else if (width.value < 1024) {
      return '80vw';
    } else {
      return 600;
    }
  }),

  // 移动端自动全屏
  fullscreen: computed(() => {
    const { width } = useWindowSize();
    return width.value < 768;
  }),
});
```

## 常见问题

### Q1: 如何处理弹窗内的表单验证失败？

```typescript
const handleConfirm = async () => {
  const formContent = modalApi.getInnerComponent();

  try {
    // 尝试提交表单
    const formData = await formContent?.submit();
    await saveData(formData);
    modalApi.close();
  } catch (error) {
    // 表单验证失败，不关闭弹窗
    console.log('表单验证失败:', error);
    message.error('请检查表单输入');
  }
};
```

### Q2: 如何在弹窗关闭时执行清理操作？

```typescript
const [Modal, modalApi] = useVbenModal({
  title: '带清理的弹窗',
  contentComponent: ModalContent,

  onOpenChange: (isOpen) => {
    if (!isOpen) {
      // 弹窗关闭时的清理操作
      console.log('执行清理操作');
      // 可以在这里取消请求、清除数据等
    }
  },

  destroyOnClose: true, // 关闭时销毁组件
});
```

### Q3: 如何实现弹窗的批量操作？

```typescript
const batchEdit = async (items: any[]) => {
  const [BatchModal, batchApi] = useVbenModal({
    title: `批量编辑 (${items.length}项)`,
    width: 600,
    contentComponent: BatchEditForm,
    onConfirm: async () => {
      const formContent = batchApi.getInnerComponent();
      const formData = await formContent?.submit();

      // 批量更新
      await batchUpdate(
        items.map((item) => item.id),
        formData,
      );

      batchApi.close();
      gridApi.commitProxy('query'); // 刷新表格
    },
  });

  batchApi.setData({ items });
  batchApi.open();
};
```

## 最佳实践

1. **合理使用弹窗**: 避免过度使用弹窗，对于简单操作可考虑其他交互方式
2. **数据传递**: 使用 `setData` 和 `getData` 进行父子组件数据传递
3. **错误处理**: 在确认操作中进行完整的错误处理和用户提示
4. **性能优化**: 对于复杂内容使用 `destroyOnClose`，不使用时及时清理
5. **用户体验**: 提供清晰的操作反馈，使用 loading 状态指示操作进度
6. **可访问性**: 确保弹窗可以通过键盘操作（ESC关闭、Tab切换等）
7. **响应式设计**: 考虑移动端和桌面端的不同显示效果

通过 VbenModal 和 VbenDrawer 系统，可以构建功能强大、用户友好的弹窗交互，满足各种业务场景的需求。
