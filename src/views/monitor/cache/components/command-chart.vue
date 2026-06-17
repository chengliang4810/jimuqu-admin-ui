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

import { usePreferences } from '@/core/preferences';
import {
  useDebounceFn,
  useResizeObserver,
  useWindowSize,
} from '@vueuse/core';
import * as echarts from 'echarts';

interface Props {
  data?: { name: string; value: string }[];
}

const props = withDefaults(defineProps<Props>(), {
  data: () => [],
});

const chartRef = ref<HTMLDivElement>();
let chartInstance: echarts.ECharts | null = null;
let cacheOptions: EChartsOption = {};

const { isDark } = usePreferences();
const { height, width } = useWindowSize();

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
  () => props.data,
  () => {
    if (!chartRef.value) return;
    setEchartsOption(props.data);
  },
  { immediate: true },
);

watch([width, height], () => {
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
  setEchartsOption(props.data);
});
/**
 * 从其他页面切换回来会有一个奇怪的动画效果 需要调用resize
 * 该饼图组件需要关闭animation
 */
onActivated(() => resize(false));

onBeforeUnmount(() => {
  chartInstance?.dispose();
  chartInstance = null;
});

function resize(withAnimation = true) {
  chartInstance?.resize({
    animation: withAnimation
      ? {
          duration: 300,
          easing: 'quadraticIn',
        }
      : undefined,
  });
}

function setEchartsOption(data: any[]) {
  const option: EChartsOption = {
    series: [
      {
        animationDuration: 1000,
        animationEasing: 'cubicInOut',
        center: ['50%', '50%'],
        data,
        name: '命令',
        radius: [15, 95],
        roseType: 'radius',
        type: 'pie',
      },
    ],
    tooltip: {
      formatter: '{a} <br/>{b} : {c} ({d}%)',
      trigger: 'item',
    },
  };
  renderEcharts(option);
}
</script>

<template>
  <div ref="chartRef" style="width: 100%; height: 400px"></div>
</template>
