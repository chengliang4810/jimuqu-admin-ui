<script setup lang="ts">
import type { Role } from '@/api/system/role/model';
import type { SwitchProps } from 'antdv-next';
import type { VxeGridInstance, VxeGridListeners } from 'vxe-table';

import { computed, ref, useTemplateRef } from 'vue';

import { roleChangeStatus, roleList, roleRemove } from '@/api/system/role';
import { useVbenModal } from '@/components';
import { useAccess } from '@/components/access';
import { ApiSwitch } from '@/components/global';
import {
  resolveQueryFormValues,
  useTableQuery,
  withDefaultVxeGridOptions,
} from '@/components/vxe-table';
import {
  ADMIN_ROLE_KEY,
  EnableStatus,
  SUPERADMIN_ROLE_ID,
  SUPERADMIN_ROLE_KEY,
} from '@/constants';
import { Popconfirm, Space, Spin } from 'antdv-next';
import { VxeGrid } from 'vxe-table';

import { columns } from './data';
import { emitter } from './mitt';
import roleAuthModal from './role-auth-modal.vue';
import roleModal from './role-modal.vue';
import RoleSearchForm from './role-search.vue';

const searchFormRef = ref<InstanceType<typeof RoleSearchForm>>();

const tableLoading = ref(false);

const gridOptions = withDefaultVxeGridOptions<Role>({
  checkboxConfig: {
    // 高亮
    highlight: true,
    // 翻页时保留选中状态
    reserve: true,
    // 点击行选中
    // trigger: 'row',
    checkMethod: ({ row }) => row.roleId !== SUPERADMIN_ROLE_ID,
  },
  columns,
  height: 'auto',
  keepSource: true,
  pagerConfig: {},
  proxyConfig: {
    showLoading: false,
    ajax: {
      query: async ({ page }, formValues) => {
        const values = await resolveQueryFormValues(searchFormRef, formValues);
        tableLoading.value = true;
        try {
          return await roleList({
            pageNum: page.currentPage,
            pageSize: page.pageSize,
            ...values,
          });
        } finally {
          tableLoading.value = false;
        }
      },
    },
  },
  rowConfig: {
    keyField: 'roleId',
    // 高亮当前行
    isCurrent: true,
  },
  toolbarConfig: {
    slots: {
      buttons: 'toolbar-left',
      tools: 'toolbar-right',
    },
  },
  id: 'system-role-index',
  rowClassName: 'hover:cursor-pointer',
});
const lastRoleId = ref('');
const gridEvents: VxeGridListeners = {
  checkboxAll: syncCheckedRows,
  checkboxChange: syncCheckedRows,
  cellClick: (e) => {
    const { row } = e;
    if (row.roleKey === 'superadmin') {
      window.message.error({ content: `该角色组不允许授权用户` });
      return;
    } else if (lastRoleId.value === row.roleId) {
      return;
    }
    emitter.emit('rowClick', row);
    lastRoleId.value = row.roleId;
  },
};

const tableRef = useTemplateRef<VxeGridInstance<Role>>('tableRef');
const { query, reload } = useTableQuery(
  searchFormRef,
  tableRef,
  syncCheckedRows,
);
const checkedRows = ref<Role[]>([]);

const [RoleModal, roleModalApi] = useVbenModal({
  connectedComponent: roleModal,
});

function handleAdd() {
  roleModalApi.setData({});
  roleModalApi.open();
}

async function handleEdit(record: Role) {
  roleModalApi.setData({ id: record.roleId });
  roleModalApi.open();
}

async function handleDelete(row: Role) {
  await roleRemove([row.roleId]);
  // 取消该行选中状态，避免 reserve 记录残留
  tableRef.value?.setCheckboxRow(row, false);
  await query();
}

function handleMultiDelete() {
  const rows = getCheckedRows();
  const ids = rows.map((row: Role) => row.roleId);
  window.modal.confirm({
    title: '提示',
    okType: 'danger',
    content: `确认删除选中的${ids.length}条记录吗？`,
    onOk: async () => {
      await roleRemove(ids);
      // 清除所有选中状态，避免 reserve 记录残留
      tableRef.value?.clearCheckboxRow();
      tableRef.value?.clearCheckboxReserve();
      await query();
    },
  });
}

