<script setup lang="ts">
import type { PageQuery } from '@/api/common';
import type { OssFile } from '@/api/system/oss/model';
import type { VxeGridInstance, VxeGridListeners } from 'vxe-table';

import { onMounted, ref, useTemplateRef } from 'vue';
import { useRouter } from 'vue-router';

import { configInfoByKey } from '@/api/system/config';
import { checkLoginBeforeDownload, ossList, ossRemove } from '@/api/system/oss';
import {
  addSortParams,
  useTableQuery,
  withDefaultVxeGridOptions,
} from '@/components/vxe-table';
import { Page, useVbenModal } from '@/components';
import { useAppConfig } from '@/effects/hooks';
import { $t } from '@/locales';
import { useAccessStore } from '@/stores';
import { downloadByUrl } from '@/utils/file/download';
import { Image, Popconfirm, Space, Spin, Switch, Tooltip } from 'antdv-next';
import { stringify } from 'qs';
import { VxeGrid } from 'vxe-table';

import { supportImageList } from './constant';
import { columns } from './data';
import fallbackImageBase64 from './fallback-image.txt?raw';
import fileUploadModal from './file-upload-modal.vue';
import imageUploadModal from './image-upload-modal.vue';
import OssSearchForm from './oss-search.vue';

const searchFormRef = ref<InstanceType<typeof OssSearchForm>>();

const tableLoading = ref(false);

