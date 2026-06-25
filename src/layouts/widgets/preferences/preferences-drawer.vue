<script setup lang="ts">
import type { CustomPreferencesRecord } from '@/core/preferences';
import type { SegmentedItem } from '@/core/ui/adapter';
import type { SupportedLanguagesType } from '@/locales';
import type {
  ContentCompactType,
  LayoutHeaderModeType,
  LayoutType,
  PreferencesButtonPositionType,
  ThemeModeType,
} from '@/types';

import { computed, ref } from 'vue';

import {
  clearCache,
  preferences,
  resetPreferences,
  updateCustomPreferences,
  usePreferences,
} from '@/core/preferences';
import { VbenButton, VbenIconButton, VbenSegmented } from '@/core/ui/adapter';
import { useVbenDrawer } from '@/core/ui/popup';
import { Pin, PinOff, RotateCw } from '@/icons';
import { $t, loadLocaleMessages } from '@/locales';

import {
  Animation,
  Block,
  Breadcrumb,
  ColorMode,
  Content,
  Custom,
  General,
  Header,
  Layout,
  Navigation,
  Sidebar,
  Tabbar,
  Theme,
  ThemeColor,
  Widget,
} from './blocks';

const emit = defineEmits<{ clearPreferencesAndLogout: [] }>();

const appLocale = defineModel<SupportedLanguagesType>('appLocale');
const appDynamicTitle = defineModel<boolean>('appDynamicTitle');
const appLayout = defineModel<LayoutType>('appLayout');
const appColorGrayMode = defineModel<boolean>('appColorGrayMode');
const appColorWeakMode = defineModel<boolean>('appColorWeakMode');
const appContentCompact = defineModel<ContentCompactType>('appContentCompact');
const appWatermark = defineModel<boolean>('appWatermark');
const appWatermarkContent = defineModel<string>('appWatermarkContent');
const appEnableCheckUpdates = defineModel<boolean>('appEnableCheckUpdates');
const appEnableStickyPreferencesNavigationBar = defineModel<boolean>(
  'appEnableStickyPreferencesNavigationBar',
);
const appPreferencesButtonPosition = defineModel<PreferencesButtonPositionType>(
  'appPreferencesButtonPosition',
);

const transitionProgress = defineModel<boolean>('transitionProgress');
const transitionName = defineModel<string>('transitionName');
const transitionLoading = defineModel<boolean>('transitionLoading');
const transitionEnable = defineModel<boolean>('transitionEnable');

const themeColorError = defineModel<string>('themeColorError');
const themeColorPrimary = defineModel<string>('themeColorPrimary');
const themeColorSuccess = defineModel<string>('themeColorSuccess');
const themeColorWarning = defineModel<string>('themeColorWarning');
const themeMode = defineModel<ThemeModeType>('themeMode');
const themeSemiDarkSidebar = defineModel<boolean>('themeSemiDarkSidebar');
const themeSemiDarkSidebarSub = defineModel<boolean>('themeSemiDarkSidebarSub');

const sidebarEnable = defineModel<boolean>('sidebarEnable');
const sidebarWidth = defineModel<number>('sidebarWidth');
const sidebarCollapsed = defineModel<boolean>('sidebarCollapsed');
const sidebarAutoActivateChild = defineModel<boolean>(
  'sidebarAutoActivateChild',
);
const sidebarExpandOnHover = defineModel<boolean>('sidebarExpandOnHover');
const sidebarCollapsedButton = defineModel<boolean>('sidebarCollapsedButton');
const sidebarFixedButton = defineModel<boolean>('sidebarFixedButton');
const headerEnable = defineModel<boolean>('headerEnable');
const headerMode = defineModel<LayoutHeaderModeType>('headerMode');

