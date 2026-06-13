import { inject, provide } from 'vue';

/**
 * 轻量 provide/inject 上下文工具，替换原 `@vben-core/shadcn-ui`(reka-ui) 的 createContext。
 */
export function createContext<ContextValue>(
  providerComponentName: string,
  contextName?: string,
) {
  const injectionKey = Symbol(contextName ?? `${providerComponentName}Context`);

  function injectContext(fallback?: ContextValue): ContextValue {
    const context = inject<ContextValue>(
      injectionKey as any,
      fallback as ContextValue,
    );
    if (context) {
      return context;
    }
    if (context === null) {
      return context as ContextValue;
    }
    throw new Error(
      `Injection not found. Component must be used within \`${providerComponentName}\`.`,
    );
  }

  function provideContext(contextValue: ContextValue) {
    provide(injectionKey as any, contextValue);
    return contextValue;
  }

  return [injectContext, provideContext] as const;
}
