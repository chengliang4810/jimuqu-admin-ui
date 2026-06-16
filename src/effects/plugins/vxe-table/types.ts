import type { ClassType } from '@/types';
import type {
  VxeGridListeners,
  VxeGridPropTypes,
  VxeGridProps as VxeTableGridProps,
  VxeTablePropTypes,
  VxeUIExport,
} from 'vxe-table';

import type { Ref } from 'vue';

import type { VxeGridApi } from './api';

export interface VxePaginationInfo {
  currentPage: number;
  pageSize: number;
  total: number;
}

interface ToolbarConfigOptions extends VxeGridPropTypes.ToolbarConfig {}

export type VxeTableGridColumns<T = any> = VxeTableGridOptions<T>['columns'];

export interface VxeTableGridOptions<T = any> extends VxeTableGridProps<T> {
  toolbarConfig?: ToolbarConfigOptions;
}

export interface ViewedRowStorageAdapter {
  getKeys(): Promise<Array<number | string>>;
  removeKeys(): Promise<void>;
  setKeys(keys: Array<number | string>): Promise<void>;
}

interface ViewedRowPersistBase {
  ttl?: number;
  maxSize?: number;
}

export type ViewedRowPersistOptions =
  | ({
      dbName?: string;
      dbVersion?: number;
      key: string;
      storeName?: string;
      type: 'indexedDB';
    } & ViewedRowPersistBase)
  | ({
      key: string;
      type: 'localStorage' | 'sessionStorage';
    } & ViewedRowPersistBase)
  | ({
      storage: ViewedRowStorageAdapter;
      type: 'custom';
    } & ViewedRowPersistBase)
  | (ViewedRowPersistBase & {
      type: 'memory';
    });

export interface ViewedRowOptions<T = any> {
  actionCodes?: string | string[];
  keyField?: string;
  viewedKeys?: Array<number | string> | Ref<Array<number | string>>;
  persist?: string | ViewedRowPersistOptions;
  rowClassName?: VxeTablePropTypes.RowClassName<T>;
  rowStyle?: VxeTablePropTypes.RowStyle<T>;
}

export interface VxeGridProps<T extends Record<string, any> = any> {
  tableData?: any[];
  tableTitle?: string;
  tableTitleHelp?: string;
  class?: ClassType;
  gridClass?: ClassType;
  gridOptions?: Partial<VxeTableGridOptions<T>>;
  gridEvents?: Partial<VxeGridListeners<T>>;
  viewedRowOptions?: boolean | ViewedRowOptions<T>;
}

export type ExtendedVxeGridApi<T extends Record<string, any> = any> =
  VxeGridApi<T> & {
    useStore: <S = NoInfer<VxeGridProps<T>>>(
      selector?: (state: NoInfer<VxeGridProps<T>>) => S,
    ) => Readonly<Ref<S>>;
  };

export interface SetupVxeTable {
  configVxeTable: (ui: VxeUIExport) => void;
}
