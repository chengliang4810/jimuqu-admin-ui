<script lang="ts" setup>
import type { CSSProperties } from 'vue';

import { computed, watch } from 'vue';
import { useRouter } from 'vue-router';

import { VBEN_DOC_URL, VBEN_GITHUB_URL } from '@/constants';
import { preferences, usePreferences } from '@/core/preferences';
import { useWatermark } from '@/effects/hooks';
import {
  BasicLayout,
  LockScreen,
  Notification,
  UserDropdown,
} from '@/effects/layouts';
import { BookOpenText, CircleHelp, GiteeIcon } from '@/icons-app';
import { $t } from '@/locales';
import { resetRoutes } from '@/router';
import { useAuthStore, useUserStore } from '@/stores';
import { openWindow } from '@/utils';
import { useVersionUpdate } from '@/utils/check-update';
import { GithubOutlined, UserOutlined } from '@antdv-next/icons';
import { Badge, Watermark } from 'antdv-next';

import { useNotification } from './hooks/notification';

const userStore = useUserStore();
const authStore = useAuthStore();
const router = useRouter();
const { destroyWatermark, updateWatermark, watermark } = useWatermark();
const { isDark } = usePreferences();

const watermarkStyle: CSSProperties = {
  height: '100vh',
  inset: 0,
  pointerEvents: 'none',
  position: 'fixed',
  width: '100vw',
  zIndex: 999,
};

const menus = computed(() => {
  const defaultMenus = [
    {
      handler: () => {
        openWindow(VBEN_DOC_URL, {
          target: '_blank',
        });
      },
      icon: BookOpenText,
      text: $t('ui.widgets.document'),
    },
    {
      handler: () => {
        router.push('/profile');
      },
      icon: UserOutlined,
      text: $t('ui.widgets.profile'),
    },
    {
      handler: () => {
        openWindow('https://gitee.com/dapppp/ruoyi-plus-vben5', {
          target: '_blank',
        });
      },
      icon: GiteeIcon,
      iconClass: 'text-red-800',
      text: 'Gitee项目地址',
    },
    {
      handler: () => {
        openWindow(VBEN_GITHUB_URL, {
          target: '_blank',
        });
      },
      icon: GithubOutlined,
      text: 'Vben官方地址',
    },
    {
      handler: () => {
        openWindow(`${VBEN_GITHUB_URL}/issues`, {
          target: '_blank',
        });
      },
      icon: CircleHelp,
      text: $t('ui.widgets.qa'),
    },
  ];
  return defaultMenus;
});

const avatar = computed(() => {
  return userStore.userInfo?.avatar || preferences.app.defaultAvatar;
});

async function handleLogout() {
  /**
   * 主动登出不需要带跳转地址
   */
  await authStore.logout(false);
  resetRoutes();
}

const {
  notifyStore,
  notificationTabList,
  currentTab,
  handleViewAll,
  handleNotificationClick,
  isPreviewOpen,
  NoticePreviewModal,
} = useNotification();

watch(
  () => ({
    enable: preferences.app.watermark,
    content: preferences.app.watermarkContent,
    isDark: isDark.value,
  }),
  async ({ enable, content }) => {
    if (enable) {
      await updateWatermark({
        content:
          content ||
          `${userStore.userInfo?.username} - ${userStore.userInfo?.realName}`,
      });
    } else {
      destroyWatermark();
    }
  },
  {
    immediate: true,
  },
);
// 检测版本更新
useVersionUpdate();
</script>

<template>
  <BasicLayout @clear-preferences-and-logout="handleLogout">
    <template #user-dropdown>
      <UserDropdown
        :avatar
        :menus
        :text="userStore.userInfo?.realName"
        :description="userStore.userInfo?.email || '未设置邮箱'"
        :tag-text="userStore.userInfo?.username"
        @logout="handleLogout"
        @clear-preferences-and-logout="handleLogout"
      />
    </template>
    <template #notification>
      <Badge
        :count="notifyStore.unreadNotifications.length"
        :offset="[-5, 6]"
        size="small"
      >
        <Notification
          :dot="false"
          :keep-open="isPreviewOpen"
          :notifications="notifyStore.notificationList"
          :tab-list="notificationTabList"
          v-model:current-tab="currentTab"
          @click="handleNotificationClick"
          @clear="notifyStore.clearAllMessage"
          @make-all="notifyStore.setAllRead"
          @read="notifyStore.setRead"
          @view-all="handleViewAll"
          @remove="notifyStore.removeMessage"
        />
      </Badge>

      <NoticePreviewModal />
    </template>
    <template #lock-screen>
      <LockScreen :avatar @to-login="handleLogout" />
    </template>
  </BasicLayout>
  <Watermark
    v-if="watermark.visible"
    v-bind="watermark.props"
    :style="watermarkStyle"
  />
</template>
