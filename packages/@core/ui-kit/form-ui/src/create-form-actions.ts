import type { FormInstance } from 'antdv-next';

import type { FormActions } from './types';

import { reactive, ref, shallowRef } from 'vue';

import { cloneDeep, set } from '@vben-core/shared/utils';

import { resolveFieldNamePath } from './field-name';

/**
 * 将 vben 的 fieldName(支持 a.b、a[0]、[原始key])转换为 antd FormItem 的 name 路径
 */
export function toAntdNamePath(fieldName: string): (number | string)[] | string {
  const { pathSegments, rawKey } = resolveFieldNamePath(fieldName);
  if (rawKey !== undefined) {
    return [rawKey];
  }
  if (pathSegments.length <= 1) {
    return fieldName;
  }
  return pathSegments.map((seg) => (/^\d+$/.test(seg) ? Number(seg) : seg));
}

interface ValidateResult {
  errors: Record<string, any>;
  valid: boolean;
}

/**
 * 创建表单数据与行为适配器：
 * - `values` 为响应式 model(antd Form 的数据源)
 * - 其余方法桥接到 antd 的 FormInstance(挂载后通过 bindInstance 注入)
 *
 * 该对象实现 {@link FormActions}，从而让 FormApi / FormField / dependencies
 * 等既有逻辑无需感知底层从 vee-validate 切换为 a-form。
 */
export function createFormActions(
  initialValues: Record<string, any> = {},
): FormActions {
  const model = reactive<Record<string, any>>(cloneDeep(initialValues));
  const initialSnapshot = cloneDeep(initialValues);
  const errors = ref<Record<string, string[]>>({});
  const instance = shallowRef<FormInstance | null>(null);

  function normalizeErrorFields(errorFields: any[] = []) {
    const errs: Record<string, string[]> = {};
    for (const field of errorFields) {
      const key = Array.isArray(field.name)
        ? field.name.join('.')
        : String(field.name);
      errs[key] = field.errors ?? [];
    }
    return errs;
  }

  async function validate(): Promise<ValidateResult> {
    const inst = instance.value;
    if (!inst) {
      return { errors: {}, valid: true };
    }
    try {
      await inst.validate();
      errors.value = {};
      return { errors: {}, valid: true };
    } catch (error: any) {
      const errs = normalizeErrorFields(error?.errorFields);
      errors.value = errs;
      return { errors: errs, valid: Object.keys(errs).length === 0 };
    }
  }

  async function validateField(fieldName: string): Promise<ValidateResult> {
    const inst = instance.value;
    if (!inst) {
      return { errors: {}, valid: true };
    }
    try {
      await inst.validateFields([toAntdNamePath(fieldName) as any]);
      Reflect.deleteProperty(errors.value, fieldName);
      return { errors: {}, valid: true };
    } catch (error: any) {
      const errs = normalizeErrorFields(error?.errorFields);
      errors.value = { ...errors.value, ...errs };
      return { errors: errs, valid: Object.keys(errs).length === 0 };
    }
  }

  function setFieldValue(field: string, value: any, shouldValidate?: boolean) {
    set(model, field, value);
    if (shouldValidate) {
      validateField(field);
    }
  }

  function setValues(fields: Record<string, any>, shouldValidate?: boolean) {
    for (const key of Object.keys(fields)) {
      set(model, key, fields[key]);
    }
    if (shouldValidate) {
      validate();
    }
  }

  function clearValidate(name?: string) {
    const inst = instance.value;
    if (name) {
      inst?.clearValidate([toAntdNamePath(name) as any]);
      Reflect.deleteProperty(errors.value, name);
    } else {
      inst?.clearValidate();
      errors.value = {};
    }
  }

  function resetForm(state?: { values?: Record<string, any> }) {
    const next = state?.values ?? initialSnapshot;
    const cloned = cloneDeep(next);
    // 先清空已有键，再写入，避免遗留旧字段
    for (const key of Object.keys(model)) {
      if (!(key in cloned)) {
        Reflect.deleteProperty(model, key);
      }
    }
    for (const key of Object.keys(cloned)) {
      set(model, key, cloned[key]);
    }
    clearValidate();
  }

  function setFieldError(field: string, message?: string | string[]) {
    if (message === undefined || message === null) {
      Reflect.deleteProperty(errors.value, field);
      return;
    }
    errors.value = {
      ...errors.value,
      [field]: Array.isArray(message) ? message : [message],
    };
  }

  function isFieldValid(field: string) {
    return !errors.value[field] || errors.value[field].length === 0;
  }

  async function submitForm() {
    return await validate();
  }

  function handleSubmit(cb: (values: Record<string, any>) => void) {
    return async (e?: Event) => {
      e?.preventDefault?.();
      const { valid } = await validate();
      if (valid) {
        cb(cloneDeep(model));
      }
    };
  }

  function bindInstance(inst: any) {
    instance.value = (inst as FormInstance) ?? null;
  }

  return {
    bindInstance,
    clearValidate,
    errors,
    handleSubmit,
    instance,
    isFieldValid,
    // 挂载标记，FormApi.getForm 以此判断已挂载
    meta: { valid: true },
    resetForm,
    setFieldError,
    setFieldValue,
    setValues,
    submitForm,
    validate,
    validateField,
    get values() {
      return model;
    },
  } as FormActions;
}
