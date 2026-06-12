import { inject, provide } from 'vue';

/**
 * 轻量 provide/inject 上下文工具，替换原 `@vben-core/shadcn-ui`(reka-ui) 的 createContext。
 * 返回 [injectContext, provideContext]，与原签名保持一致。
 */
export function createContext<ContextValue>(
  providerComponentName: string,
  contextName?: string,
) {
  const symbolDescription =
    typeof providerComponentName === 'string' && !contextName
      ? `${providerComponentName}Context`
      : (contextName ?? `${providerComponentName}Context`);

  const injectionKey: InjectionKeyType<ContextValue | null> =
    Symbol(symbolDescription);

  /**
   * @param fallback 当未找到 provider 时的回退值
   */
  function injectContext(fallback?: ContextValue): ContextValue {
    const context = inject(injectionKey, fallback as ContextValue);
    if (context) {
      return context;
    }
    if (context === null) {
      return context as ContextValue;
    }
    throw new Error(
      `Injection \`${injectionKey.toString()}\` not found. Component must be used within \`${providerComponentName}\`.`,
    );
  }

  function provideContext(contextValue: ContextValue) {
    provide(injectionKey, contextValue);
    return contextValue;
  }

  return [injectContext, provideContext] as const;
}

type InjectionKeyType<T> = symbol & { __ctx?: T };
