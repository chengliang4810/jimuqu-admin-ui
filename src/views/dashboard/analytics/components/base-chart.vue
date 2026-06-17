<script setup lang="ts">
import type { EChartsOption } from 'echarts';

import {
  nextTick,
  onActivated,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue';

import echarts from '@/components/echarts';
import { usePreferences } from '@/core/preferences';
import {
  useDebounceFn,
  useResizeObserver,
  useWindowSize,
} from '@vueuse/core';

interface Props {
  height?: string;
  option: EChartsOption;
}

const props = withDefaults(defineProps<Props>(), {
  height: '320px',
  option: () => ({}),
});

const chartRef = ref<HTMLDivElement>();
let chartInstance: echarts.ECharts | null = null;
let cacheOptions: EChartsOption = {};

const { isDark } = usePreferences();
const { height: winHeight, width: winWidth } = useWindowSize();

const resizeHandler = useDebounceFn(() => {
  chartInstance?.resize({
    animation: {
      duration: 300,
      easing: 'quadraticIn',
    },
  });
}, 200);

function initChart() {
  if (!chartRef.value) return;
  chartInstance = echarts.init(chartRef.value, isDark.value ? 'dark' : null);
}

function renderEcharts(options: EChartsOption) {
  cacheOptions = options;
  const finalOptions: EChartsOption = {
    ...options,
    ...(isDark.value ? { backgroundColor: 'transparent' } : {}),
  };
  nextTick(() => {
    if (!chartInstance) {
      initChart();
    }
    chartInstance?.setOption(finalOptions, true);
  });
}

watch(
  () => props.option,
  () => {
    if (!chartRef.value) return;
    renderEcharts(props.option);
  },
  { deep: true, immediate: true },
);

watch([winWidth, winHeight], () => {
  resizeHandler();
});

useResizeObserver(chartRef, resizeHandler);

watch(isDark, () => {
  if (!chartInstance) return;
  chartInstance.dispose();
  chartInstance = null;
  initChart();
  renderEcharts(cacheOptions);
});

onMounted(() => {
  renderEcharts(props.option);
});

onActivated(() => {
  resizeHandler();
});

onBeforeUnmount(() => {
  chartInstance?.dispose();
  chartInstance = null;
});
</script>

<template>
  <div ref="chartRef" :style="{ width: '100%', height }"></div>
</template>
