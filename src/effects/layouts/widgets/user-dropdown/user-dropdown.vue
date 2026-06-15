<script setup lang="ts">
import type { AnyFunction } from '@/types';

import type { Component } from 'vue';

import { computed, ref, useTemplateRef } from 'vue';

import { preferences, usePreferences } from '@/core/preferences';
import { VbenAvatar, VbenIcon } from '@/core/ui/adapter';
import { useVbenModal } from '@/core/ui/popup';
import { LockKeyhole, LogOut, Settings } from '@/icons-app';
import { $t } from '@/locales';
import { useAccessStore } from '@/stores';
import { isWindowsOs } from '@/utils';
import { useMagicKeys, whenever } from '@vueuse/core';
import { Badge, Dropdown } from 'antdv-next';

import { LockScreenModal } from '../lock-screen';
import { Preferences } from '../preferences';

interface Props {
  /**
   * 头像
   */
  avatar?: string;
  /**
   * @zh_CN 描述
   */
  description?: string;
  /**
   * 是否启用快捷键
   */
  enableShortcutKey?: boolean;
  /**
   * 菜单数组
   */
  menus?: Array<{
    handler: AnyFunction;
    icon?: Component | Function | string;
    text: string;
  }>;

  /**
   * 标签文本
   */
  tagText?: string;
  /**
   * 文本
   */
  text?: string;
  /** 触发方式 */
  trigger?: 'both' | 'click' | 'hover';
  /** hover触发时，延迟响应的时间 */
  hoverDelay?: number;
}

defineOptions({
  name: 'UserDropdown',
});

const props = withDefaults(defineProps<Props>(), {
  avatar: '',
  description: '',
  enableShortcutKey: true,
  menus: () => [],
  showShortcutKey: true,
  tagText: '',
  text: '',
  trigger: 'click',
  hoverDelay: 500,
});

const emit = defineEmits<{ clearPreferencesAndLogout: []; logout: [] }>();

const {
  globalLockScreenShortcutKey,
  globalLogoutShortcutKey,
  preferencesButtonPosition,
} = usePreferences();
const accessStore = useAccessStore();
const [LockModal, lockModalApi] = useVbenModal({
  connectedComponent: LockScreenModal,
});

const refPreferences = useTemplateRef('refPreferences');
const openPopover = ref(false);

// 触发方式 → antd Dropdown trigger
const dropdownTrigger = computed<('click' | 'hover')[]>(() => {
  switch (props.trigger) {
    case 'both': {
      return ['click', 'hover'];
    }
    case 'hover': {
      return ['hover'];
    }
    default: {
      return ['click'];
    }
  }
});

const altView = computed(() => (isWindowsOs() ? 'Alt' : '⌥'));

const enableLogoutShortcutKey = computed(() => {
  return props.enableShortcutKey && globalLogoutShortcutKey.value;
});

const enableLockScreenShortcutKey = computed(() => {
  return props.enableShortcutKey && globalLockScreenShortcutKey.value;
});

const enableShortcutKey = computed(() => {
  return props.enableShortcutKey;
});

function handleOpenLock() {
  lockModalApi.open();
}

function handleSubmitLock(lockScreenPassword: string) {
  lockModalApi.close();
  accessStore.lockScreen(lockScreenPassword);
}

function handleLogout() {
  openPopover.value = false;
  window.modal.confirm({
    title: $t('common.prompt'),
    content: $t('ui.widgets.logoutTip'),
    centered: true,
    cancelText: $t('common.cancel'),
    okText: $t('common.confirm'),
    onOk: () => {
      emit('logout');
    },
  });
}

// 设置 - 打开偏好设置抽屉
function handleOpenSettings() {
  refPreferences.value?.open();
}

if (enableShortcutKey.value) {
  const keys = useMagicKeys();
  const logoutKey = keys['Alt+KeyQ'];
  const lockKey = keys['Alt+KeyL'];

  if (logoutKey) {
    whenever(logoutKey, () => {
      if (enableLogoutShortcutKey.value) {
        handleLogout();
      }
    });
  }

  if (lockKey) {
    whenever(lockKey, () => {
      if (enableLockScreenShortcutKey.value) {
        handleOpenLock();
      }
    });
  }
}
</script>

