import type { VxeGridProps } from '@/adapter/vxe-table';

import { DictEnum } from '@/constants';
import { getDictOptions } from '@/utils/dict';
import { renderDict, renderDictTags } from '@/utils/render';
import { Tag, Tooltip } from 'antdv-next';

function renderList(list: string[], allText: string) {
  const accessPathList = (list as string[]) ?? [];
  if (accessPathList.length === 0) {
    return <Tag color="success">{allText}</Tag>;
  }
  return (
    <Tooltip
      title={
        <div class="flex flex-col px-2">
          {accessPathList.map((i) => (
            <span key={i}>{i}</span>
          ))}
        </div>
      }
    >
      <Tag color="processing">
        {accessPathList[0]} {accessPathList.length > 1 ? '等' : ''}
      </Tag>
    </Tooltip>
  );
}

export const columns: VxeGridProps['columns'] = [
  { type: 'checkbox', width: 60 },
  {
    title: '客户端ID',
    field: 'clientId',
    showOverflow: true,
  },
  {
    title: '客户端key',
    field: 'clientKey',
  },
  {
    title: '客户端密钥',
    field: 'clientSecret',
  },
  {
    title: '授权类型',
    field: 'grantTypeList',
    slots: {
      default: ({ row }) => {
        if (!row.grantTypeList) {
          return '无';
        }
        return renderDictTags(
          row.grantTypeList,
          getDictOptions(DictEnum.SYS_GRANT_TYPE),
          true,
          4,
        );
      },
    },
  },
  {
    title: '设备类型',
    field: 'deviceType',
    slots: {
      default: ({ row }) => {
        return renderDict(row.deviceType, DictEnum.SYS_DEVICE_TYPE);
      },
    },
  },
  {
    title: 'token活跃时间',
    field: 'activeTimeout',
    formatter({ row }) {
      return `${row.activeTimeout}秒`;
    },
  },
  {
    title: 'token超时时间',
    field: 'timeout',
    formatter({ row }) {
      return `${row.timeout}秒`;
    },
  },
  {
    title: '允许访问路径',
    field: 'accessPath',
    showOverflow: true,
    slots: {
      default: ({ row }) => {
        const accessPathList = (row.accessPathList as string[]) ?? [];
        return renderList(accessPathList, '全部路径');
      },
    },
  },
  {
    title: 'IP白名单',
    field: 'ipWhitelist',
    showOverflow: true,
    slots: {
      default: ({ row }) => {
        const ipWhitelist = (row.ipWhitelistList as string[]) ?? [];
        return renderList(ipWhitelist, '全部IP');
      },
    },
  },
  {
    title: '状态',
    field: 'status',
    slots: {
      default: 'status',
    },
  },
  {
    field: 'action',
    fixed: 'right',
    slots: { default: 'action' },
    title: '操作',
    resizable: false,
    width: 'auto',
  },
];
