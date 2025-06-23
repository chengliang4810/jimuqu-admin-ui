<script lang="tsx" setup>
import { Page } from '@vben/common-ui';

import { requestClient } from '#/api/request';

const message = useMessage();
const dialog = useDialog();

// const osOptions = [
//   { icon: 'devicon:windows8', value: 'windows' },
//   { icon: 'devicon:linux', value: 'linux' },
//   { icon: 'wpf:macos', value: 'osx' },
//   { icon: 'flat-color-icons:android-os', value: 'android' },
//   { icon: 'majesticons:iphone-x-apps-line', value: 'iphone' },
// ];

// /**
//  * 浏览器图标
//  * cn.hutool.http.useragent -> browers
//  */
// const browserOptions = [
//   { icon: 'logos:chrome', value: 'chrome' },
//   { icon: 'logos:microsoft-edge', value: 'edge' },
//   { icon: 'logos:firefox', value: 'firefox' },
//   { icon: 'logos:opera', value: 'opera' },
//   { icon: 'logos:safari', value: 'safari' },
//   { icon: 'mdi:wechat', value: 'micromessenger' },
//   { icon: 'logos:quarkus-icon', value: 'quark' },
//   { icon: 'mdi:wechat', value: 'wxwork' },
//   { icon: 'simple-icons:tencentqq', value: 'qq' },
//   { icon: 'ri:dingding-line', value: 'dingtalk' },
//   { icon: 'arcticons:uc-browser', value: 'uc' },
//   { icon: 'ri:baidu-fill', value: 'baidu' },
// ];

// 数据类型字段
interface UserOnlineVo {
  /** 主键 */
  tokenId: string;
  /** 昵称 */
  nickName: string;
  /** 账号 */
  userName: string;
  /** 部门 */
  deptName: string;
  /** 设备类型 */
  deviceType: string;
  /** IP */
  ipaddr: string;
  /**
   * 浏览器
   */
  browser: string;
  /** 登录地点 */
  loginLocation: string;
  /** 系统 */
  os: string;
  /** 登录时间 */
  loginTime: string;
}

// 查询表单配置
// const _formOptions: VbenFormProps = {
//   // 默认展开
//   collapsed: false,
//   schema: [
//     {
//       component: 'Input',
//       componentProps: {
//         placeholder: '请输入参数名称',
//       },
//       fieldName: 'configName',
//       label: '参数名称',
//     },
//     {
//       component: 'Input',
//       componentProps: {
//         placeholder: '请输入参数键名',
//       },
//       fieldName: 'configKey',
//       label: '参数键名',
//     },
//   ],
//   // 控制表单是否显示折叠按钮
//   showCollapseButton: true,
//   submitButtonOptions: {
//     content: '查询',
//   },
//   // 是否在字段值改变时提交表单进行搜索
//   submitOnChange: false,
//   // 按下回车时是否提交表单进行搜索
//   submitOnEnter: true,
// };

// 表格配置
const gridOptions: VxeGridProps<UserOnlineVo> = {
  checkboxConfig: {
    highlight: true,
    range: true,
  },
  columns: [
    { align: 'left', title: '', type: 'checkbox', width: 40 },
    { field: 'tokenId', title: '会话ID', visible: false },
    { field: 'nickName', title: '昵称' },
    { field: 'userName', title: '账号' },
    { field: 'deptName', title: '部门' },
    { field: 'deviceType', title: '平台' },
    { field: 'ipaddr', title: 'IP' },
    {
      title: '浏览器',
      field: 'browser',
    },
    { field: 'loginLocation', title: '登录地点' },
    {
      field: 'os',
      title: '系统',
    },
    { field: 'loginTime', formatter: 'formatDateTime', title: '登录时间' },
    {
      field: 'action',
      fixed: 'right',
      slots: { default: 'action' },
      title: '操作',
      width: 150,
    },
  ],
  keepSource: true,
  pagerConfig: {},
  height: 'auto',
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        const { currentPage, pageSize } = page;
        return await requestClient.get<UserOnlineVo[]>(
          '/system/user/online/list',
          {
            params: {
              currentPage,
              pageSize,
              ...formValues,
            },
          },
        );
      },
    },
  },
  toolbarConfig: {
    // 是否显示搜索表单控制按钮
    // @ts-ignore 正式环境时有完整的类型声明
    custom: true,
    // import: true,
    refresh: true,
    zoom: true,
  },
  headerCellConfig: {
    height: 44,
  },
  cellConfig: {
    height: 48,
  },
  rowConfig: {
    keyField: 'tokenId',
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

/**
 * 删除选中的参数配置数据
 */
async function handleDeleteCheck() {
  const records = gridApi.grid.getCheckboxRecords();
  if (records.length <= 0) {
    message.warning('请选择要强制退出的账号');
    return;
  }

  // 确认删除
  dialog.warning({
    title: '强制下线提醒',
    content: `你确定要强制下线${records.length}条账号吗？`,
    positiveText: '确定',
    negativeText: '取消',
    draggable: true,
    onPositiveClick: async () => {
      const ids = records.map((item) => item.tokenId);
      await handleDelete(ids);
    },
  });
}

/**
 * 删除参数配置
 * @param id 主键，主键数组
 */
async function handleDelete(id: string | string[]) {
  const data = await requestClient.post(
    `/system/user/online/forceLogout/${id}`,
  );
  message.success(`成功强制下线${data}条账号`);
  refreshTable();
}

/**
 * 刷新表格数据
 */
async function refreshTable() {
  gridApi.reload();
}
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-tools>
        <n-flex class="mx-3" size="small">
          <!-- <n-button class="mr-2"> 导出 </n-button> -->
          <n-button class="mr-2" type="error" @click="handleDeleteCheck">
            强制下线
          </n-button>
        </n-flex>
      </template>
      <template #action="{ row }">
        <n-flex class="mx-3" justify="space-around" size="small">
          <n-popconfirm @positive-click="handleDelete(row.tokenId)">
            <template #trigger>
              <n-button type="error" size="small" ghost>强制下线</n-button>
            </template>
            确认强制下线该账号吗？
          </n-popconfirm>
        </n-flex>
      </template>
    </Grid>
  </Page>
</template>
