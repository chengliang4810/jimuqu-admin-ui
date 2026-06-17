<!-- eslint-disable no-use-before-define -->
<script setup lang="ts">
import type { VxeGridInstance, VxeGridListeners } from 'vxe-table';
import type { User } from '@/api';

import { ref, useTemplateRef } from 'vue';

import { userList } from '@/api/system/user';
import { withDefaultVxeGridOptions } from '@/components/vxe-table';
import { useVbenModal, VbenAvatar } from '@/effects/common-ui';
import { Spin } from 'antdv-next';
import { VxeGrid } from 'vxe-table';
import DeptTree from '@/views/system/user/dept-tree.vue';

import UserSelectSearchForm from './user-select-search.vue';

defineOptions({
  name: 'UserSelectModal',
  inheritAttrs: false,
});

const props = withDefaults(
  defineProps<{ allowUserIds?: string; mode?: 'multiple' | 'single' }>(),
  {
    mode: 'multiple',
    /**
     * 允许选择允许选择的人员ID 会当做参数拼接在uselist接口
     */
    allowUserIds: '',
  },
);

const emit = defineEmits<{
  /**
   * 取消的事件
   */
  cancel: [];
  /**
   * 选择完成的事件
   */
  finish: [User[]];
}>();

const [BasicModal, modalApi] = useVbenModal({
  title: '选择人员',
  width: 1060,
  fullscreenButton: false,
  onClosed: () => emit('cancel'),
  onConfirm: handleSubmit,
  async onOpened() {
    const { userList = [] } = modalApi.getData() as { userList: User[] };
    // 暂时只处理多选 目前并没有单选的情况
    if (props.mode === 'multiple') {
      // 左边选中
      await tableRef.value?.setCheckboxRow(userList, true);
      // 右边赋值
      await rightTableRef.value?.loadData(userList);
    }
  },
});

// 左边部门用
const selectDeptId = ref<string[]>([]);

// 缓存最近一次搜索参数，部门树切换时重新查询用
const currentSearchParams = ref<Record<string, any>>({});

const gridOptions = withDefaultVxeGridOptions<User>({
  checkboxConfig: {
    // 翻页时保留选中状态
    reserve: true,
    // 点击行选中
    trigger: 'row',
  },
  radioConfig: {
    trigger: 'row',
    strict: true,
  },
  columns: [
    {
      type: props.mode === 'single' ? 'radio' : 'checkbox',
      width: 60,
      resizable: false,
    },
    {
      field: 'userName',
      title: '用户',
      headerAlign: 'left',
      resizable: false,
      slots: {
        default: 'user',
      },
    },
  ],
  height: 'auto',
  keepSource: true,
  pagerConfig: {
    layouts: ['PrevPage', 'Number', 'NextPage', 'Sizes', 'Total'],
  },
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues = {}) => {
        // 部门树选择处理
        if (selectDeptId.value.length === 1) {
          formValues.deptId = selectDeptId.value[0];
        } else {
          Reflect.deleteProperty(formValues, 'deptId');
        }

        // 加载完毕需要设置选中的行
        if (props.mode === 'multiple') {
          const records = rightTableRef.value?.getData() ?? [];
          await tableRef.value?.setCheckboxRow(records, true);
        }
        if (props.mode === 'single') {
          const records = rightTableRef.value?.getData() ?? [];
          if (records.length === 1) {
            await tableRef.value?.setRadioRow(records[0]);
          }
        }

        const params: any = {
          pageNum: page.currentPage,
          pageSize: page.pageSize,
          ...formValues,
        };
        // 添加参数
        if (props.allowUserIds) {
          params.userIds = props.allowUserIds;
        }

        return await userList(params);
      },
    },
  },
  rowConfig: {
    keyField: 'userId',
  },
  toolbarConfig: {
    enabled: false,
  },
  showOverflow: false,
});

const gridEvents: VxeGridListeners = {
  // 需要控制不同的事件 radio也会触发checkbox事件
  checkboxChange: checkBoxEvent,
  checkboxAll: checkBoxEvent,
  radioChange: radioEvent,
};

const tableRef = useTemplateRef<VxeGridInstance<User>>('tableRef');

function checkBoxEvent() {
  if (props.mode !== 'multiple') {
    return;
  }
  /**
   * 给右边表格赋值
   * records拿到的是当前页的选中数据
   * reserveRecords拿到的是其他页选中的数据
   */
  const records = tableRef.value?.getCheckboxRecords() ?? [];
  const reserveRecords = tableRef.value?.getCheckboxReserveRecords() ?? [];
  const realRecords = [...records, ...reserveRecords];
  rightTableRef.value?.loadData(realRecords);
}

function radioEvent() {
  if (props.mode !== 'single') {
    return;
  }
  // 给右边表格赋值
  const records = tableRef.value?.getRadioRecord();
  rightTableRef.value?.loadData([records]);
}

