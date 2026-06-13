import type { FormRuleObject, FormSchemaRuleType } from '../types';

import { isObject, isString } from '@/core/shared/utils';

import { getNamedRule, NAMED_REQUIRED_RULES } from '../config';

export function isEventObjectLike(obj: any) {
  if (!obj || !isObject(obj)) {
    return false;
  }
  return Reflect.has(obj, 'target') && Reflect.has(obj, 'stopPropagation');
}

/**
 * 将 vben 的 rules(字符串快捷 / antd rule 对象 / rule 数组)归一为 antd 的 rule 数组。
 * @param rules schema 上的 rules
 * @param label 字段标签(用于内置 required 提示的国际化)
 */
export function normalizeRules(
  rules: FormSchemaRuleType | undefined,
  label: string,
): FormRuleObject[] {
  if (!rules) {
    return [];
  }
  // 字符串快捷规则: 'required' | 'selectRequired' | 其他已注册规则名
  if (isString(rules)) {
    const namedRule = getNamedRule(rules, label);
    return namedRule ? [namedRule] : [];
  }
  // rule 数组
  if (Array.isArray(rules)) {
    return rules as FormRuleObject[];
  }
  // 单个 rule 对象
  return [rules as FormRuleObject];
}

/**
 * 判断字段是否需要显示必填标记。
 */
export function isRequiredRule(
  rules: FormSchemaRuleType | undefined,
): boolean {
  if (!rules) {
    return false;
  }
  if (isString(rules)) {
    return NAMED_REQUIRED_RULES.has(rules);
  }
  const list = Array.isArray(rules) ? rules : [rules];
  return list.some((rule) => isObject(rule) && (rule as any).required === true);
}
