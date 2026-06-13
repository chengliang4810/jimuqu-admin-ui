import type { MaybeRefOrGetter } from 'vue';
import { camelize, computed, getCurrentInstance, toHandlerKey } from 'vue';

import { useForwardProps } from './use-forward-props';

/**
 * Vue 没有 emits 转发机制，需要将事件转为 `onXXX` handler
 * 参考: https://github.com/vuejs/core/issues/5917
 */
function useEmitAsProps<Name extends string>(
  emit: (name: Name, ...args: any[]) => void,
) {
  const vm = getCurrentInstance();
  const events = vm?.type.emits as Name[];
  const result: Record<string, any> = {};

  if (!events?.length) {
    console.warn(
      `No emitted event found. Please check component: ${vm?.type.__name}`,
    );
  }

  events?.forEach((ev) => {
    result[toHandlerKey(camelize(ev))] = (...arg: any) => emit(ev, ...arg);
  });
  return result;
}

/**
 * 组合 useForwardProps 和 useEmitAsProps
 */
export function useForwardPropsEmits<
  T extends Record<string, any>,
  Name extends string,
>(props: MaybeRefOrGetter<T>, emit?: (name: Name, ...args: any[]) => void) {
  const parsedProps = useForwardProps(props);
  const emitsAsProps = emit ? useEmitAsProps(emit) : {};

  return computed(() => ({
    ...parsedProps.value,
    ...emitsAsProps,
  }));
}