const { hasAccessByCodes, hasAccessByRoles } = useAccess();

const isSuperAdmin = computed(() => hasAccessByRoles([SUPERADMIN_ROLE_KEY]));

const [RoleAuthModal, authModalApi] = useVbenModal({
  connectedComponent: roleAuthModal,
});

function handleAuthEdit(record: Role) {
  authModalApi.setData({ id: record.roleId });
  authModalApi.open();
}

async function handleChangeStatus(checked: SwitchProps['checked'], row: Role) {
  await roleChangeStatus({
    roleId: row.roleId,
    status: checked ? EnableStatus.Enable : EnableStatus.Disable,
  });
}

function handleSearchSubmit(data: Record<string, any>) {
  reload(data);
}

function handleSearchReset() {
  reload();
}

function getCheckedRows() {
  const table = tableRef.value;
  if (!table) {
    return [];
  }
  return [
    ...table.getCheckboxRecords(),
    ...table.getCheckboxReserveRecords(),
  ] as Role[];
}

function syncCheckedRows() {
  checkedRows.value = getCheckedRows();
}
</script>

<template>
  <Spin
    :styles="{ root: { height: '100%' }, container: { height: '100%' } }"
    :spinning="tableLoading"
    size="large"
    :delay="300"
  >
    <div class="flex h-full flex-col gap-2">
      <RoleSearchForm
        ref="searchFormRef"
        @submit="handleSearchSubmit"
        @reset="handleSearchReset"
      />
      <div class="bg-card flex-1 overflow-hidden rounded-lg">
        <VxeGrid
          ref="tableRef"
          class="p-2 pt-0"
          v-bind="gridOptions"
          v-on="gridEvents"
        >
          <template #toolbar-left>
            <div class="text-[16px] font-medium">角色列表</div>
            <div class="ml-2 text-[13px] text-[#999]">选择角色授权用户</div>
          </template>
          <template #toolbar-right>
            <Space>
              <a-button
                :disabled="checkedRows.length === 0"
                danger
                type="primary"
                v-access:code="['system:role:remove']"
                @click="handleMultiDelete"
              >
                {{ $t('pages.common.delete') }}
              </a-button>
              <a-button
                type="primary"
                v-access:code="['system:role:add']"
                @click="handleAdd"
              >
                {{ $t('pages.common.add') }}
              </a-button>
            </Space>
          </template>
          <template #status="{ row }">
            <ApiSwitch
              :value="row.status === EnableStatus.Enable"
              :api="(checked) => handleChangeStatus(checked, row)"
              :disabled="
                row.roleId === SUPERADMIN_ROLE_ID ||
                row.roleKey === ADMIN_ROLE_KEY ||
                !hasAccessByCodes(['system:role:edit'])
              "
              @reload="() => query()"
            />
          </template>
          <template #action="{ row }">
            <!-- 租户管理员不可修改admin角色 防止误操作 -->
            <!-- 超级管理员可通过租户切换来操作租户管理员角色 -->
            <template
              v-if="
                !row.superAdmin &&
                (row.roleKey !== ADMIN_ROLE_KEY || isSuperAdmin)
              "
            >
              <Space>
                <action-button
                  v-access:code="['system:role:edit']"
                  @click.stop="handleEdit(row)"
                >
                  {{ $t('pages.common.edit') }}
                </action-button>
                <action-button
                  v-access:code="['system:role:edit']"
                  @click.stop="handleAuthEdit(row)"
                >
                  权限
                </action-button>
                <Popconfirm
                  placement="left"
                  title="确认删除？"
                  @confirm="handleDelete(row)"
                >
                  <action-button
                    danger
                    v-access:code="['system:role:remove']"
                    @click.stop=""
                  >
                    {{ $t('pages.common.delete') }}
                  </action-button>
                </Popconfirm>
              </Space>
            </template>
          </template>
          <template #loading>
            <Spin :spinning="true" size="large" />
          </template>
        </VxeGrid>
      </div>
    </div>
    <RoleModal @reload="() => query()" />
    <RoleAuthModal @reload="() => query()" />
  </Spin>
</template>
