<script setup lang="ts">
import type { User } from '@/api/system/user/model';
import type { MenuProps, SwitchProps } from 'antdv-next';
import type { VxeGridInstance, VxeGridListeners } from 'vxe-table';

import { computed, ref, useTemplateRef } from 'vue';

import {
  userExport,
  userList,
  userRemove,
  userStatusChange,
} from '@/api/system/user';
import { Page, useVbenModal } from '@/components';
import { useAccess } from '@/components/access';
import ApiSwitch from '@/components/global/api-switch.vue';
import {
  useTableQuery,
  withDefaultVxeGridOptions,
} from '@/components/vxe-table';
import { EnableStatus, SUPERADMIN_USER_ID } from '@/constants';
import { $t } from '@/locales';
import { useUserStore } from '@/stores';
import { useBlobExport } from '@/utils/file/export';
import { Dropdown, Popconfirm, Space, Spin } from 'antdv-next';
import { VxeGrid } from 'vxe-table';

import { columns } from './data';
import DeptTree from './dept-tree.vue';
import userImportModal from './user-import-modal.vue';
import userInfoModal from './user-info-modal.vue';
import userModal from './user-modal.vue';
import userResetPwdModal from './user-reset-pwd-modal.vue';
import UserSearchForm from './user-search.vue';

/**
 * 导入
 */
const [UserImpotModal, userImportModalApi] = useVbenModal({
  connectedComponent: userImportModal,
});

const userStore = useUserStore();

function handleImport() {
  userImportModalApi.open();
}

// 左边部门用
const selectDeptId = ref<string[]>([]);

const searchFormRef = ref<InstanceType<typeof UserSearchForm>>();
// 缓存最近一次搜索参数，部门树切换时重新查询用
const currentSearchParams = ref<Record<string, any>>({});