<template>
  <LockModal
    v-if="preferences.widget.lockScreen"
    :avatar="avatar"
    :text="text"
    @submit="handleSubmitLock"
  />

  <Preferences
    v-if="preferencesButtonPosition.userDropdown"
    ref="refPreferences"
    :show-button="false"
    @clear-preferences-and-logout="emit('clearPreferencesAndLogout')"
  />

  <Dropdown
    :open="openPopover"
    :trigger="dropdownTrigger"
    placement="bottomRight"
    @open-change="(v: boolean) => (openPopover = v)"
  >
    <div class="hover:bg-accent mr-2 ml-1 cursor-pointer rounded-full p-1.5">
      <div class="flex-center hover:text-accent-foreground">
        <VbenAvatar :alt="text" :src="avatar" class="size-8" dot />
      </div>
    </div>
    <template #popupRender>
      <div
        class="bg-popover text-popover-foreground min-w-60 rounded-md p-0 pb-1 shadow-md"
      >
        <div class="flex items-center p-3">
          <VbenAvatar
            :alt="text"
            :src="avatar"
            class="size-12"
            dot
            dot-class="bottom-0 right-1 border-2 size-4 bg-green-500"
          />
          <div class="ml-2 w-full">
            <div
              v-if="tagText || text || $slots.tagText"
              class="text-foreground mb-1 flex items-center text-sm font-medium"
            >
              <div
                class="max-w-[100px] overflow-hidden break-keep text-ellipsis"
                :title="text"
              >
                {{ text }}
              </div>
              <slot name="tagText">
                <Badge v-if="tagText" class="ml-2 text-green-400">
                  <div
                    class="max-w-[50px] overflow-hidden text-ellipsis"
                    :title="tagText"
                  >
                    {{ tagText }}
                  </div>
                </Badge>
              </slot>
            </div>
            <div class="text-muted-foreground text-xs font-normal">
              {{ description }}
            </div>
          </div>
        </div>
        <div v-if="menus?.length" class="border-border my-1 border-t"></div>
        <div
          v-for="menu in menus"
          :key="menu.text"
          class="hover:bg-accent mx-1 flex cursor-pointer items-center rounded-sm px-2 py-1 leading-8"
          @click="menu.handler"
        >
          <VbenIcon :icon="menu.icon" class="mr-2 size-4" />
          {{ menu.text }}
        </div>
        <div class="border-border my-1 border-t"></div>
        <div
          v-if="preferencesButtonPosition.userDropdown"
          class="hover:bg-accent mx-1 flex cursor-pointer items-center rounded-sm px-2 py-1 leading-8"
          @click="handleOpenSettings"
        >
          <Settings class="mr-2 size-4" />
          {{ $t('preferences.title') }}
        </div>
        <div
          v-if="preferences.widget.lockScreen"
          class="hover:bg-accent mx-1 flex cursor-pointer items-center rounded-sm px-2 py-1 leading-8"
          @click="handleOpenLock"
        >
          <LockKeyhole class="mr-2 size-4" />
          {{ $t('ui.widgets.lockScreen.title') }}
          <span
            v-if="enableLockScreenShortcutKey"
            class="ml-auto text-xs opacity-60"
          >
            {{ altView }} L
          </span>
        </div>
        <div
          v-if="preferences.widget.lockScreen"
          class="border-border my-1 border-t"
        ></div>
        <div
          class="hover:bg-accent mx-1 flex cursor-pointer items-center rounded-sm px-2 py-1 leading-8"
          @click="handleLogout"
        >
          <LogOut class="mr-2 size-4" />
          {{ $t('common.logout') }}
          <span
            v-if="enableLogoutShortcutKey"
            class="ml-auto text-xs opacity-60"
          >
            {{ altView }} Q
          </span>
        </div>
      </div>
    </template>
  </Dropdown>
</template>
