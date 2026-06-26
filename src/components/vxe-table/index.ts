import type { VxeGridProps, VxeGridPropTypes } from 'vxe-table';

import { reactive, toRaw } from 'vue';

import { cloneDeep, cn, mergeWithArrayOverride } from '@/utils';
import { VxeUI } from 'vxe-table';

import { setupVbenVxeTable } from './init';

import 'vxe-table/styles/cssvar.scss';
import 'vxe-pc-ui/styles/cssvar.scss';
import './style.css';
import './checkbox.css';

/**
 * 合并默认值
 * @param gridOptions
 * @returns
 */
export function withDefaultVxeGridOptions<T extends Record<string, any>>(
  gridOptions: VxeGridProps<T>,
) {
  const globalGridConfig = VxeUI.getConfig().grid ?? {};
  return reactive(
    cloneDeep(
      mergeWithArrayOverride({}, toRaw(gridOptions), toRaw(globalGridConfig)),
    ),
  ) as VxeGridProps<T>;
}

export { useTableQuery } from './use-table-query';
export type { VxeTableSearchFormInstance } from './use-table-query';

export const tableSeachClass = cn(
  // 语义钩子类：供 styles/antdv-next/index.css 定位本搜索表单
  'table-search-grid',
  // 响应式栅格：随断点 1/2/3/4 列
  'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  // 行/列间距统一由 grid gap 提供；FormItem 默认下 margin 的清除见
  // styles/antdv-next/index.css 中的 .table-search-grid 规则
  'gap-x-4 gap-y-6',
);

/**
 * 通用的 排序参数添加到请求参数中
 * @param params 请求参数
 * @param sortList vxe-table的排序参数
 */
export function addSortParams(
  params: Record<string, any>,
  sortList: VxeGridPropTypes.ProxyAjaxQuerySortCheckedParams[],
) {
  // 这里是排序取消 length为0 就不添加参数了
  if (sortList.length === 0) {
    return;
  }
  // 支持单/多字段排序
  const orderByColumn = sortList.map((item) => item.field).join(',');
  const isAsc = sortList.map((item) => item.order).join(',');
  params.orderByColumn = orderByColumn;
  params.isAsc = isAsc;
}

setupVbenVxeTable({
  configVxeTable: (vxeUI) => {
    vxeUI.setConfig({
      grid: {
        align: 'center',
        // https://vxetable.cn/#/component/table/base/border
        border: 'inner',
        minHeight: 180,
        formConfig: {
          // 全局禁用vxe-table的内置表单
          enabled: false,
        },
        proxyConfig: {
          autoLoad: true,
          response: {
            result: 'rows',
            total: 'total',
            list: 'rows',
          },
          showActiveMsg: true,
          showResponseMsg: false,
        },
        // 溢出展示形式
        showOverflow: true,
        pagerConfig: {
          // 默认条数
          pageSize: 10,
          background: true,
          className: 'mt-2 w-full',
          layouts: [
            'Total',
            'Sizes',
            'Home',
            'PrevJump',
            'PrevPage',
            'Number',
            'NextPage',
            'NextJump',
            'End',
          ],
          // 分页可选条数
          pageSizes: [10, 20, 30],
          size: 'mini',
        },
        rowConfig: {
          // 鼠标移入行显示 hover 样式
          isHover: true,
          // 点击行高亮
          isCurrent: false,
          /**
           * vxe和popconfirm混合使用 即删除操作 会一直获取第一页的对应row 而非当前页对应的row
           * 在dev是正常的 打包后会复现
           * 必须给row设置key来解决 暂时未知到底是vxe还是antdv或者vite的问题
           * - 已经确认是antdv-next问题  https://github.com/antdv-next/antdv-next/issues/576
           * >= 1.3.4 可以不设置这个参数(false)
           */
          useKey: true,
        },
        columnConfig: {
          // 可拖拽列宽
          resizable: true,
        },
        // 右上角工具栏
        toolbarConfig: {
          // 自定义列
          custom: true,
          customOptions: {
            icon: 'vxe-icon-setting',
          },
          // 最大化
          zoom: true,
          // 刷新
          refresh: true,
          refreshOptions: {
            // 默认为reload 修改为在当前页刷新
            code: 'query',
          },
        },
        // 圆角按钮
        round: true,
        // 表格尺寸
        size: 'medium',
        customConfig: {
          // 表格右上角自定义列配置 是否保存到localStorage
          // 必须存在id参数才能使用
          storage: false,
        },
      },
    });

    // 这里可以自行扩展 vxe-table 的全局配置，比如自定义格式化
    // vxeUI.formats.add
  },
});
