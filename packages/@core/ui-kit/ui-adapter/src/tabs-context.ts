import type { InjectionKey, Ref } from 'vue';

export interface TabsContext {
  activeValue: Ref<number | string | undefined>;
  setActiveValue: (value: number | string) => void;
}

export const tabsContextKey: InjectionKey<TabsContext> =
  Symbol('vben-tabs-context');
