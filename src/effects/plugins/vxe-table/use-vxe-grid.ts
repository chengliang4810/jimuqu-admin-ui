import type { VxeGridSlots, VxeGridSlotTypes } from 'vxe-table';

import type { SlotsType } from 'vue';

import type { ExtendedVxeGridApi, VxeGridProps } from './types';

import { defineComponent, h, onBeforeUnmount } from 'vue';

import { useStore } from '@/core/shared/store';

import { VxeGridApi } from './api';
import VxeGrid from './use-vxe-grid.vue';

export function useVbenVxeGrid<T extends Record<string, any> = any>(
  options: VxeGridProps<T>,
) {
  const api = new VxeGridApi<T>(options);
  const extendedApi: ExtendedVxeGridApi<T> = api as ExtendedVxeGridApi<T>;
  extendedApi.useStore = (selector) => {
    return useStore(api.store, selector);
  };

  const Grid = defineComponent(
    (props: VxeGridProps<T>, { attrs, slots }) => {
      onBeforeUnmount(() => {
        api.unmount();
      });
      api.setState({ ...props, ...attrs } as Partial<VxeGridProps<T>>);
      return () =>
        h(
          VxeGrid,
          {
            ...props,
            ...attrs,
            api: extendedApi as ExtendedVxeGridApi,
          },
          slots,
        );
    },
    {
      name: 'VbenVxeGrid',
      inheritAttrs: false,
      slots: Object as SlotsType<
        {
          'table-title': undefined;
          'toolbar-actions': VxeGridSlotTypes.DefaultSlotParams<T>;
          'toolbar-tools': VxeGridSlotTypes.DefaultSlotParams<T>;
        } & {
          [K in keyof VxeGridSlots<T>]: VxeGridSlots<T>[K];
        }
      >,
    },
  );

  return [Grid, extendedApi] as const;
}

export type UseVbenVxeGrid = typeof useVbenVxeGrid;
