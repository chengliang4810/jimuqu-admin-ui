<script setup lang="ts">
import type { FormFieldProps, MaybeComponentProps } from '../types';

import {
  computed,
  nextTick,
  onUnmounted,
  ref,
  useTemplateRef,
  watch,
} from 'vue';

import { ChevronsDown, CircleAlert } from '@vben-core/icons';
import {
  cn,
  get,
  isFunction,
  isObject,
  isString,
  set,
} from '@vben-core/shared/utils';

import { Button, FormItem, Tooltip } from 'antdv-next';

import RenderContent from '../components/render-content';
import { toAntdNamePath } from '../create-form-actions';
import { injectComponentRefMap } from '../use-form-context';
import { injectRenderFormProps, useFormContext } from './context';
import useDependencies from './dependencies';
import FormLabel from './form-label.vue';
import { isEventObjectLike, isRequiredRule, normalizeRules } from './helper';

interface Props extends FormFieldProps {}

const {
  colon,
  commonComponentProps,
  component,
  componentProps,
  dependencies,
  description,
  disabled,
  disabledOnChangeListener,
  emptyStateValue,
  fieldName,
  formFieldProps,
  hide,
  label,
  labelClass,
  labelWidth,
  modelPropName,
  renderComponentContent,
  rules,
  help,
  collapsible,
  controlClass = '',
  wrapperClass = '',
  hideLabel,
  hideRequiredMark,
  suffix = undefined,
  defaultCollapsed = false,
} = defineProps<
  Props & {
    commonComponentProps: MaybeComponentProps;
    controlClass?: string;
    hideLabel?: boolean;
    hideRequiredMark?: boolean;
    suffix?: any;
    wrapperClass?: string;
  }
>();

const { componentBindEventMap, componentMap, isVertical } = useFormContext();
const formRenderProps = injectRenderFormProps();
const formApi = formRenderProps.form!;
const compact = computed(() => formRenderProps.compact);
const model = computed(() => formApi.values);
const values = model;
const fieldComponentRef = useTemplateRef<HTMLInputElement>('fieldComponentRef');
const collapseOpen = ref(!defaultCollapsed);

const fieldErrors = computed<string[]>(
  () => formApi.errors.value?.[fieldName] ?? [],
);
const isInValid = computed(() => fieldErrors.value.length > 0);

function getFormApi() {
  return formApi;
}

const FieldComponent = computed(() => {
  const finalComponent = isString(component)
    ? componentMap.value[component]
    : component;
  if (!finalComponent) {
    console.warn(`Component ${component} is not registered`);
  }
  return finalComponent;
});

const {
  dynamicComponentProps,
  dynamicRules,
  isDisabled,
  isIf,
  isRequired,
  isShow,
} = useDependencies(() => dependencies);

const labelStyle = computed(() => {
  return labelClass?.includes('w-') || isVertical.value
    ? {}
    : {
        width: `${labelWidth}px`,
      };
});

const currentRules = computed(() => {
  return dynamicRules.value ?? rules;
});

const visible = computed(() => {
  return !hide && isIf.value && isShow.value;
});

const labelText = computed(() => (isString(label) ? label : ''));

const shouldRequired = computed(() => {
  if (!visible.value) {
    return false;
  }
  if (isRequired.value) {
    return true;
  }
  return isRequiredRule(currentRules.value);
});

// antd FormItem 的 name 路径
const namePath = computed(() => toAntdNamePath(fieldName));

// 归一化后的 antd rules
const antdRules = computed(() => {
  if (!visible.value) {
    return undefined;
  }
  const normalized = normalizeRules(currentRules.value, labelText.value);
  return normalized.length > 0 ? normalized : undefined;
});

// 校验触发时机
const validateTrigger = computed(() => {
  const opts = (formFieldProps as Record<string, any>) || {};
  const triggers: string[] = [];
  if (opts.validateOnChange !== false) {
    triggers.push('change');
  }
  if (opts.validateOnBlur !== false) {
    triggers.push('blur');
  }
  return triggers.length > 0 ? triggers : ['change'];
});

const computedProps = computed(() => {
  const finalComponentProps = isFunction(componentProps)
    ? componentProps(values.value, getFormApi())
    : componentProps;

  return {
    ...commonComponentProps,
    ...finalComponentProps,
    ...dynamicComponentProps.value,
  };
});

const computedHelp = computed(() => {
  const helpContent = help;
  if (!helpContent) {
    return undefined;
  }
  return () =>
    isFunction(helpContent)
      ? helpContent(values.value, getFormApi())
      : helpContent;
});

watch(
  () => computedProps.value?.autofocus,
  (value) => {
    if (value === true) {
      nextTick(() => {
        autofocus();
      });
    }
  },
  { immediate: true },
);

const shouldDisabled = computed(() => {
  return isDisabled.value || disabled || computedProps.value?.disabled;
});

const customContentRender = computed(() => {
  if (!isFunction(renderComponentContent)) {
    return {};
  }
  return renderComponentContent(values.value, getFormApi());
});

const renderContentKey = computed(() => {
  return Object.keys(customContentRender.value);
});

// 字段值读写
function getFieldValue() {
  return get(model.value, fieldName);
}
function setFieldValue(value: any) {
  set(model.value, fieldName, value);
}

