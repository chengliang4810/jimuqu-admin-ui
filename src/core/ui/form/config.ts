import type { Component } from 'vue';

import type {
  BaseFormComponentType,
  FormCommonConfig,
  FormRuleObject,
  VbenFormAdapterOptions,
} from './types';

import { h } from 'vue';

import { globalShareState } from '@/core/shared/global-state';
import { Button, Checkbox, Input, InputPassword, Select } from 'antdv-next';

const DEFAULT_MODEL_PROP_NAME = 'modelValue';

export const DEFAULT_FORM_COMMON_CONFIG: FormCommonConfig = {};

/**
 * 命名规则(字符串快捷 rules)注册表。
 * 校验函数签名: (value, label) => true | string(错误信息)
 */
type NamedRuleValidator = (value: any, label: string) => string | true;
export const NAMED_RULES = new Map<string, NamedRuleValidator>();

/** 会显示必填标记的命名规则集合 */
export const NAMED_REQUIRED_RULES = new Set<string>([
  'required',
  'selectRequired',
]);

/**
 * 根据命名规则生成 antd 的 rule。required 标记由 FormItem 单独控制，
 * 此处仅提供 validator，避免与 antd 内置 required 提示重复。
 */
export function getNamedRule(
  name: string,
  label: string,
): FormRuleObject | null {
  const validatorFn = NAMED_RULES.get(name);
  if (!validatorFn) {
    return null;
  }
  return {
    validator: async (_rule: any, value: any) => {
      const result = validatorFn(value, label);
      if (result === true) {
        return;
      }
      throw new Error(typeof result === 'string' ? result : `${label}`);
    },
  } as FormRuleObject;
}

export const COMPONENT_MAP: Record<BaseFormComponentType, Component> = {
  DefaultButton: h(Button, { size: 'small' }),
  PrimaryButton: h(Button, { size: 'small', type: 'primary' }),
  VbenCheckbox: Checkbox,
  VbenInput: Input,
  VbenInputCaptcha: Input,
  VbenInputPassword: InputPassword,
  VbenPinInput: Input,
  VbenSelect: Select,
};

export const COMPONENT_BIND_EVENT_MAP: Partial<
  Record<BaseFormComponentType, string>
> = {
  VbenCheckbox: 'checked',
};

export function setupVbenForm<
  T extends BaseFormComponentType = BaseFormComponentType,
>(options: VbenFormAdapterOptions<T>) {
  const { config, defineRules } = options;

  const {
    disabledOnChangeListener = true,
    disabledOnInputListener = true,
    emptyStateValue = undefined,
  } = (config || {}) as FormCommonConfig;

  Object.assign(DEFAULT_FORM_COMMON_CONFIG, {
    disabledOnChangeListener,
    disabledOnInputListener,
    emptyStateValue,
  });

  if (defineRules) {
    for (const key of Object.keys(defineRules)) {
      NAMED_RULES.set(key, defineRules[key as never] as NamedRuleValidator);
    }
  }

  const baseModelPropName =
    config?.baseModelPropName ?? DEFAULT_MODEL_PROP_NAME;
  const modelPropNameMap = config?.modelPropNameMap as
    | Record<BaseFormComponentType, string>
    | undefined;

  const components = globalShareState.getComponents();

  for (const component of Object.keys(components)) {
    const key = component as BaseFormComponentType;
    COMPONENT_MAP[key] = components[component as never];

    if (baseModelPropName !== DEFAULT_MODEL_PROP_NAME) {
      COMPONENT_BIND_EVENT_MAP[key] = baseModelPropName;
    }

    // 覆盖特殊组件的modelPropName
    if (modelPropNameMap && modelPropNameMap[key]) {
      COMPONENT_BIND_EVENT_MAP[key] = modelPropNameMap[key];
    }
  }
}
