<script lang="ts" setup>
import type { ColPageProps } from './types';

import { computed, ref, useSlots } from 'vue';

import Page from '../page/page.vue';

defineOptions({
  name: 'ColPage',
  inheritAttrs: false,
});

const props = withDefaults(defineProps<ColPageProps>(), {
  leftWidth: 30,
  rightWidth: 70,
  resizable: true,
});

const delegatedProps = computed(() => {
  const { leftWidth: _, ...delegated } = props;
  return delegated;
});

const slots = useSlots();

const delegatedSlots = computed(() => {
  const resultSlots: string[] = [];

  for (const key of Object.keys(slots)) {
    if (!['default', 'left'].includes(key)) {
      resultSlots.push(key);
    }
  }
  return resultSlots;
});

const leftCollapsed = ref(false);

const leftPanelStyle = computed(() => {
  return {
    flexBasis: leftCollapsed.value
      ? `${props.leftCollapsedWidth ?? 0}%`
      : `${props.leftWidth}%`,
    maxWidth: props.leftMaxWidth ? `${props.leftMaxWidth}%` : undefined,
    minWidth: props.leftMinWidth ? `${props.leftMinWidth}%` : undefined,
  };
});

const rightPanelStyle = computed(() => {
  return {
    flexBasis: `${props.rightWidth}%`,
    maxWidth: props.rightMaxWidth ? `${props.rightMaxWidth}%` : undefined,
    minWidth: props.rightMinWidth ? `${props.rightMinWidth}%` : undefined,
  };
});

function expandLeft() {
  leftCollapsed.value = false;
}

function collapseLeft() {
  if (props.leftCollapsible) {
    leftCollapsed.value = true;
  }
}

defineExpose({
  expandLeft,
  collapseLeft,
});
</script>
<template>
  <Page v-bind="delegatedProps">
    <!-- 继承默认的slot -->
    <template
      v-for="slotName in delegatedSlots"
      :key="slotName"
      #[slotName]="slotProps"
    >
      <slot :name="slotName" v-bind="slotProps"></slot>
    </template>

    <div class="flex size-full w-full">
      <div :style="leftPanelStyle" class="h-full shrink-0 overflow-hidden">
        <div class="h-full pr-2">
          <slot
            name="left"
            v-bind="{
              expand: expandLeft,
              collapse: collapseLeft,
            }"
          ></slot>
        </div>
      </div>
      <div
        v-if="resizable"
        :class="splitHandle ? 'w-2 cursor-col-resize' : 'w-px'"
        :style="{ backgroundColor: splitLine ? undefined : 'transparent' }"
        class="bg-border h-full shrink-0"
      ></div>
      <div
        :style="rightPanelStyle"
        class="h-full min-w-0 flex-1 overflow-hidden"
      >
        <div class="h-full pl-2">
          <slot></slot>
        </div>
      </div>
    </div>
  </Page>
</template>
