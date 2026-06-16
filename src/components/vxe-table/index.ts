import type { VxeGridProps } from 'vxe-table';

import { reactive, toRaw } from 'vue';

import { cloneDeep, cn, mergeWithArrayOverride } from '@/utils';
import { VxeUI } from 'vxe-table';

import '@/adapter/vxe-table';

import 'vxe-table/styles/cssvar.scss';
import 'vxe-pc-ui/styles/cssvar.scss';
import './style.css';

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

export const tableSeachClass = cn(
  'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
);
