<script setup lang="ts">
import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { NCheckbox, NTree, useMessage } from 'naive-ui';

import { requestClient } from '#/api/request';

const emit = defineEmits<{ reload: [] }>();

const message = useMessage();

// 菜单数据类型
interface MenuTreeNode {
  key: string;
  label: string;
  children?: MenuTreeNode[];
  isLeaf?: boolean;
  icon?: string;
  menuType?: string;
  perms?: string;
}

// 角色信息类型
interface RoleInfo {
  id?: string;
  roleId?: string;
  roleName: string;
  roleKey: string;
}

// 角色菜单权限管理弹窗
const [FormModel, formModelApi] = useVbenModal({
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
const menuTreeData = ref<MenuTreeNode[]>([]);
// 已选中的菜单keys
const checkedKeys = ref<string[]>([]);
// 半选中的菜单keys
const indeterminateKeys = ref<string[]>([]);
// 当前角色ID
const currentRoleId = ref<string>('');

// 加载角色菜单权限
async function loadRoleMenuPermissions(roleId: string) {
  try {
    currentRoleId.value = roleId;

    // 获取所有菜单树数据
    const menuList = await requestClient.get<any>('/system/menu/treeselect');

    // 获取角色已有菜单权限
    const roleMenuData = await requestClient.get<any>(
      `/system/menu/roleMenuTreeSelect/${roleId}`,
    );

    // 转换菜单数据为树形结构
    menuTreeData.value = convertToTreeData(menuList);

    // 设置已选中的菜单keys
    checkedKeys.value = roleMenuData.checkedKeys || [];
  } catch (error) {
    console.error('加载角色菜单权限失败:', error);
    message.error('加载角色菜单权限失败');
  }
}

// 转换菜单数据为树形结构
function convertToTreeData(menuList: any[]): MenuTreeNode[] {
  // 如果已经是树形结构，直接转换
  if (menuList.length > 0 && menuList[0].children !== undefined) {
    return convertMapTreeToMenuTreeNode(menuList);
  }

  // 构建菜单树映射
  const menuMap = new Map<string, MenuTreeNode>();
  const rootMenus: MenuTreeNode[] = [];

  // 先创建所有节点
  menuList.forEach((menu) => {
    const node: MenuTreeNode = {
      key: menu.id,
      label: menu.name || menu.menuName,
      children: [],
      isLeaf: menu.menuType === 'F', // 按钮类型为叶子节点
      icon: menu.icon,
      menuType: menu.menuType,
      perms: menu.perms,
    };
    menuMap.set(menu.id, node);
  });

  // 构建树形结构
  menuList.forEach((menu) => {
    const node = menuMap.get(menu.id);
    if (!node) return;

    if (menu.parentId === '0' || !menu.parentId) {
      // 根节点
      rootMenus.push(node);
    } else {
      // 子节点
      const parent = menuMap.get(menu.parentId);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(node);
      }
    }
  });

  return rootMenus;
}

// 转换MapTree结构为MenuTreeNode
function convertMapTreeToMenuTreeNode(mapTreeList: any[]): MenuTreeNode[] {
  return mapTreeList.map((item) => {
    const node: MenuTreeNode = {
      key: item.id,
      label: item.label || item.name || item.menuName,
      children: item.children
        ? convertMapTreeToMenuTreeNode(item.children)
        : [],
      isLeaf: !item.children || item.children.length === 0,
      icon: item.icon,
      menuType: item.menuType,
      perms: item.perms,
    };
    return node;
  });
}

// 提交表单
async function handleConfirm() {
  const loading = message.loading(`正在保存权限...`);
  try {
    // 锁定表单弹窗禁止操作
    formModelApi.lock();

    // 提交菜单权限数据
    await requestClient.post('/system/role/authMenu', {
      roleId: currentRoleId.value,
      menuIds: checkedKeys.value,
    });

    // 提示成功
    message.success(`菜单权限更新成功`);

    // 刷新表格
    emit('reload');
    // 关闭表单弹窗
    formModelApi.close();
  } catch (error) {
    console.error(error);
    message.error('保存菜单权限失败');
  } finally {
    // 解锁表单弹窗
    formModelApi.lock(false);
    loading.destroy();
  }
}

// 全选/取消全选
function handleSelectAll(checked: boolean) {
  if (checked) {
    // 获取所有菜单ID
    const allMenuIds: string[] = [];
    const collectIds = (nodes: MenuTreeNode[]) => {
      nodes.forEach((node) => {
        allMenuIds.push(node.key);
        if (node.children && node.children.length > 0) {
          collectIds(node.children);
        }
      });
    };
    collectIds(menuTreeData.value);
    checkedKeys.value = allMenuIds;
  } else {
    checkedKeys.value = [];
  }
}
</script>

<template>
  <FormModel title="分配菜单权限" width="600px">
    <div class="flex h-full flex-col">
      <div class="mb-4">
        <NCheckbox @update:checked="handleSelectAll"> 全选/取消全选 </NCheckbox>
      </div>

      <div class="flex-1 overflow-auto">
        <NTree
          v-model:checked-keys="checkedKeys"
          :data="menuTreeData"
          :indeterminate-keys="indeterminateKeys"
          :checkable="true"
          :cascade="true"
          :show-irrelevant-nodes="false"
          key-field="key"
          label-field="label"
          children-field="children"
        />
      </div>

      <div class="mt-4 text-sm text-gray-500">
        提示：选择菜单权限后，点击确定保存。更改后需要用户重新登录才能生效。
      </div>
    </div>
  </FormModel>
</template>
