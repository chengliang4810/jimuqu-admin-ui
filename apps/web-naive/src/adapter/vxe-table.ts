import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';

import { h } from 'vue';

import { setupVbenVxeTable, useVbenVxeGrid } from '@vben/plugins/vxe-table';

import { NButton, NImage } from 'naive-ui';

import { useVbenForm } from './form';

setupVbenVxeTable({
  configVxeTable: (vxeUI) => {
    vxeUI.setConfig({
      grid: {
        align: 'center',
        border: false,
        columnConfig: {
          // 可拖拽列宽
          resizable: true,
        },
        minHeight: 180,
        formConfig: {
          // 全局禁用vxe-table的表单配置，使用formOptions
          enabled: false,
        },
        proxyConfig: {
          autoLoad: true,
          response: {
            result: 'items',
            total: 'total',
            list: 'items',
          },
          showActionMsg: true,
          showResponseMsg: false,
        },
        // 溢出展示形式
        showOverflow: true,
        // 表格尺寸
        size: 'medium',
        // 圆角按钮
        round: true,
        pagerConfig: {
          // 默认条数
          pageSize: 15,
          // 分页可选条数
          pageSizes: [15, 30, 50, 100, 200, 500],
        },
        rowConfig: {
          // 默认id 字段
          keyField: 'id',
          // 鼠标移入行显示 hover 样式
          isHover: true,
          // 点击行高亮
          isCurrent: false,
        },
        // 右上角工具栏
        toolbarConfig: {
          // 自定义列
          custom: {
            icon: 'vxe-icon-setting',
          },
          // 最大化
          zoom: true,
          // 刷新
          refresh: {
            // 默认为reload 修改为在当前页刷新
            code: 'query',
          },
        },
        customConfig: {
          // 表格右上角自定义列配置 是否保存到localStorage
          // 必须存在id参数才能使用
          storage: false,
        },
      } as VxeTableGridOptions,
    });

    // 表格配置项可以用 cellRender: { name: 'CellImage' },
    vxeUI.renderer.add('CellImage', {
      renderTableDefault(_renderOpts, params) {
        const { column, row } = params;
        return h(NImage, { src: row[column.field] });
      },
    });

    // 表格配置项可以用 cellRender: { name: 'CellLink' },
    vxeUI.renderer.add('CellLink', {
      renderTableDefault(renderOpts) {
        const { props } = renderOpts;
        return h(
          NButton,
          { size: 'small', type: 'primary', quaternary: true },
          { default: () => props?.text },
        );
      },
    });

    // 这里可以自行扩展 vxe-table 的全局配置，比如自定义格式化
    // vxeUI.formats.add
  },
  useVbenForm,
});

export { useVbenVxeGrid };

export type * from '@vben/plugins/vxe-table';