const rightGridOptions = withDefaultVxeGridOptions<User>({
  checkboxConfig: {},
  columns: [
    {
      field: 'nickName',
      title: '昵称',
      width: 200,
      resizable: false,
      slots: {
        default: 'user',
      },
    },
    {
      field: 'action',
      title: '操作',
      width: 120,
      slots: { default: 'action' },
    },
  ],
  height: 'auto',
  keepSource: true,
  pagerConfig: {
    enabled: false,
  },
  proxyConfig: {
    enabled: false,
  },
  rowConfig: {
    keyField: 'userId',
  },
  toolbarConfig: {
    enabled: false,
  },
  showOverflow: false,
});

const rightTableRef = useTemplateRef<VxeGridInstance<User>>('rightTableRef');

async function handleRemoveItem(row: any) {
  if (props.mode === 'multiple') {
    await tableRef.value?.setCheckboxRow(row, false);
  }
  if (props.mode === 'single') {
    await tableRef.value?.clearRadioRow();
  }
  const data = rightTableRef.value?.getData() ?? [];
  await rightTableRef.value?.loadData(data.filter((item) => item !== row));
  // 这个方法有问题
  // await rightTableRef.value?.remove(row);
}

function handleRemoveAll() {
  if (props.mode === 'multiple') {
    tableRef.value?.clearCheckboxRow();
    tableRef.value?.clearCheckboxReserve();
  }
  if (props.mode === 'single') {
    tableRef.value?.clearRadioRow();
  }
  rightTableRef.value?.loadData([]);
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

async function handleDeptQuery() {
  reload(currentSearchParams.value);
  // 重置后恢复 保存勾选的数据
  const records = rightTableRef.value?.getData() ?? [];
  if (props.mode === 'multiple') {
    tableRef.value?.setCheckboxRow(records, true);
  }
  if (props.mode === 'single' && records.length === 1) {
    tableRef.value?.setRadioRow(records[0]);
  }
}

function handleSubmit() {
  const records = rightTableRef.value?.getData() ?? [];
  console.log(records);
  emit('finish', records);
  modalApi.close();
}

async function reload(params: Record<string, any> = {}) {
  await tableRef.value?.commitProxy('reload', params);
}
</script>

<template>
  <BasicModal>
    <div class="flex min-h-[600px]">
      <DeptTree
        v-model:select-dept-id="selectDeptId"
        :show-search="false"
        class="w-[230px]"
        @reload="() => reload()"
        @select="handleDeptQuery"
      />
      <div class="flex h-[600px] w-[450px] flex-col">
        <UserSelectSearchForm
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
            <template #user="{ row }">
              <div class="flex items-center gap-2">
                <VbenAvatar
                  :alt="row.nickName"
                  :src="row.avatar ?? ''"
                  :class="{ 'bg-primary': !row.avatar }"
                  class="size-[32px] rounded-full text-white"
                />
                <div class="flex flex-col items-baseline text-[12px]">
                  <div>{{ row.nickName }}</div>
                  <div class="opacity-50">
                    {{ row.phoneNumber || '暂无手机号' }}
                  </div>
                </div>
              </div>
            </template>
            <template #loading>
              <Spin :spinning="true" size="large" />
            </template>
          </VxeGrid>
        </div>
      </div>
      <div class="flex h-[600px] flex-col">
        <div class="flex w-full px-4">
          <div class="flex w-full items-center justify-between">
            <div>已选中人员</div>
            <div>
              <a-button size="small" @click="handleRemoveAll">
                清空选中
              </a-button>
            </div>
          </div>
        </div>
        <VxeGrid
          id="user-select-right-table"
          ref="rightTableRef"
          class="p-2 pt-0"
          v-bind="rightGridOptions"
        >
          <template #user="{ row }">
            <div class="flex items-center gap-2 overflow-hidden">
              <VbenAvatar
                :alt="row.nickName"
                :src="row.avatar ?? ''"
                :class="{ 'bg-primary': !row.avatar }"
                class="size-[32px] rounded-full text-white"
              />
              <div class="flex flex-col items-baseline text-[12px]">
                <div class="overflow-ellipsis whitespace-nowrap">
                  {{ row.nickName }}
                </div>
                <div class="opacity-50">
                  {{ row.phoneNumber || '暂无手机号' }}
                </div>
              </div>
            </div>
          </template>
          <template #action="{ row }">
            <a-button size="small" @click="handleRemoveItem(row)">
              移除
            </a-button>
          </template>
        </VxeGrid>
      </div>
    </div>
  </BasicModal>
</template>

<style scoped>
:deep(div.vben-link) {
  display: none;
}

:deep(.vxe-body--row) {
  cursor: pointer;
}
</style>

<style lang="scss">
/**
默认显示右边的滚动条 防止出现滚动条被挤压
*/
#user-select-right-table {
  div.vxe-table--body-wrapper.body--wrapper {
    overflow: scroll;
  }
}
</style>
