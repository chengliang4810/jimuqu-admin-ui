<script lang="ts" setup>
import type { ExtendedModalApi, ModalProps } from './modal';

import { computed, nextTick, onDeactivated, provide, useId, watch } from 'vue';

import { ELEMENT_ID_MAIN_CONTENT } from '@/constants';
import { usePriorityValues, useSimpleLocale } from '@/core/composables';
import { globalShareState } from '@/core/shared/global-state';
import { cn } from '@/utils';
import { ExpandOutlined, FullscreenExitOutlined } from '@antdv-next/icons';
import { Button, Modal, Spin, Tooltip } from 'antdv-next';
import { merge } from 'lodash-es';

import { extractWidthFromClass } from '../extract-width';

interface Props extends ModalProps {
  modalApi?: ExtendedModalApi;
}

const props = withDefaults(defineProps<Props>(), {
  appendToMain: false,
  destroyOnClose: false,
  modalApi: undefined,
});

const components = globalShareState.getComponents();

const id = useId();
provide('DISMISSABLE_MODAL_ID', id);

const { $t } = useSimpleLocale();
const state = props.modalApi?.useStore?.();

const {
  appendToMain,
  cancelText,
  centered,
  class: modalClass,
  classes: modalClasses,
  closable,
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
  fullscreen,
  fullscreenButton,
  header,
  headerClass,
  loading: showLoading,
  modal,
  showCancelButton,
  showConfirmButton,
  style: modalStyle,
  styles: modalStyles,
  submitting,
  title,
  titleTooltip,
  width: propWidth,
  zIndex,
} = usePriorityValues(props, state);

const shouldFullscreen = computed(() => fullscreen.value);
const shouldCentered = computed(
  () => centered.value && !shouldFullscreen.value,
);

const wrapClass = `vben-modal-${id}`;
const modalStylesComputed = computed(() => {
  const selfStyles: ModalProps['styles'] = {
    container: {
      '--ant-modal-content-padding': '0',
    },
    header: {
      padding: '12px 16px',
      borderBottom: '1px solid var(--ant-color-border)',
      '--ant-modal-header-margin-bottom': '0',
    },
    footer: {
      padding: '8px',
      borderTop: '1px solid var(--ant-color-border)',
      '--ant-modal-footer-margin-top': '0',
    },
    close: {
      '--ant-padding': '12px',
    },
  };
  return merge({}, selfStyles, modalStyles.value ?? {});
});

const getContainer = computed(() => {
  if (!appendToMain.value) {
    return undefined;
  }
  return () =>
    (document.querySelector(
      `#${ELEMENT_ID_MAIN_CONTENT}>div:not(.absolute)>div`,
    ) as HTMLElement) ?? document.body;
});

const widthInfo = computed(() => extractWidthFromClass(modalClass.value));
const modalWidth = computed(() => {
  if (shouldFullscreen.value) return '100vw';
  if (propWidth.value != null) return propWidth.value;
  return widthInfo.value.width ?? 520;
});
const restClass = computed(() => widthInfo.value.rest);

const DefaultButton = computed(() => components.DefaultButton || Button);
const PrimaryButton = computed(() => components.PrimaryButton || Button);
const modalFooter = computed(() => (showFooter.value ? undefined : null));

// 在开启 keepAlive 情况下,直接通过浏览器按钮/手势等返回不会关闭弹窗
onDeactivated(() => {
  if (!appendToMain.value) {
    props.modalApi?.close();
  }
});

// onOpened 回调
watch(
  () => state?.value?.isOpen,
  (v) => {
    if (v) {
      nextTick(() => {
        requestAnimationFrame(() => {
          props.modalApi?.onOpened();
        });
      });
    }
  },
);

function handleFullscreen() {
  props.modalApi?.setState((prev) => ({
    ...prev,
    fullscreen: !fullscreen.value,
  }));
}

function handleCancel() {
  if (submitting.value) {
    return;
  }
  props.modalApi?.close();
}

function handleClosed() {
  props.modalApi?.onClosed();
}
</script>

<template>
  <Modal
    :open="state?.isOpen"
    :centered="shouldCentered"
    :closable="closable"
    :mask="modal"
    :mask-closable="closeOnClickModal && !submitting"
    :keyboard="closeOnPressEscape && !submitting"
    :z-index="zIndex"
    :width="modalWidth"
    :get-container="getContainer"
    :destroy-on-hidden="destroyOnClose"
    :wrap-class-name="
      cn('vben-modal', wrapClass, { 'vben-modal-fullscreen': shouldFullscreen })
    "
    :class="restClass"
    :classes="modalClasses"
    :style="modalStyle"
    :styles="modalStylesComputed"
    :footer="modalFooter"
    @cancel="handleCancel"
    :after-close="handleClosed"
  >
    <template v-if="header" #title>
      <div :class="cn('flex items-center pr-6', headerClass)">
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
        <span class="flex-1"></span>
        <span v-if="description" class="text-muted-foreground text-xs">
          <slot name="description">{{ description }}</slot>
        </span>
        <Button
          v-if="fullscreenButton"
          type="text"
          size="small"
          class="flex-center ml-3 size-6 rounded-full"
          @click="handleFullscreen"
        >
          <FullscreenExitOutlined v-if="fullscreen" class="size-3.5" />
          <ExpandOutlined v-else class="size-3.5" />
        </Button>
      </div>
    </template>

    <Spin :spinning="!!(showLoading || submitting)">
      <div
        :class="
          cn('relative min-h-40 overflow-y-auto p-3', contentClass, {
            'pointer-events-none': showLoading || submitting,
          })
        "
      >
        <slot></slot>
      </div>
    </Spin>

    <template v-if="showFooter" #footer>
      <div
        :class="cn('flex flex-row items-center justify-end gap-2', footerClass)"
      >
        <slot name="prepend-footer"></slot>
        <slot name="footer">
          <component
            :is="DefaultButton"
            v-if="showCancelButton"
            :disabled="submitting"
            @click="() => modalApi?.onCancel()"
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
            @click="() => modalApi?.onConfirm()"
          >
            <slot name="confirmText">{{ confirmText || $t('confirm') }}</slot>
          </component>
        </slot>
        <slot name="append-footer"></slot>
      </div>
    </template>
  </Modal>
</template>

<style>
.vben-modal .ant-modal-body {
  padding: 0;
}

.vben-modal-fullscreen .ant-modal {
  --ant-border-radius-lg: 0;

  top: 0;
  max-width: 100vw;
  padding-bottom: 0;
  margin: 0;
}

.vben-modal-fullscreen .ant-modal-content {
  display: flex;
  flex-direction: column;
  height: 100vh;
  border-radius: 0;
}

.vben-modal-fullscreen .ant-modal-body {
  flex: 1;
  overflow: auto;
}
</style>
