import type { VxeGridProps } from 'vxe-table';

export const columns: VxeGridProps['columns'] = [
  {
    type: 'checkbox',
    width: 45,
    align: 'center',
    resizable: false,
  },
  {
    field: 'tableName',
    title: '表名称',
    minWidth: 180,
    showOverflow: true,
  },
  {
    field: 'className',
    title: '实体类',
    minWidth: 180,
    showOverflow: true,
  },
  {
    field: 'tableComment',
    title: '表描述',
    minWidth: 210,
    showOverflow: true,
  },
  {
    field: 'createTime',
    title: '创建时间',
    width: 150,
    align: 'center',
    resizable: false,
  },
  {
    field: 'updateTime',
    title: '更新时间',
    width: 150,
    align: 'center',
    resizable: false,
  },
  {
    field: 'action',
    fixed: 'right',
    slots: { default: 'action' },
    title: '操作',
    resizable: false,
    align: 'center',
    width: 'auto',
  },
];

export const iconMap = [
  { key: 'java', value: <span class="icon-[skill-icons--java-light]"></span> },
  { key: 'xml', value: <span class="icon-[tabler--file-type-xml]"></span> },
  { key: 'sql', value: <span class="icon-[carbon--sql]"></span> },
  { key: 'ts', value: <span class="icon-[skill-icons--typescript]"></span> },
  { key: 'vue', value: <span class="icon-[logos--vue]"></span> },
  {
    key: 'folder',
    value: <span class="icon-[flat-color-icons--folder]"></span>,
  },
];

export const defaultFileIcon = (
  <span class="icon-[flat-color-icons--folder]"></span>
);
export const defaultFolderIcon = (
  <span class="icon-[flat-color-icons--folder]"></span>
);
