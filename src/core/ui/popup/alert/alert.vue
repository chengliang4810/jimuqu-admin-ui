<script lang="ts" setup>
import type { Component } from 'vue';

import type { AlertProps } from './alert';

import { computed, h, nextTick, ref } from 'vue';

import { useSimpleLocale } from '@/core/composables';
import {
  CircleAlert,
  CircleCheckBig,
  CircleHelp,
  CircleX,
  Info,
  X,
} from '@/core/icons';
import { usePreferences } from '@/core/preferences';
import { globalShareState } from '@/core/shared/global-state';
import { cn } from '@/utils';
import { Button, Modal, Spin } from 'antdv-next';

import RenderContent from '../render-content';
import { provideAlertContext } from './alert';

const props = withDefaults(defineProps<AlertProps>(), {
  bordered: true,
  buttonAlign: 'end',
  centered: true,
  escapeKeyClose: true,
});
const emits = defineEmits(['closed', 'confirm', 'opened']);
const { globalEscapeShortcutKey } = usePreferences();
const open = defineModel<boolean>('open', { default: false });
const { $t } = useSimpleLocale();
const components = globalShareState.getComponents();
const isConfirm = ref(false);

const DefaultButton = computed(() => components.DefaultButton || Button);
const PrimaryButton = computed(() => components.PrimaryButton || Button);

function onAlertClosed() {
  emits('closed', isConfirm.value);
  isConfirm.value = false;
}

const getIconRender = computed(() => {
  let iconRender: Component | null = null;
  if (props.icon) {
    if (typeof props.icon === 'string') {
      switch (props.icon) {
        case 'error': {
          iconRender = h(CircleX, {
            style: { color: 'var(--ant-color-error)' },
          });
          break;
        }
        case 'info': {
          iconRender = h(Info, { style: { color: 'var(--ant-color-info)' } });
          break;
        }
        case 'question': {
          iconRender = CircleHelp;
          break;
        }
        case 'success': {
          iconRender = h(CircleCheckBig, {
            style: { color: 'var(--ant-color-success)' },
          });
          break;
        }
        case 'warning': {
          iconRender = h(CircleAlert, {
            style: { color: 'var(--ant-color-warning)' },
          });
          break;
        }
        default: {
          iconRender = null;
          break;
        }
      }
    } else {
      iconRender = props.icon as Component;
    }
  }
  return iconRender;
});

function doCancel() {
  handleCancel();
  handleOpenChange(false);
}

function doConfirm() {
  handleConfirm();
  handleOpenChange(false);
}

provideAlertContext({
  doCancel,
  doConfirm,
});

function handleConfirm() {
  isConfirm.value = true;
  emits('confirm');
}

function handleCancel() {
  isConfirm.value = false;
}

const loading = ref(false);
async function handleOpenChange(val: boolean) {
  await nextTick();
  if (!val && props.beforeClose) {
    loading.value = true;
    try {
      const res = await props.beforeClose({ isConfirm: isConfirm.value });
      if (res !== false) {
        open.value = false;
      }
    } finally {
      loading.value = false;
    }
  } else {
    open.value = val;
  }
}
</script>

<template>
  <Modal
    :open="open"
    :centered="centered"
    :keyboard="escapeKeyClose || globalEscapeShortcutKey"
    :mask-closable="false"
    :closable="false"
    :footer="null"
    :width="520"
    :class="containerClass"
    wrap-class-name="vben-alert"
    @cancel="() => handleOpenChange(false)"
    :after-close="onAlertClosed"
    @opened="emits('opened')"
  >
    <div :class="cn('relative p-3', contentClass)">
      <div v-if="title" class="mb-2 flex items-center text-base font-semibold">
        <component :is="getIconRender" class="mr-2" />
        <span class="flex-auto">{{ $t(title) }}</span>
        <Button
          v-if="showCancel"
          type="text"
          size="small"
          class="flex-center rounded-full"
          :disabled="loading"
          @click="doCancel"
        >
          <X class="text-muted-foreground size-4" />
        </Button>
      </div>
      <div class="m-4 min-h-7.5">
        <RenderContent :content="content" render-br />
      </div>
      <Spin
        v-if="loading && contentMasking"
        :spinning="loading"
        class="absolute inset-0"
      />
      <div class="flex items-center gap-x-2" :class="`justify-${buttonAlign}`">
        <RenderContent :content="footer" />
        <component
          :is="DefaultButton"
          v-if="showCancel"
          :disabled="loading"
          @click="doCancel"
        >
          {{ cancelText || $t('cancel') }}
        </component>
        <component
          :is="PrimaryButton"
          type="primary"
          :loading="loading"
          @click="doConfirm"
        >
          {{ confirmText || $t('confirm') }}
        </component>
      </div>
    </div>
  </Modal>
</template>
