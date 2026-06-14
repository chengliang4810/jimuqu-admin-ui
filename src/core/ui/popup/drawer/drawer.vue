<script lang="ts" setup>
import type { DrawerProps, ExtendedDrawerApi } from './drawer';

import { computed, onDeactivated, provide, useId } from 'vue';

import { usePriorityValues, useSimpleLocale } from '@/core/composables';
import { X } from '@/core/icons';
import { ELEMENT_ID_MAIN_CONTENT } from '@/core/shared/constants';
import { globalShareState } from '@/core/shared/global-state';
import { cn } from '@/core/shared/utils';

import { Button, Drawer, Spin, Tooltip } from 'antdv-next';

import { extractWidthFromClass } from '../extract-width';

interface Props extends DrawerProps {
  drawerApi?: ExtendedDrawerApi;
}

const props = withDefaults(defineProps<Props>(), {
  appendToMain: false,
  closeIconPlacement: 'right',
  destroyOnClose: false,
  drawerApi: undefined,
  submitting: false,
  zIndex: 1000,
});

const components = globalShareState.getComponents();

const id = useId();
provide('DISMISSABLE_DRAWER_ID', id);

const { $t } = useSimpleLocale();

const state = props.drawerApi?.useStore?.();

const {
  appendToMain,
  cancelText,
  class: drawerClass,
  classes: drawerClasses,
  closable,
  closeIconPlacement,
  closeOnClickModal,
  closeOnPressEscape,
  confirmDisabled,
  confirmLoading,
  confirmText,
  contentClass,
  description,
  destroyOnClose,
  footer: showFooter,
  footerClass,
  header: showHeader,
  headerClass,
  loading: showLoading,
  modal,
  placement,
  showCancelButton,
  showConfirmButton,
  style: drawerStyle,
  styles: drawerStyles,
  submitting,
  title,
  titleTooltip,
  width: propWidth,
  zIndex,
} = usePriorityValues(props, state);

const isHorizontal = computed(
  () => placement.value === 'left' || placement.value === 'right',
);

const widthInfo = computed(() => extractWidthFromClass(drawerClass.value));
const restClass = computed(() => widthInfo.value.rest);
const drawerWidth = computed(() => {
  if (!isHorizontal.value) return undefined;
  if (propWidth.value != null) return propWidth.value;
  return widthInfo.value.width ?? 520;
});
const drawerHeight = computed(() =>
  isHorizontal.value ? undefined : (widthInfo.value.width ?? undefined),
);

const getContainer = computed(() => {
  if (!appendToMain.value) {
    return undefined;
  }
  return () =>
    (document.querySelector(
      `#${ELEMENT_ID_MAIN_CONTENT}>div:not(.absolute)>div`,
    ) as HTMLElement) ?? document.body;
});

const DefaultButton = computed(() => components.DefaultButton || Button);
const PrimaryButton = computed(() => components.PrimaryButton || Button);

onDeactivated(() => {
  if (!appendToMain.value) {
    props.drawerApi?.close();
  }
});

function handleClose() {
  if (submitting.value) {
    return;
  }
  props.drawerApi?.close();
}

function onAfterOpenChange(open: boolean) {
  if (open) {
    props.drawerApi?.onOpened();
  } else {
    props.drawerApi?.onClosed();
  }
}
</script>

<template>
  <Drawer
    :open="state?.isOpen"
    :placement="placement"
    :width="drawerWidth"
    :height="drawerHeight"
    :mask="modal"
    :mask-closable="closeOnClickModal && !submitting"
    :keyboard="closeOnPressEscape && !submitting"
    :z-index="zIndex"
    :get-container="getContainer"
    :destroy-on-close="destroyOnClose"
    :closable="false"
    :class="restClass"
    :classes="drawerClasses"
    :style="drawerStyle"
    :styles="drawerStyles"
    root-class-name="vben-drawer"
    @close="handleClose"
    :after-open-change="onAfterOpenChange"
  >
    <template v-if="showHeader" #title>
      <div :class="cn('flex w-full items-center', headerClass)">
        <Button
          v-if="closable && closeIconPlacement === 'left'"
          type="text"
          size="small"
          class="flex-center mr-2 size-6 rounded-full"
          :disabled="submitting"
          @click="handleClose"
        >
          <slot name="close-icon"><X class="size-4" /></slot>
        </Button>
        <span class="flex-1">
          <slot name="title">
            {{ title }}
            <Tooltip v-if="titleTooltip">
              <template #title>{{ titleTooltip }}</template>
              <span
                class="text-muted-foreground ml-1 inline-flex size-3.5 cursor-help items-center justify-center rounded-full border text-[10px] leading-none"
              >
                ?
              </span>
            </Tooltip>
          </slot>
          <span
            v-if="description"
            class="text-muted-foreground mt-1 block text-xs font-normal"
          >
            <slot name="description">{{ description }}</slot>
          </span>
        </span>
      </div>
    </template>

    <template v-if="showHeader" #extra>
      <div class="flex-center">
        <slot name="extra"></slot>
        <Button
          v-if="closable && closeIconPlacement === 'right'"
          type="text"
          size="small"
          class="flex-center ml-0.5 size-6 rounded-full"
          :disabled="submitting"
          @click="handleClose"
        >
          <slot name="close-icon"><X class="size-4" /></slot>
        </Button>
      </div>
    </template>

    <Spin :spinning="!!(showLoading || submitting)" wrapper-class-name="h-full">
      <div
        :class="
          cn('relative h-full overflow-y-auto', contentClass, {
            'pointer-events-none': showLoading || submitting,
          })
        "
      >
        <slot></slot>
      </div>
    </Spin>

    <template v-if="showFooter" #footer>
      <div
        :class="
          cn('flex w-full flex-row items-center justify-end gap-2', footerClass)
        "
      >
        <slot name="prepend-footer"></slot>
        <slot name="footer">
          <component
            :is="DefaultButton"
            v-if="showCancelButton"
            :disabled="submitting"
            @click="() => drawerApi?.onCancel()"
          >
            <slot name="cancelText">{{ cancelText || $t('cancel') }}</slot>
          </component>
          <slot name="center-footer"></slot>
          <component
            :is="PrimaryButton"
            v-if="showConfirmButton"
            type="primary"
            :disabled="confirmDisabled"
            :loading="confirmLoading || submitting"
            @click="() => drawerApi?.onConfirm()"
          >
            <slot name="confirmText">{{ confirmText || $t('confirm') }}</slot>
          </component>
        </slot>
        <slot name="append-footer"></slot>
      </div>
    </template>
  </Drawer>
</template>

<style>
.vben-drawer .ant-drawer-body {
  padding: 12px;
}
</style>