const breadcrumbEnable = defineModel<boolean>('breadcrumbEnable');
const breadcrumbShowIcon = defineModel<boolean>('breadcrumbShowIcon');
const breadcrumbShowHome = defineModel<boolean>('breadcrumbShowHome');
const breadcrumbHideOnlyOne = defineModel<boolean>('breadcrumbHideOnlyOne');

const tabbarEnable = defineModel<boolean>('tabbarEnable');
const tabbarShowIcon = defineModel<boolean>('tabbarShowIcon');
const tabbarShowMore = defineModel<boolean>('tabbarShowMore');
const tabbarShowMaximize = defineModel<boolean>('tabbarShowMaximize');
const tabbarPersist = defineModel<boolean>('tabbarPersist');
const tabbarVisitHistory = defineModel<boolean>('tabbarVisitHistory');
const tabbarDraggable = defineModel<boolean>('tabbarDraggable');
const tabbarWheelable = defineModel<boolean>('tabbarWheelable');
const tabbarStyleType = defineModel<string>('tabbarStyleType');
const tabbarMaxCount = defineModel<number>('tabbarMaxCount');
const tabbarMiddleClickToClose = defineModel<boolean>(
  'tabbarMiddleClickToClose',
);

const navigationSplit = defineModel<boolean>('navigationSplit');
const navigationAccordion = defineModel<boolean>('navigationAccordion');

// const logoVisible = defineModel<boolean>('logoVisible');

const widgetGlobalSearch = defineModel<boolean>('widgetGlobalSearch');
const widgetFullscreen = defineModel<boolean>('widgetFullscreen');
const widgetLanguageToggle = defineModel<boolean>('widgetLanguageToggle');
const widgetNotification = defineModel<boolean>('widgetNotification');
const widgetThemeToggle = defineModel<boolean>('widgetThemeToggle');
const widgetSidebarToggle = defineModel<boolean>('widgetSidebarToggle');
const widgetLockScreen = defineModel<boolean>('widgetLockScreen');
const widgetRefresh = defineModel<boolean>('widgetRefresh');
const {
  customPreferences,
  diffCustomPreference,
  diffPreference,
  isFullContent,
  isHeaderNav,
  isHeaderSidebarNav,
  isMixedNav,
  preferencesExtension,
  isSideMixedNav,
  isSideMode,
  isSideNav,
} = usePreferences();

const [Drawer] = useVbenDrawer();

const activeTab = ref('appearance');

const customPreferencesTab = computed(() => {
  return preferencesExtension.value;
});

const customTabLabel = computed(() => {
  return customPreferencesTab.value?.tabLabel
    ? $t(customPreferencesTab.value.tabLabel)
    : '';
});

const customTabTitle = computed(() => {
  const title =
    customPreferencesTab.value?.title || customPreferencesTab.value?.tabLabel;
  return title ? $t(title) : '';
});

const mergedDiffPreference = computed(() => {
  const result: Record<string, unknown> = {};

  if (diffPreference.value) {
    Object.assign(result, diffPreference.value);
  }

  if (diffCustomPreference.value) {
    result.custom = diffCustomPreference.value;
  }

  return Object.keys(result).length > 0 ? result : undefined;
});

const showCustomTab = computed(() => {
  return (customPreferencesTab.value?.fields.length ?? 0) > 0;
});

const tabs = computed((): SegmentedItem[] => {
  const items: SegmentedItem[] = [
    {
      label: $t('preferences.appearance'),
      value: 'appearance',
    },
    {
      label: $t('preferences.layout'),
      value: 'layout',
    },
    {
      label: $t('preferences.general'),
      value: 'general',
    },
  ];

  if (showCustomTab.value) {
    items.push({
      label: customTabLabel.value,
      value: 'custom',
    });
  }

  return items;
});

const showBreadcrumbConfig = computed(() => {
  return (
    !isFullContent.value &&
    !isMixedNav.value &&
    !isHeaderNav.value &&
    preferences.header.enable
  );
});

