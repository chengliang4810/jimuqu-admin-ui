import type { MaybeElement } from '@vueuse/core';
import type { ComponentPublicInstance } from 'vue';

import { unrefElement } from '@vueuse/core';
import { computed, getCurrentInstance, onUpdated, ref, triggerRef } from 'vue';

/**
 * 转发组件 ref 和 expose
 * 参考: https://github.com/vuejs/rfcs/issues/258#issuecomment-1068697672
 */
export function useForwardExpose<T extends ComponentPublicInstance>() {
  const instance = getCurrentInstance()!;

  const currentRef = ref<Element | T | null>();
  const currentElement = computed(() => resolveCurrentElement());

  onUpdated(() => {
    if (currentElement.value !== resolveCurrentElement()) {
      triggerRef(currentRef);
    }
  });

  function resolveCurrentElement() {
    return currentRef.value &&
      '$el' in currentRef.value &&
      ['#text', '#comment'].includes(currentRef.value.$el.nodeName)
      ? (currentRef.value.$el.nextElementSibling as HTMLElement)
      : (unrefElement(currentRef as unknown as MaybeElement) as HTMLElement);
  }

  const localExpose: Record<string, any> | null = Object.assign(
    {},
    instance.exposed,
  );
  const ret: Record<string, any> = {};

  for (const key in instance.props) {
    Object.defineProperty(ret, key, {
      enumerable: true,
      configurable: true,
      get: () => instance.props[key],
    });
  }

  if (Object.keys(localExpose).length > 0) {
    for (const key in localExpose) {
      Object.defineProperty(ret, key, {
        enumerable: true,
        configurable: true,
        get: () => localExpose![key],
      });
    }
  }

  Object.defineProperty(ret, '$el', {
    enumerable: true,
    configurable: true,
    get: () => instance.vnode.el,
  });
  instance.exposed = ret;

  function forwardRef(ref: Element | T | null) {
    currentRef.value = ref;
    if (!ref) return;

    Object.defineProperty(ret, '$el', {
      enumerable: true,
      configurable: true,
      get: () => (ref instanceof Element ? ref : ref.$el),
    });

    if (!(ref instanceof Element) && !Object.hasOwn(ref, '$el')) {
      const childExposed = ref.$.exposed;
      const merged = Object.assign({}, ret);
      for (const key in childExposed) {
        Object.defineProperty(merged, key, {
          enumerable: true,
          configurable: true,
          get: () => childExposed[key],
        });
      }
      instance.exposed = merged;
    }
  }

  return { forwardRef, currentRef, currentElement };
}
