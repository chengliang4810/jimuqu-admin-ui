import type { Recordable } from '@vben-core/typings';

import type { Arrayable } from '@vueuse/core';

export interface FlattenedItem<T = Recordable<any>, P = number | string> {
  _id: P;
  bind?: Recordable<any>;
  hasChildren: boolean;
  id: P;
  level: number;
  parentId: null | P;
  parents: P[];
  value: T;
}

export interface TreeProps {
  allowClear?: boolean;
  autoCheckParent?: boolean;
  bordered?: boolean;
  checkStrictly?: boolean;
  childrenField?: string;
  defaultExpandedKeys?: Array<number | string>;
  defaultExpandedLevel?: number;
  defaultValue?: Arrayable<number | string>;
  disabled?: boolean;
  disabledField?: string;
  getNodeClass?: (item: FlattenedItem<Recordable<any>>) => string;
  iconField?: string;
  labelField?: string;
  multiple?: boolean;
  selectAllLabel?: string;
  showIcon?: boolean;
  transition?: boolean;
  treeData: Recordable<any>[];
  valueField?: string;
}

export function treePropsDefaults() {
  return {
    allowClear: false,
    autoCheckParent: true,
    bordered: false,
    checkStrictly: false,
    childrenField: 'children',
    defaultExpandedKeys: () => [],
    defaultExpandedLevel: 0,
    disabled: false,
    disabledField: 'disabled',
    iconField: 'icon',
    labelField: 'label',
    multiple: false,
    selectAllLabel: '',
    showIcon: true,
    transition: true,
    valueField: 'value',
  };
}