async function handleClearCache() {
  await resetPreferences();
  await clearCache();
  emit('clearPreferencesAndLogout');
}

async function handleReset() {
  if (!mergedDiffPreference.value) {
    return;
  }
  await resetPreferences();
  await loadLocaleMessages(preferences.app.locale);
}

function handleCustomPreferencesUpdate(updates: CustomPreferencesRecord) {
  updateCustomPreferences(updates);
}
</script>

<template>
  <div>
    <Drawer
      content-class="overflow-x-hidden px-1"
      :description="$t('preferences.subtitle')"
      :title="$t('preferences.title')"
      :size="390"
    >
      <template #extra>
        <div class="flex items-center">
          <VbenIconButton
            :disabled="!mergedDiffPreference"
            :tooltip="$t('preferences.resetTip')"
            class="relative"
            @click="handleReset"
          >
            <span
              v-if="mergedDiffPreference"
              class="bg-primary absolute top-0.5 right-0.5 size-2 rounded-sm"
            ></span>
            <RotateCw class="size-4" />
          </VbenIconButton>
          <VbenIconButton
            :tooltip="
              appEnableStickyPreferencesNavigationBar
                ? $t('preferences.disableStickyPreferencesNavigationBar')
                : $t('preferences.enableStickyPreferencesNavigationBar')
            "
            class="relative"
            @click="
              () =>
                (appEnableStickyPreferencesNavigationBar =
                  !appEnableStickyPreferencesNavigationBar)
            "
          >
            <PinOff
              v-if="appEnableStickyPreferencesNavigationBar"
              class="size-4"
            />
            <Pin v-else class="size-4" />
          </VbenIconButton>
        </div>
      </template>

      <div>
        <VbenSegmented
          v-model="activeTab"
          :tabs="tabs"
          :class="{
            'sticky-tabs-header': appEnableStickyPreferencesNavigationBar,
          }"
        >
          <template #general>
            <Block :title="$t('preferences.general')">
              <General
                v-model:app-dynamic-title="appDynamicTitle"
                v-model:app-enable-check-updates="appEnableCheckUpdates"
                v-model:app-locale="appLocale"
                v-model:app-watermark="appWatermark"
                v-model:app-watermark-content="appWatermarkContent"
              />
            </Block>

            <Block :title="$t('preferences.animation.title')">
              <Animation
                v-model:transition-enable="transitionEnable"
                v-model:transition-loading="transitionLoading"
                v-model:transition-name="transitionName"
                v-model:transition-progress="transitionProgress"
              />
            </Block>
          </template>
          <template #appearance>
            <Block :title="$t('preferences.theme.title')">
              <Theme
                v-model="themeMode"
                v-model:theme-semi-dark-sidebar="themeSemiDarkSidebar"
                v-model:theme-semi-dark-sidebar-sub="themeSemiDarkSidebarSub"
              />
            </Block>
            <Block :title="$t('preferences.theme.colorTitle')">
              <ThemeColor
                v-model="themeColorPrimary"
                :label="$t('preferences.theme.colorPrimary')"
              />
              <ThemeColor
                v-model="themeColorSuccess"
                :label="$t('preferences.theme.colorSuccess')"
              />
              <ThemeColor
                v-model="themeColorWarning"
                :label="$t('preferences.theme.colorWarning')"
              />
              <ThemeColor
                v-model="themeColorError"
                :label="$t('preferences.theme.colorError')"
              />
            </Block>
            <Block :title="$t('preferences.other')">
              <ColorMode
                v-model:app-color-gray-mode="appColorGrayMode"
                v-model:app-color-weak-mode="appColorWeakMode"
              />
            </Block>
          </template>
          <template #layout>
            <Block :title="$t('preferences.layout')">
              <Layout v-model="appLayout" />
            </Block>
            <Block :title="$t('preferences.content')">
              <Content v-model="appContentCompact" />
            </Block>

            <Block :title="$t('preferences.sidebar.title')">
              <Sidebar
                v-model:sidebar-auto-activate-child="sidebarAutoActivateChild"
                v-model:sidebar-collapsed="sidebarCollapsed"
                v-model:sidebar-enable="sidebarEnable"
                v-model:sidebar-expand-on-hover="sidebarExpandOnHover"
                v-model:sidebar-width="sidebarWidth"
                v-model:sidebar-collapsed-button="sidebarCollapsedButton"
                v-model:sidebar-fixed-button="sidebarFixedButton"
                :current-layout="appLayout"
                :disabled="!isSideMode"
              />
            </Block>

            <Block :title="$t('preferences.header.title')">
              <Header
                v-model:header-enable="headerEnable"
                v-model:header-mode="headerMode"
                :disabled="isFullContent"
              />
            </Block>

            <Block :title="$t('preferences.navigationMenu.title')">
              <Navigation
                v-model:navigation-accordion="navigationAccordion"
                v-model:navigation-split="navigationSplit"
                :disabled="isFullContent"
                :disabled-navigation-split="!isMixedNav"
              />
            </Block>

            <Block :title="$t('preferences.breadcrumb.title')">
              <Breadcrumb
                v-model:breadcrumb-enable="breadcrumbEnable"
                v-model:breadcrumb-hide-only-one="breadcrumbHideOnlyOne"
                v-model:breadcrumb-show-home="breadcrumbShowHome"
                v-model:breadcrumb-show-icon="breadcrumbShowIcon"
                :disabled="
                  !showBreadcrumbConfig ||
                  !(isSideNav || isSideMixedNav || isHeaderSidebarNav)
                "
              />
            </Block>
            <Block :title="$t('preferences.tabbar.title')">
              <Tabbar
                v-model:tabbar-draggable="tabbarDraggable"
                v-model:tabbar-enable="tabbarEnable"
                v-model:tabbar-persist="tabbarPersist"
                v-model:tabbar-visit-history="tabbarVisitHistory"
                v-model:tabbar-show-icon="tabbarShowIcon"
                v-model:tabbar-show-maximize="tabbarShowMaximize"
                v-model:tabbar-show-more="tabbarShowMore"
                v-model:tabbar-style-type="tabbarStyleType"
                v-model:tabbar-wheelable="tabbarWheelable"
                v-model:tabbar-max-count="tabbarMaxCount"
                v-model:tabbar-middle-click-to-close="tabbarMiddleClickToClose"
              />
            </Block>
            <Block :title="$t('preferences.widget.title')">
              <Widget
                v-model:app-preferences-button-position="
                  appPreferencesButtonPosition
                "
                v-model:widget-fullscreen="widgetFullscreen"
                v-model:widget-global-search="widgetGlobalSearch"
                v-model:widget-language-toggle="widgetLanguageToggle"
                v-model:widget-lock-screen="widgetLockScreen"
                v-model:widget-notification="widgetNotification"
                v-model:widget-refresh="widgetRefresh"
                v-model:widget-sidebar-toggle="widgetSidebarToggle"
                v-model:widget-theme-toggle="widgetThemeToggle"
              />
            </Block>
          </template>

          <template #custom>
            <Block :title="customTabTitle">
              <Custom
                :fields="customPreferencesTab?.fields || []"
                :values="customPreferences"
                @update="handleCustomPreferencesUpdate"
              />
            </Block>
          </template>
        </VbenSegmented>
      </div>

      <template #footer>
        <VbenButton
          :disabled="!mergedDiffPreference"
          class="mr-4 w-full"
          size="large"
          variant="ghost"
          @click="handleClearCache"
        >
          {{ $t('preferences.clearAndLogout') }}
        </VbenButton>
      </template>
    </Drawer>
  </div>
</template>

<style scoped>
:deep(.sticky-tabs-header [role='tablist']) {
  @apply sticky -top-3 z-9999;
}
</style>