// 计算组件的 v-model 绑定字段名
const bindEventField = computed(() => {
  return (
    modelPropName ||
    (isString(component) ? componentBindEventMap.value?.[component] : null) ||
    null
  );
});

function buildFieldBind() {
  const field = bindEventField.value;
  const rawValue = getFieldValue();
  const value = rawValue === undefined ? emptyStateValue : rawValue;

  if (field) {
    return {
      [field]: value,
      [`onUpdate:${field}`]: (next: any) => {
        let nextValue = next;
        // 部分 antd 组件回调可能传递 event 对象
        if (next && isObject(next) && isEventObjectLike(next)) {
          nextValue = (next as any)?.target?.[field] ?? next;
        }
        setFieldValue(nextValue);
      },
    };
  }
  return {
    'onUpdate:modelValue': (next: any) => setFieldValue(next),
    modelValue: value,
  };
}

function createComponentProps() {
  const fieldBind = buildFieldBind();
  const binds: Record<string, any> = {
    ...computedProps.value,
    ...fieldBind,
  };
  // 保留用户显式定义的 onChange/onInput
  if (Reflect.has(computedProps.value, 'onChange')) {
    binds.onChange = computedProps.value.onChange;
  }
  if (Reflect.has(computedProps.value, 'onInput')) {
    binds.onInput = computedProps.value.onInput;
  }
  // 默认禁用 change/input 监听(避免与 update 双触发)
  if (disabledOnChangeListener && !Reflect.has(binds, 'onChange')) {
    binds.onChange = undefined;
  }
  return binds;
}

function autofocus() {
  if (
    fieldComponentRef.value &&
    isFunction(fieldComponentRef.value.focus) &&
    document.activeElement !== fieldComponentRef.value
  ) {
    fieldComponentRef.value?.focus?.();
  }
}

const shouldCollapsible = computed(() => collapsible);

function toggleCollapsed() {
  collapseOpen.value = !collapseOpen.value;
}

const componentRefMap = injectComponentRefMap();
watch(fieldComponentRef, (componentRef) => {
  componentRefMap?.set(fieldName, componentRef);
});
onUnmounted(() => {
  if (componentRefMap?.has(fieldName)) {
    componentRefMap.delete(fieldName);
  }
});
</script>

<template>
  <div
    v-if="!hide && isIf"
    v-show="isShow"
    :class="
      cn(
        'relative flex',
        {
          'form-valid-error': isInValid,
          'form-is-required': shouldRequired,
          'flex-col': isVertical,
          'flex-row items-start': !isVertical,
          // 'pb-4': !compact,
          'pb-4': compact,
        },
        $attrs.class as string,
      )
    "
  >
    <FormLabel
      v-if="!hideLabel"
      :class="
        cn(
          'flex leading-6',
          {
            'mr-2 min-h-8 shrink-0 items-center justify-end': !isVertical,
            'mb-1 flex-row': isVertical,
            'self-start': shouldCollapsible && !isVertical,
          },
          labelClass,
        )
      "
      :help="computedHelp"
      :colon="colon"
      :label="label"
      :required="shouldRequired && !hideRequiredMark"
      :style="labelStyle"
    >
      <template v-if="label">
        <RenderContent :content="label" />
      </template>
      <template #extra>
        <Button
          v-if="shouldCollapsible"
          class="ml-0.5"
          type="text"
          size="small"
          @click.prevent="toggleCollapsed"
        >
          <ChevronsDown
            :size="16"
            class="transition-transform"
            :class="{ 'rotate-180': !collapseOpen }"
          />
        </Button>
      </template>
    </FormLabel>

    <div class="flex-auto">
      <div :class="cn('relative flex w-full items-center', wrapperClass)">
        <FormItem
          :name="namePath"
          :rules="antdRules"
          :validate-trigger="validateTrigger"
          :colon="false"
          class="w-full [&_.ant-form-item-label]:hidden"
          :class="{
            'm-0! [&_.ant-form-item-explain]:hidden': compact,
          }"
        >
          <slot
            v-bind="{
              ...createComponentProps(),
              disabled: shouldDisabled,
              isInValid,
            }"
          >
            <component
              :is="FieldComponent"
              ref="fieldComponentRef"
              :class="
                cn(controlClass, {
                  'border-destructive hover:border-destructive focus:border-destructive':
                    isInValid,
                })
              "
              v-bind="createComponentProps()"
              :disabled="shouldDisabled"
            >
              <template
                v-for="name in renderContentKey"
                :key="name"
                #[name]="renderSlotProps"
              >
                <RenderContent
                  :content="customContentRender[name]"
                  v-bind="renderSlotProps"
                />
              </template>
            </component>
          </slot>
        </FormItem>

        <!-- 紧凑模式错误提示 -->
        <Tooltip v-if="compact && isInValid" placement="left">
          <template #title>
            {{ fieldErrors[0] }}
          </template>
          <slot name="trigger">
            <CircleAlert
              :class="
                cn(
                  'text-foreground/80 hover:text-foreground ml-1 inline-flex size-5 cursor-pointer',
                )
              "
            />
          </slot>
        </Tooltip>

        <!-- 自定义后缀 -->
        <div v-if="suffix" class="ml-1">
          <RenderContent :content="suffix" />
        </div>
      </div>

      <RenderContent
        v-if="description"
        class="text-muted-foreground mt-1 text-xs"
        :content="description"
      />
    </div>
  </div>
</template>
