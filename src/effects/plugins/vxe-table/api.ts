import type { VxeGridInstance } from 'vxe-table';

import type { VxeGridProps } from './types';
import type { ViewedRowHelper } from './use-viewed-row';

import { toRaw } from 'vue';

import { Store } from '@/core/shared/store';
import {
  bindMethods,
  isFunction,
  mergeWithArrayOverride,
  StateHandler,
} from '@/core/shared/utils';

function getDefaultState(): VxeGridProps {
  return {
    class: '',
    gridClass: '',
    gridOptions: {},
    gridEvents: {},
  };
}

export class VxeGridApi<T extends Record<string, any> = any> {
  public grid = {} as VxeGridInstance<T>;
  public state: null | VxeGridProps<T> = null;
  public store: Store<VxeGridProps<T>>;
  public viewedRowHelper: null | ViewedRowHelper<T> = null;

  private isMounted = false;
  private stateHandler: StateHandler;

  constructor(options: VxeGridProps<T> = {} as VxeGridProps<T>) {
    const storeState = { ...options };
    const defaultState = getDefaultState();
    this.store = new Store<VxeGridProps<T>>(
      mergeWithArrayOverride(storeState, defaultState) as VxeGridProps<T>,
    );

    this.store.subscribe((state) => {
      this.state = state;
    });

    this.state = this.store.state;
    this.stateHandler = new StateHandler();
    bindMethods(this);
  }

  clearViewedRows() {
    this.viewedRowHelper?.clearViewed();
  }

  getViewedKeys(): Set<number | string> {
    const raw = this.viewedRowHelper?.viewedSet.value;
    return raw ? new Set(raw) : new Set();
  }

  isRowViewed(record: T): boolean {
    return this.viewedRowHelper?.isViewed(record) ?? false;
  }

  markKeysAsViewed(keys: Array<number | string>) {
    this.viewedRowHelper?.markKeysAsViewed(keys);
  }

  markRowAsViewed(record: T) {
    this.viewedRowHelper?.markAsViewed(record);
  }

  mount(instance: null | VxeGridInstance) {
    if (!this.isMounted && instance) {
      this.grid = instance;
      this.stateHandler.setConditionTrue();
      this.isMounted = true;
    }
  }

  async query(params: Record<string, any> = {}) {
    try {
      await this.grid.commitProxy('query', toRaw(params));
    } catch (error) {
      console.error('Error occurred while querying:', error);
    }
  }

  async reload(params: Record<string, any> = {}) {
    try {
      await this.grid.commitProxy('reload', toRaw(params));
    } catch (error) {
      console.error('Error occurred while reloading:', error);
    }
  }

  removeViewedKeys(keys: Array<number | string>) {
    this.viewedRowHelper?.removeKeys(keys);
  }

  setGridOptions(options: Partial<VxeGridProps<T>['gridOptions']>) {
    this.setState({ gridOptions: options });
  }

  setLoading(isLoading: boolean) {
    this.setState({ gridOptions: { loading: isLoading } });
  }

  setState(
    stateOrFn:
      | ((prev: VxeGridProps<T>) => Partial<VxeGridProps<T>>)
      | Partial<VxeGridProps<T>>,
  ) {
    if (isFunction(stateOrFn)) {
      this.store.setState((prev) => {
        return mergeWithArrayOverride(stateOrFn(prev), prev);
      });
    } else {
      this.store.setState((prev) => mergeWithArrayOverride(stateOrFn, prev));
    }
  }

  unmount() {
    this.isMounted = false;
    this.stateHandler.reset();
    this.viewedRowHelper = null;
  }
}
