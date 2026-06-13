<script setup lang="ts">
import type { MenuOption } from '@/api/system/menu/model';
import type { DeptOption } from '@/api/system/role/model';

import { nextTick, ref } from 'vue';

import { useVbenModal } from '@/effects/common-ui';
import { $t } from '@/locales';
import { cloneDeep, eachTree, findGroupParentIds } from '@/utils';

import { Descriptions, DescriptionsItem, Segmented, Select } from 'antdv-next';
import { uniq } from 'lodash-es';

import { roleMenuTreeSelect } from '@/api/system/menu';
import { roleDeptTree, roleInfo, roleSetPermissions } from '@/api/system/role';
import { MenuSelectTable, TreeSelectPanel } from '@/components/tree';

import { authScopeOptions } from './data';

const emit = defineEmits<{ reload: [] }>();

const activeTab = ref<string>('menu');
const tabOptions = [
  { label: '菜单权限', value: 'menu' },
  { label: '数据权限', value: 'data' },
];

interface RolePermissionData {
  roleId?: number | string;
  roleKey?: string;
  roleName?: string;
  // 菜单权限
  menuCheckStrictly: boolean;
  // 数据权限
  dataScope?: string;
  deptCheckStrictly: boolean;
  deptIds: (number | string)[];
}

const formData = ref<RolePermissionData>({
  menuCheckStrictly: true,
  deptCheckStrictly: true,
  deptIds: [],
});

// 菜单权限
const menuTree = ref<MenuOption[]>([]);
const menuCheckedKeys = ref<(number | string)[]>([]);
const menuSelectRef = ref<InstanceType<typeof MenuSelectTable>>();

// 数据权限
let deptTreeData: DeptOption[] = [];
const deptTree = ref<DeptOption[]>([]);

const [BasicModal, modalApi] = useVbenModal({
  width: 800,
  fullscreenButton: true,
  onConfirm: handleConfirm,
  onClosed: handleClosed,
  onOpenChange: async (isOpen) => {
    if (!isOpen) {
      return null;
    }
    modalApi.modalLoading(true);
    activeTab.value = 'menu';

    const { id } = modalApi.getData() as { id: number | string };

    const [record, menuResp, deptResp] = await Promise.all([
      roleInfo(id),
      roleMenuTreeSelect(id),
      roleDeptTree(id),
    ]);

    formData.value = {
      roleId: record.roleId,
      roleName: record.roleName,
      roleKey: record.roleKey,
      menuCheckStrictly: record.menuCheckStrictly,
      dataScope: record.dataScope,
      deptCheckStrictly: record.deptCheckStrictly,
      deptIds: deptResp.checkedKeys,
    };

    // 菜单树
    eachTree(menuResp.menus, (node) => {
      node.label = $t(node.label);
    });
    menuTree.value = menuResp.menus;
    await nextTick();
    menuCheckedKeys.value = menuResp.checkedKeys;

    // 部门树
    deptTreeData = deptResp.depts;
    deptTree.value = deptResp.depts;

    modalApi.modalLoading(false);
  },
});

async function handleConfirm() {
  try {
    modalApi.lock(true);

    const data = cloneDeep(formData.value);

    // 收集菜单权限
    const menuIds = menuSelectRef.value?.getCheckedKeys?.() ?? [];
    (data as any).menuIds = menuIds;

    // 处理数据权限
    if (data.dataScope === '2') {
      let { deptIds, deptCheckStrictly } = data;
      if (deptCheckStrictly) {
        const parentIds = findGroupParentIds(
          deptTreeData,
          deptIds as number[],
          { id: 'id' },
        );
        deptIds = uniq([...parentIds, ...deptIds]);
      }
      data.deptIds = deptIds;
    } else {
      data.deptIds = [];
    }

    await roleSetPermissions(data);
    emit('reload');
    modalApi.close();
  } catch (error) {
    console.error(error);
  } finally {
    modalApi.lock(false);
  }
}

function handleClosed() {
  formData.value = {
    menuCheckStrictly: true,
    deptCheckStrictly: true,
    deptIds: [],
  };
  menuTree.value = [];
  menuCheckedKeys.value = [];
  deptTree.value = [];
  deptTreeData = [];
}

function handleMenuCheckStrictlyChange(value: boolean) {
  formData.value.menuCheckStrictly = value;
}
</script>

<template>
  <BasicModal title="分配权限">
    <div class="flex flex-col gap-4">
      <!-- 角色信息 -->
      <Descriptions :column="1" size="small" bordered>
        <DescriptionsItem label="角色名称">
          {{ formData.roleName }}
        </DescriptionsItem>
        <DescriptionsItem label="权限标识">
          {{ formData.roleKey }}
        </DescriptionsItem>
      </Descriptions>

      <!-- 分段器 -->
      <Segmented v-model:value="activeTab" :options="tabOptions" block />

      <!-- 菜单权限 -->
      <div v-show="activeTab === 'menu'" class="h-[500px]">
        <MenuSelectTable
          ref="menuSelectRef"
          :checked-keys="menuCheckedKeys"
          :association="formData.menuCheckStrictly"
          :menus="menuTree"
          @update:association="handleMenuCheckStrictlyChange"
        />
      </div>

      <!-- 数据权限 -->
      <div v-show="activeTab === 'data'" class="flex flex-col gap-4">
        <div>
          <div class="mb-1 text-sm">
            权限范围
            <span class="ml-1 text-xs opacity-50">
              更改后需要用户重新登录才能生效
            </span>
          </div>
          <Select
            v-model:value="formData.dataScope"
            :options="authScopeOptions"
            class="w-full"
          />
        </div>
        <div v-if="formData.dataScope === '2'">
          <div class="mb-1 text-sm">
            部门权限
            <span class="ml-1 text-xs opacity-50"> 更改后立即生效 </span>
          </div>
          <TreeSelectPanel
            v-model:value="formData.deptIds"
            v-model:check-strictly="formData.deptCheckStrictly"
            :expand-all-on-init="true"
            :tree-data="deptTree"
          />
        </div>
      </div>
    </div>
  </BasicModal>
</template>
