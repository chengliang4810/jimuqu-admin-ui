<script lang="ts" setup>
import type {
  VxeGridDefines,
  VxeGridInstance,
  VxeGridListeners,
  VxeGridProps as VxeTableGridProps,
} from 'vxe-table';

import type { SetupContext } from 'vue';

import type { ExtendedVxeGridApi, VxeGridProps } from './types';

import {
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  toRaw,
  useSlots,
  useTemplateRef,
  watch,
} from 'vue';

import { usePreferences } from '@/core/preferences';
import { VbenHelpTooltip, VbenLoading } from '@/core/ui/adapter';
import { usePriorityValues } from '@/effects/hooks';
import { EmptyIcon } from '@/icons-app';
import { cloneDeep, cn, isBoolean, mergeWithArrayOverride } from '@/utils';
import { VxeGrid, VxeUI } from 'vxe-table';

import { extendProxyOptions } from './extends';
import { applyViewedRowOptions, useViewedRow } from './use-viewed-row';

import 'vxe-table/styles/cssvar.scss';
import 'vxe-pc-ui/styles/cssvar.scss';
import './style.css';

interface Props extends VxeGridProps {
  api: ExtendedVxeGridApi;
}

const props = withDefaults(defineProps<Props>(), {});

const TOOLBAR_ACTIONS = 'toolbar-actions';
const TOOLBAR_TOOLS = 'toolbar-tools';
const TABLE_TITLE = 'table-title';

const gridRef = useTemplateRef<VxeGridInstance>('gridRef');

const state = props.api?.useStore?.();

const {
  gridOptions,
  class: className,
  gridClass,
  gridEvents,
  tableTitle,
  tableData,
  tableTitleHelp,
  viewedRowOptions,
} = usePriorityValues(props, state);

const gridApi = props.api;

watch(
  viewedRowOptions,
  (cfg) => {
    if (gridApi.viewedRowHelper) return;
    if (!cfg) return;

    const keyField = (gridOptions.value?.rowConfig as any)?.keyField || 'id';
    const resolved = isBoolean(cfg) ? { keyField } : { keyField, ...cfg };
    gridApi.viewedRowHelper = useViewedRow(resolved);
  },
  { immediate: true },
);

const { isMobile } = usePreferences();
const slots: SetupContext['slots'] = useSlots();

const showTableTitle = computed(() => {
  return !!slots[TABLE_TITLE]?.() || tableTitle.value;
});

const showToolbar = computed(() => {
  return (
    !!slots[TOOLBAR_ACTIONS]?.() ||
    !!slots[TOOLBAR_TOOLS]?.() ||
    showTableTitle.value
  );
});

const toolbarOptions = computed(() => {
  const slotActions = slots[TOOLBAR_ACTIONS]?.();
  const slotTools = slots[TOOLBAR_TOOLS]?.();

  const toolbarConfig: any = {
    tools: gridOptions.value?.toolbarConfig?.tools ?? [],
  };

  if (!showToolbar.value) {
    toolbarConfig.enabled = false;
    return { toolbarConfig };
  }

  toolbarConfig.slots = {
    ...(slotActions || showTableTitle.value ? { buttons: TOOLBAR_ACTIONS } : {}),
    ...(slotTools ? { tools: TOOLBAR_TOOLS } : {}),
  };
  return { toolbarConfig };
});

const options = computed(() => {
  const globalGridConfig = VxeUI?.getConfig()?.grid ?? {};

  const mergedOptions: VxeTableGridProps = cloneDeep(
    mergeWithArrayOverride(
      {},
      toRaw(toolbarOptions.value),
      toRaw(gridOptions.value),
      globalGridConfig,
    ),
  );

  if (mergedOptions.proxyConfig) {
    const { ajax } = mergedOptions.proxyConfig;
    mergedOptions.proxyConfig.enabled = !!ajax;
    mergedOptions.proxyConfig.autoLoad = false;
  }

  if (mergedOptions.pagerConfig) {
    const mobileLayouts = [
      'PrevJump',
      'PrevPage',
      'Number',
      'NextPage',
      'NextJump',
    ] as any;
    const layouts = [
      'Total',
      'Sizes',
      'Home',
      ...mobileLayouts,
      'End',
    ] as readonly string[];
    mergedOptions.pagerConfig = mergeWithArrayOverride(
      {},
      mergedOptions.pagerConfig,
      {
        pageSize: 20,
        background: true,
        pageSizes: [10, 20, 30, 50, 100, 200],
        className: 'mt-2 w-full',
        layouts: isMobile.value ? mobileLayouts : layouts,
        size: 'mini' as const,
      },
    );
  }

  if (mergedOptions.formConfig) {
    mergedOptions.formConfig.enabled = false;
  }

  if (tableData.value && tableData.value.length > 0) {
    mergedOptions.data = tableData.value;
  }

  if (viewedRowOptions.value && gridApi.viewedRowHelper) {
    applyViewedRowOptions(
      mergedOptions,
      viewedRowOptions.value,
      gridApi.viewedRowHelper,
    );
  }

  return mergedOptions;
});