const gridOptions = withDefaultVxeGridOptions<OssFile>({
  checkboxConfig: {
    // 高亮
    highlight: true,
    // 翻页时保留选中状态
    reserve: true,
    // 点击行选中
    // trigger: 'row',
  },
  columns,
  height: 'auto',
  keepSource: true,
  pagerConfig: {},
  proxyConfig: {
    showLoading: false,
    ajax: {
      query: async ({ page, sorts }, formValues = {}) => {
        tableLoading.value = true;
        try {
          const params: PageQuery = {
            pageNum: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          };
          // 添加排序参数
          addSortParams(params, sorts);
          return await ossList(params);
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
    height: 65,
  },
  rowConfig: {
    keyField: 'ossId',
  },
  sortConfig: {
    // 远程排序
    remote: true,
    // 支持多字段排序 默认关闭
    multiple: false,
  },
  toolbarConfig: {
    slots: {
      buttons: 'toolbar-left',
      tools: 'toolbar-right',
    },
  },
  id: 'system-oss-index',
});

const tableRef = useTemplateRef<VxeGridInstance<OssFile>>('tableRef');
const { query, reload } = useTableQuery(
  searchFormRef,
  tableRef,
  syncCheckedRows,
);
const checkedRows = ref<OssFile[]>([]);

const gridEvents: VxeGridListeners = {
  checkboxAll: syncCheckedRows,
  checkboxChange: syncCheckedRows,
  // 排序 重新请求接口
  sortChange: () => query(),
};

// async function handleDownload(row: OssFile) {
//   const downloadSize = ref($t('pages.common.downloadLoading'));
//   const hideLoading = message.loading({
//     content: () => downloadSize.value,
//     duration: 0,
//   });
//   try {
//     const data = await ossDownload(row.ossId, (e) => {
//       // 计算下载进度
//       const percent = Math.floor((e.loaded / e.total!) * 100);
//       // 已经下载
//       const current = calculateFileSize(e.loaded);
//       // 总大小
//       const total = calculateFileSize(e.total!);
//       downloadSize.value = `已下载: ${current}/${total} (${percent}%)`;
//     });
//     downloadByData(data, row.originalName);
//     message.success('下载完成');
//   } finally {
//     hideLoading();
//   }
// }

const { apiURL, clientId } = useAppConfig(
  import.meta.env,
  import.meta.env.PROD,
);
const accessStore = useAccessStore();

/**
 * 浏览器直接接管下载 相较于axios请求 不会阻塞
 * @param row oss信息
 */
async function handleDownload(row: OssFile) {
  await checkLoginBeforeDownload();

  const params = {
    clientid: clientId,
    Authorization: `Bearer ${accessStore.accessToken}`,
  };

  const downloadLink = `${apiURL}/resource/oss/download/${row.ossId}?${stringify(params)}`;
  // fileName不设置也行 默认会取header里的名称
  downloadByUrl({ fileName: row.fileName, url: downloadLink });
}

async function handleDelete(row: OssFile) {
  await ossRemove([row.ossId]);
  // 取消该行选中状态，避免 reserve 记录残留
  tableRef.value?.setCheckboxRow(row, false);
  await query();
}

function handleMultiDelete() {
  const rows = getCheckedRows();
  const ids = rows.map((row: OssFile) => row.ossId);
  window.modal.confirm({
    title: '提示',
    okType: 'danger',
    content: `确认删除选中的${ids.length}条记录吗？`,
    onOk: async () => {
      await ossRemove(ids);
      // 清除所有选中状态，避免 reserve 记录残留
      tableRef.value?.clearCheckboxRow();
      tableRef.value?.clearCheckboxReserve();
      await query();
    },
  });
}

const router = useRouter();
function handleToSettings() {
  router.push('/system/oss-config/index');
}

const preview = ref(false);
onMounted(async () => {
  const previewStr = await configInfoByKey('sys.oss.previewListResource');
  preview.value = previewStr === 'true';
});

/**
 * 根据拓展名判断是否是图片
 * @param ext 拓展名
 */
function isImageFile(ext: string) {
  return supportImageList.some((item) =>
    ext.toLocaleLowerCase().includes(item),
  );
}

/**
 * 判断是否是pdf文件
 * @param ext 扩展名
 */
function isPdfFile(ext: string) {
  return ext.toLocaleLowerCase().includes('pdf');
}

/**
 * pdf预览 使用浏览器接管
 * @param url 文件地址
 */
function pdfPreview(url: string) {
  window.open(url);
}

function handleSearchSubmit(data: Record<string, any>) {
  reload(data);
}

function handleSearchReset() {
  reload();
}

const [ImageUploadModal, imageUploadApi] = useVbenModal({
  connectedComponent: imageUploadModal,
});

const [FileUploadModal, fileUploadApi] = useVbenModal({
  connectedComponent: fileUploadModal,
});

function getCheckedRows() {
  const table = tableRef.value;
  if (!table) {
    return [];
  }
  return [
    ...table.getCheckboxRecords(),
    ...table.getCheckboxReserveRecords(),
  ] as OssFile[];
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
      <div class="flex h-full flex-col gap-4">
        <OssSearchForm
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
              <div class="text-[16px] font-medium">文件列表</div>
            </template>
            <template #toolbar-right>
              <Space>
                <Tooltip title="预览图片">
                  <Switch v-model:checked="preview" />
                </Tooltip>
                <a-button
                  v-access:code="['system:ossConfig:list']"
                  @click="handleToSettings"
                >
                  配置管理
                </a-button>
                <a-button
                  :disabled="checkedRows.length === 0"
                  danger
                  type="primary"
                  v-access:code="['system:oss:remove']"
                  @click="handleMultiDelete"
                >
                  {{ $t('pages.common.delete') }}
                </a-button>
                <a-button
                  v-access:code="['system:oss:upload']"
                  @click="fileUploadApi.open"
                >
                  文件上传
                </a-button>
                <a-button
                  v-access:code="['system:oss:upload']"
                  @click="imageUploadApi.open"
                >
                  图片上传
                </a-button>
              </Space>
            </template>
            <template #url="{ row }">
              <!-- placeholder为图片未加载时显示的占位图 -->
              <!-- fallback为图片加载失败时显示 -->
              <!-- 需要设置key属性 否则切换翻页会有延迟 -->
              <Image
                :key="row.ossId"
                v-if="preview && isImageFile(row.url)"
                :src="row.url"
                height="50px"
                :fallback="fallbackImageBase64"
              >
                <template #placeholder>
                  <div class="flex size-full items-center justify-center">
                    <Spin />
                  </div>
                </template>
              </Image>
              <!-- pdf预览 使用浏览器开新窗口 -->
              <span
                v-else-if="preview && isPdfFile(row.url)"
                class="icon-[vscode-icons--file-type-pdf2] size-10 cursor-pointer"
                @click.stop="pdfPreview(row.url)"
              ></span>
              <span v-else>{{ row.url }}</span>
            </template>
            <template #action="{ row }">
              <Space>
                <action-button
                  v-access:code="['system:oss:download']"
                  @click="handleDownload(row)"
                >
                  {{ $t('pages.common.download') }}
                </action-button>
                <Popconfirm
                  placement="left"
                  title="确认删除？"
                  @confirm="handleDelete(row)"
                >
                  <action-button
                    danger
                    v-access:code="['system:oss:remove']"
                    @click.stop=""
                  >
                    {{ $t('pages.common.delete') }}
                  </action-button>
                </Popconfirm>
              </Space>
            </template>
            <template #loading>
              <Spin :spinning="true" size="large" />
            </template>
          </VxeGrid>
        </div>
      </div>
    </Spin>
    <ImageUploadModal @reload="() => query()" />
    <FileUploadModal @reload="() => query()" />
  </Page>
</template>