const gridOptions = withDefaultVxeGridOptions<User>({
  checkboxConfig: {
    // 高亮
    highlight: true,
    // 翻页时保留选中状态
    reserve: true,
    // 点击行选中
    trigger: 'default',
    checkMethod: ({ row }) =>
      row.userId !== SUPERADMIN_USER_ID &&
      row.userId !== userStore.userInfo?.userId,
  },
  columns,
  height: 'auto',
  keepSource: true,
  pagerConfig: {},
  proxyConfig: {
    showLoading: false,
    ajax: {
      query: async ({ page }, formValues = {}) => {
        tableLoading.value = true;
        try {
          // 部门树选择处理
          if (selectDeptId.value.length === 1) {
            formValues.deptId = selectDeptId.value[0];
          } else {
            Reflect.deleteProperty(formValues, 'deptId');
          }

          return await userList({
            pageNum: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        } finally {
          tableLoading.value = false;
        }
      },
    },
  },
  headerCellConfig: {
    height: 44,
  },
  cellConfig: {
    height: 48,
  },
  rowConfig: {
    keyField: 'userId',
  },
  toolbarConfig: {
    slots: {
      buttons: 'toolbar-left',
      tools: 'toolbar-right',
    },
  },
  id: 'system-user-index',
});

const gridEvents: VxeGridListeners = {
  checkboxAll: syncCheckedRows,
  checkboxChange: syncCheckedRows,
};

const tableRef = useTemplateRef<VxeGridInstance<User>>('tableRef');
const { query, reload } = useTableQuery(
  searchFormRef,
  tableRef,
  syncCheckedRows,
);
const checkedRows = ref<User[]>([]);
const tableLoading = ref(false);

const [UserDrawer, userModalApi] = useVbenModal({
  connectedComponent: userModal,
});

function handleAdd() {
  userModalApi.setData({});
  userModalApi.open();
}

function handleEdit(row: User) {
  userModalApi.setData({ id: row.userId });
  userModalApi.open();
}

async function handleDelete(row: User) {
  await userRemove([row.userId]);
  // 取消该行选中状态，避免 reserve 记录残留
  tableRef.value?.setCheckboxRow(row, false);
  await query();
}

function handleMultiDelete() {
  const rows = getCheckedRows();
  const ids = rows.map((row: User) => row.userId);
  window.modal.confirm({
    title: '提示',
    okType: 'danger',
    content: `确认删除选中的${ids.length}条记录吗？`,
    onOk: async () => {
      await userRemove(ids);
      // 清除所有选中状态，避免 reserve 记录残留
      tableRef.value?.clearCheckboxRow();
      tableRef.value?.clearCheckboxReserve();
      await query();
    },
  });
}

const { exportBlob, exportLoading, buildExportFileName } =
  useBlobExport(userExport);
async function handleExport() {
  // 构建表单请求参数
  const formValues = (await searchFormRef.value?.getValues()) ?? {};
  // 部门树选择
  if (selectDeptId.value.length === 1) {
    formValues.deptId = selectDeptId.value[0];
  }
  // 文件名
  const fileName = buildExportFileName('用户信息');
  exportBlob({ data: formValues, fileName });
}

const [UserInfoModal, userInfoModalApi] = useVbenModal({
  connectedComponent: userInfoModal,
});
function handleUserInfo(row: User) {
  userInfoModalApi.setData({ userId: row.userId });
  userInfoModalApi.open();
}

const [UserResetPwdModal, userResetPwdModalApi] = useVbenModal({
  connectedComponent: userResetPwdModal,
});

function handleResetPwd(record: User) {
  userResetPwdModalApi.setData({ record });
  userResetPwdModalApi.open();
}

const { hasAccessByCodes } = useAccess();
const menuItems = computed(() => {
  const items: MenuProps['items'] = [{ key: 'info', label: '用户信息' }];
  if (hasAccessByCodes(['system:user:resetPwd'])) {
    items.push({ key: 'resetPwd', label: '重置密码' });
  }
  return items;
});

function handleMenuClick(key: string, row: any) {
  switch (key) {
    case 'info': {
      handleUserInfo(row);
      break;
    }
    case 'resetPwd': {
      handleResetPwd(row);
      break;
    }
  }
}

async function handleChangeStatus(checked: SwitchProps['checked'], row: User) {
  await userStatusChange({
    userId: row.userId,
    status: checked ? EnableStatus.Enable : EnableStatus.Disable,
  });
}

function handleSearchSubmit(data: Record<string, any>) {
  currentSearchParams.value = data;
  reload(data);
}

function handleSearchReset() {
  currentSearchParams.value = {};
  selectDeptId.value = [];
  reload();
}

function handleDeptSelect(keys: string[]) {
  selectDeptId.value = keys;
  reload(currentSearchParams.value);
}

function handleDeptReload() {
  selectDeptId.value = [];
  searchFormRef.value?.resetFields();
  currentSearchParams.value = {};
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
  ] as User[];
}

function syncCheckedRows() {
  checkedRows.value = getCheckedRows();
}
</script>

<template>
  <Page :auto-content-height="true">
    <Spin
      :styles="{ root: { height: '100%' }, container: { height: '100%' } }"
      :spinning="tableLoading"
      size="large"
      :delay="300"
    >
      <div class="flex h-full gap-2">
        <DeptTree
          v-model:select-dept-id="selectDeptId"
          class="w-[260px]"
          @reload="handleDeptReload"
          @select="handleDeptSelect"
        />
        <div class="flex flex-1 flex-col gap-2 overflow-hidden">
          <UserSearchForm
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
                <div class="text-[16px] font-medium">用户列表</div>
              </template>
              <template #toolbar-right>
                <Space>
                  <a-button
                    v-access:code="['system:user:export']"
                    :loading="exportLoading"
                    :disabled="exportLoading"
                    @click="handleExport"
                  >
                    {{ $t('pages.common.export') }}
                  </a-button>
                  <a-button
                    v-access:code="['system:user:import']"
                    @click="handleImport"
                  >
                    {{ $t('pages.common.import') }}
                  </a-button>
                  <a-button
                    v-access:code="['system:user:remove']"
                    :disabled="checkedRows.length === 0"
                    danger
                    type="primary"
                    @click="handleMultiDelete"
                  >
                    {{ $t('pages.common.delete') }}
                  </a-button>
                  <a-button
                    v-access:code="['system:user:add']"
                    type="primary"
                    @click="handleAdd"
                  >
                    {{ $t('pages.common.add') }}
                  </a-button>
                </Space>
              </template>
              <template #status="{ row }">
                <!-- value只能接收boolean值 -->
                <ApiSwitch
                  :value="row.status === EnableStatus.Enable"
                  :api="(checked) => handleChangeStatus(checked, row)"
                  :disabled="
                    row.userId === userStore.userInfo?.userId ||
                    row.userId === SUPERADMIN_USER_ID ||
                    !hasAccessByCodes(['system:user:edit'])
                  "
                  @reload="() => query()"
                />
              </template>
              <template #action="{ row }">
                <template
                  v-if="
                    row.userId !== SUPERADMIN_USER_ID &&
                    row.userId !== userStore.userInfo?.userId
                  "
                >
                  <Space>
                    <action-button
                      v-access:code="['system:user:edit']"
                      @click.stop="handleEdit(row)"
                    >
                      {{ $t('pages.common.edit') }}
                    </action-button>
                    <Popconfirm
                      placement="left"
                      title="确认删除？"
                      @confirm="handleDelete(row)"
                    >
                      <action-button
                        v-access:code="['system:user:remove']"
                        danger
                        @click.stop=""
                      >
                        {{ $t('pages.common.delete') }}
                      </action-button>
                    </Popconfirm>
                  </Space>
                  <Dropdown
                    placement="bottomRight"
                    :menu="{
                      items: menuItems,
                      onClick: (info) => handleMenuClick(info.key, row),
                    }"
                  >
                    <a-button size="small" type="link">
                      {{ $t('pages.common.more') }}
                    </a-button>
                  </Dropdown>
                </template>
              </template>
              <template #loading>
                <Spin :spinning="true" size="large" />
              </template>
            </VxeGrid>
          </div>
        </div>
      </div>
    </Spin>
    <UserImpotModal @reload="() => query()" />
    <UserDrawer @reload="() => query()" />
    <UserInfoModal />
    <UserResetPwdModal />
  </Page>
</template>