function onToolbarToolClick(event: VxeGridDefines.ToolbarToolClickEventParams) {
  (
    gridEvents.value?.toolbarToolClick as VxeGridListeners['toolbarToolClick']
  )?.(event);
}

const events = computed(() => {
  return {
    ...gridEvents.value,
    toolbarToolClick: onToolbarToolClick,
  };
});

const delegatedSlots = computed(() => {
  const resultSlots: string[] = [];
  for (const key of Object.keys(slots)) {
    if (![
      'empty',
      'loading',
      TOOLBAR_ACTIONS,
      TOOLBAR_TOOLS,
    ].includes(key)) {
      resultSlots.push(key);
    }
  }
  return resultSlots;
});

const showDefaultEmpty = computed(() => {
  const hasEmptyText = options.value.emptyText !== undefined;
  const hasEmptyRender = options.value.emptyRender !== undefined;
  return !hasEmptyText && !hasEmptyRender;
});

async function init() {
  await nextTick();
  const globalGridConfig = VxeUI?.getConfig()?.grid ?? {};
  const defaultGridOptions: VxeTableGridProps = mergeWithArrayOverride(
    {},
    toRaw(gridOptions.value),
    toRaw(globalGridConfig),
  );
  const autoLoad = defaultGridOptions.proxyConfig?.autoLoad;
  const enableProxyConfig = options.value.proxyConfig?.enabled;
  if (enableProxyConfig && autoLoad) {
    props.api.grid.commitProxy?.('query', {});
  }

  const formConfig = gridOptions.value?.formConfig;
  if (formConfig && formConfig.enabled) {
    console.warn('[Vben Vxe Table]: formConfig is not supported');
  }
  props.api?.setState?.({ gridOptions: defaultGridOptions });
  extendProxyOptions(props.api, defaultGridOptions, () => ({}));
}

onMounted(() => {
  props.api?.mount?.(gridRef.value);
  init();
});

onUnmounted(() => {
  props.api?.unmount?.();
});
</script>

<template>
  <div :class="cn('bg-card h-full rounded-md', className)">
    <VxeGrid
      ref="gridRef"
      :class="
        cn(
          'p-2',
          {
            'pt-0': showToolbar,
          },
          gridClass,
        )
      "
      v-bind="options"
      v-on="events"
    >
      <template v-if="showToolbar" #toolbar-actions="slotProps">
        <slot v-if="showTableTitle" name="table-title">
          <div class="flex-center gap-1 text-[1rem] font-medium">
            {{ tableTitle }}
            <VbenHelpTooltip v-if="tableTitleHelp">
              {{ tableTitleHelp }}
            </VbenHelpTooltip>
          </div>
        </slot>
        <slot name="toolbar-actions" v-bind="slotProps"></slot>
      </template>

      <template
        v-for="slotName in delegatedSlots"
        :key="slotName"
        #[slotName]="slotProps"
      >
        <slot :name="slotName" v-bind="slotProps"></slot>
      </template>

      <template #toolbar-tools="slotProps">
        <slot name="toolbar-tools" v-bind="slotProps"></slot>
      </template>

      <template #loading>
        <slot name="loading">
          <VbenLoading :spinning="true" />
        </slot>
      </template>

      <template v-if="showDefaultEmpty" #empty>
        <slot name="empty">
          <EmptyIcon class="mx-auto" />
          <div class="mt-2">{{ $t('common.noData') }}</div>
        </slot>
      </template>
    </VxeGrid>
  </div>
</template>

