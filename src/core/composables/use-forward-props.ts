import type { MaybeRefOrGetter } from 'vue';

import { camelize, computed, getCurrentInstance, toRef } from 'vue';

interface PropOptions {
  type?: any;
  required?: boolean;
  default?: any;
}

type WithOptionalBooleans<T> = {
  [K in keyof T as [T[K]] extends [boolean] ? K : never]?: T[K];
} & {
  [K in keyof T as [T[K]] extends [boolean] ? never : K]: T[K];
};

/**
 * 转发 props，返回一个 computed，合并默认 props 与当前实例的已赋值 props。
 * 只返回 props 参数中明确传入的值。
 */
export function useForwardProps<T extends Record<string, any>>(
  props: MaybeRefOrGetter<T>,
) {
  const vm = getCurrentInstance();
  const defaultProps = Object.keys(vm?.type.props ?? {}).reduce(
    (prev, curr) => {
      const defaultValue = (vm?.type.props[curr] as PropOptions).default;
      if (defaultValue !== undefined) prev[curr as keyof T] = defaultValue;
      return prev;
    },
    {} as T,
  );

  const refProps = toRef(props);
  return computed(() => {
    const preservedProps = {} as T;
    const assignedProps = vm?.vnode.props ?? {};

    for (const key of Object.keys(assignedProps)) {
      preservedProps[camelize(key) as keyof T] = assignedProps[key];
    }

    return Object.keys({ ...defaultProps, ...preservedProps }).reduce(
      (prev, curr) => {
        if (refProps.value[curr] !== undefined)
          (prev as Record<string, any>)[curr] = refProps.value[curr];
        return prev;
      },
      {} as WithOptionalBooleans<T>,
    );
  });
}
