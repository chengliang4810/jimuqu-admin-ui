<script setup lang="ts">
import { computed, h, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { NButton, NCheckbox, NSpace, NTag, NTree, useMessage } from 'naive-ui';

import { requestClient } from '#/api/request';

// 菜单树节点类型
interface MenuTreeNode {
  id: string;
  key: string;
  label: string;
  children?: MenuTreeNode[];
  icon?: string;
  menuType: string; // M:目录 C:菜单 F:按钮
  perms?: string;
  selector?: number;
  parentId: string;
  isLeaf?: boolean;
}

// 权限按钮类型
interface PermissionButton {
  id: string;
  label: string;
  perms: string;
  checked: boolean;
}

// 扩展菜单节点，包含权限按钮
interface MenuWithPermissions extends MenuTreeNode {
  permissions?: PermissionButton[];
}

// 角色信息类型
interface RoleInfo {
  id?: string;
  roleId?: string;
  roleName: string;
  roleKey: string;
}

const emit = defineEmits<{ reload: [] }>();

const message = useMessage();

// 角色菜单权限管理弹窗
const [FormModel, formModelApi] = useVbenModal({
  fullscreen: false,
  draggable: true,
  class: 'role-menu-permission-modal',
  onConfirm: handleConfirm,
  async onOpenChange(isOpen: boolean) {
    if (isOpen) {
      const { row } = formModelApi.getData<{ row: RoleInfo }>();
      const roleId = row.id || row.roleId;
      if (roleId) {
        await loadRoleMenuPermissions(roleId);
      }
    }
  },
});

// 菜单树数据
const menuTreeData = ref<MenuWithPermissions[]>([]);
// 选中的菜单keys
const checkedKeys = ref<string[]>([]);
// 当前角色ID
const currentRoleId = ref<string>('');
// 展开的keys
const expandedKeys = ref<string[]>([]);

// 计算标题
const title = computed(() => {
  const { row } = formModelApi.getData<{ row: RoleInfo }>();
  return row?.roleName ? `分配菜单权限 - ${row.roleName}` : '分配菜单权限';
});

// 树形数据转换
function transformMenuData(menus: MenuTreeNode[]): MenuWithPermissions[] {
  return menus.map((item) => {
    const node: MenuWithPermissions = {
      ...item,
      permissions: [],
    };

    if (item.children && item.children.length > 0) {
      // 分离权限按钮(F类型)和其他子节点
      const permissions = item.children.filter(
        (child) => child.menuType === 'F',
      );
      const otherChildren = item.children.filter(
        (child) => child.menuType !== 'F',
      );

      // 只有菜单类型(C)才显示权限按钮
      if (item.menuType === 'C') {
        node.permissions = permissions.map((p) => ({
          id: p.id,
          label: p.label,
          perms: p.perms || '',
          checked: false,
        }));
      }

      // 递归处理其他子节点
      if (otherChildren.length > 0) {
        node.children = transformMenuData(otherChildren);
      }
    }

    return node;
  });
}

// 加载角色菜单权限
async function loadRoleMenuPermissions(roleId: string) {
  try {
    currentRoleId.value = roleId;
    message.loading('加载菜单权限中...');

    // 1. 加载所有菜单树数据
    const response = await requestClient.get<any>('/system/menu/treeselect');
    let menuData: MenuTreeNode[] = [];

    // 处理不同的响应格式
    if (response.data && Array.isArray(response.data)) {
      menuData = response.data;
    } else if (
      response.data &&
      response.data.data &&
      Array.isArray(response.data.data)
    ) {
      menuData = response.data.data;
    } else if (Array.isArray(response)) {
      menuData = response;
    }

    if (menuData.length === 0) {
      message.warning('菜单数据为空');
      return;
    }

    // 转换菜单数据
    menuTreeData.value = transformMenuData(menuData);

    // 2. 获取角色已有菜单权限
    try {
      const roleMenuResponse = await requestClient.get<any>(
        `/system/menu/roleMenuTreeSelect/${roleId}`,
      );
      const roleMenuData = roleMenuResponse.data || roleMenuResponse;
      checkedKeys.value =
        roleMenuData.checkedKeys || roleMenuData.menuIds || [];
    } catch (error) {
      console.warn('获取角色菜单权限失败，使用默认空数组:', error);
      checkedKeys.value = [];
    }

    // 3. 默认展开所有节点
    expandedKeys.value = getAllKeys(menuTreeData.value);

    message.destroyAll();
  } catch (error) {
    message.destroyAll();
    console.error('加载角色菜单权限失败:', error);
    message.error('加载角色菜单权限失败');
  }
}

// 获取所有节点的key
function getAllKeys(nodes: MenuWithPermissions[]): string[] {
  const keys: string[] = [];

  function collectKeys(items: MenuWithPermissions[]) {
    items.forEach((item) => {
      if (item.menuType !== 'F') {
        // 只收集目录和菜单
        keys.push(item.id);
      }
      if (item.children && item.children.length > 0) {
        collectKeys(item.children);
      }
    });
  }

  collectKeys(nodes);
  return keys;
}


// 权限按钮变化
function handlePermissionChange(
  node: MenuWithPermissions,
  permissionId: string,
  checked: boolean,
) {
  if (!node.permissions) return;

  const permission = node.permissions.find((p) => p.id === permissionId);
  if (permission) {
    permission.checked = checked;

    // 如果选中了权限按钮，也要选中对应的菜单节点
    if (checked && !checkedKeys.value.includes(node.id)) {
      checkedKeys.value = [...checkedKeys.value, node.id];
    }
  }
}

// 获取所有选中的ID（包括菜单ID和权限ID）
function getAllSelectedIds(): string[] {
  const allIds: string[] = [...checkedKeys.value];

  // 添加选中的权限ID
  function collectPermissionIds(nodes: MenuWithPermissions[]) {
    nodes.forEach((node) => {
      if (node.permissions) {
        node.permissions.forEach((permission) => {
          if (permission.checked && !allIds.includes(permission.id)) {
            allIds.push(permission.id);
          }
        });
      }
      if (node.children && node.children.length > 0) {
        collectPermissionIds(node.children);
      }
    });
  }

  collectPermissionIds(menuTreeData.value);
  return allIds;
}

// 全选/取消全选
function handleSelectAll(selectAll: boolean) {
  if (selectAll) {
    checkedKeys.value = getAllKeys(menuTreeData.value);
    // 选中所有权限按钮
    function selectAllPermissions(nodes: MenuWithPermissions[]) {
      nodes.forEach((node) => {
        if (node.permissions) {
          node.permissions.forEach((permission) => {
            permission.checked = true;
          });
        }
        if (node.children && node.children.length > 0) {
          selectAllPermissions(node.children);
        }
      });
    }
    selectAllPermissions(menuTreeData.value);
  } else {
    checkedKeys.value = [];
    // 取消所有权限按钮
    function unselectAllPermissions(nodes: MenuWithPermissions[]) {
      nodes.forEach((node) => {
        if (node.permissions) {
          node.permissions.forEach((permission) => {
            permission.checked = false;
          });
        }
        if (node.children && node.children.length > 0) {
          unselectAllPermissions(node.children);
        }
      });
    }
    unselectAllPermissions(menuTreeData.value);
  }
}

// 提交表单
async function handleConfirm() {
  const loading = message.loading('正在保存菜单权限...');
  try {
    // 锁定表单弹窗禁止操作
    formModelApi.lock();

    const selectedIds = getAllSelectedIds();

    if (selectedIds.length === 0) {
      message.warning('请选择至少一个菜单权限');
      return;
    }

    // 提交菜单权限数据
    await requestClient.post('/system/role/authMenu', {
      roleId: currentRoleId.value,
      menuIds: selectedIds,
    });

    // 提示成功
    message.success('菜单权限分配成功');

    // 刷新表格
    emit('reload');
    // 关闭表单弹窗
    formModelApi.close();
  } catch (error) {
    console.error('保存菜单权限失败:', error);
    message.error('保存菜单权限失败');
  } finally {
    // 解锁表单弹窗
    formModelApi.lock(false);
    loading.destroy();
  }
}

// 获取菜单类型标签
function getMenuTypeTag(menuType: string) {
  const typeMap = {
    M: { label: '目录', type: 'default' },
    C: { label: '菜单', type: 'info' },
    F: { label: '按钮', type: 'success' },
  };
  return (
    typeMap[menuType as keyof typeof typeMap] || {
      label: '未知',
      type: 'default',
    }
  );
}

// 自定义树节点渲染
function renderPrefix({ option }: { option: MenuWithPermissions }) {
  const typeInfo = getMenuTypeTag(option.menuType);
  return h(
    NTag,
    { type: typeInfo.type as any, size: 'small' },
    () => typeInfo.label,
  );
}

// 自定义树节点内容渲染
function renderLabel({ option }: { option: MenuWithPermissions }) {
  return h('div', { class: 'flex items-center justify-between w-full' }, [
    h('span', option.label),
    // 如果有权限按钮，显示权限选择区域
    option.permissions &&
      option.permissions.length > 0 &&
      h(
        'div',
        { class: 'ml-4' },
        option.permissions.map((permission) =>
          h(
            NCheckbox,
            {
              key: permission.id,
              checked: permission.checked,
              onUpdateChecked: (checked: boolean) =>
                handlePermissionChange(option, permission.id, checked),
              class: 'ml-2',
            },
            () => permission.label,
          ),
        ),
      ),
  ]);
}
</script>

<template>
  <FormModel
    :title="title"
    class="role-menu-permission-modal"
    style="width: 800px"
  >
    <div class="flex h-full flex-col" style="height: 600px">
      <!-- 工具栏 -->
      <div class="mb-4 flex items-center justify-between border-b pb-4">
        <div class="flex items-center gap-4">
          <NSpace>
            <NButton size="small" @click="handleSelectAll(true)">
              全选
            </NButton>
            <NButton size="small" @click="handleSelectAll(false)">
              取消全选
            </NButton>
          </NSpace>
        </div>

        <div class="text-sm text-gray-600">
          已选中：<span class="font-bold text-blue-600">{{
            checkedKeys.length
          }}</span>
          项
        </div>
      </div>

      <!-- 菜单权限树 -->
      <div class="flex-1 overflow-auto">
        <NTree
          v-model:checked-keys="checkedKeys"
          v-model:expanded-keys="expandedKeys"
          :data="menuTreeData"
          :checkable="true"
          :cascade="true"
          :render-label="renderLabel"
          :render-prefix="renderPrefix"
          key-field="id"
          label-field="label"
          children-field="children"
          class="menu-permission-tree"
        />
      </div>

      <div class="mt-4 border-t pt-4 text-sm text-gray-500">
        提示： 1. 选择菜单权限后，点击确定保存 2.
        权限按钮需要先选中对应的菜单才能生效 3. 更改后需要用户重新登录才能生效
      </div>
    </div>
  </FormModel>
</template>

<style scoped>
.role-menu-permission-modal {
  --n-font-size: 14px;
}

.menu-permission-tree :deep(.n-tree-node-content) {
  padding: 4px 8px;
}

.menu-permission-tree :deep(.n-tree-node-content:hover) {
  background-color: var(--n-hover-color);
}

.menu-permission-tree :deep(.n-tree-node-checkbox) {
  margin-right: 8px;
}

.menu-permission-tree :deep(.n-tree-node-switcher) {
  margin-right: 4px;
}

.menu-permission-tree :deep(.n-tree-node-content-wrapper) {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: space-between;
}

.menu-permission-tree :deep(.n-checkbox) {
  margin-left: 8px;
  font-size: 12px;
}

.menu-permission-tree :deep(.n-checkbox__label) {
  font-size: 12px;
  color: var(--n-text-color-2);
}
</style>
