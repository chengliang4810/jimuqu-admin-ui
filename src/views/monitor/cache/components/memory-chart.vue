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
import { useDebounceFn, useWindowSize } from '@vueuse/core';

interface Props {
  data?: string;
}

const props = withDefaults(defineProps<Props>(), {
  data: '0',
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

// 从其他页面切换回来会有一个奇怪的动画效果 需要调用resize
onActivated(() => {
  resizeHandler();
});

onBeforeUnmount(() => {
  chartInstance?.dispose();
  chartInstance = null;
});

/**
 * 获取最近的十的幂次
 * 该函数用于寻找大于给定数字num的最近的10的幂次
 * 主要解决的问题是确定一个数附近较大的十的幂次，这在某些算法中很有用
 *
 * @param num {number} 输入的数字，用于寻找最近的十的幂次
 */
function getNearestPowerOfTen(num: number) {
  let power = 10;
  while (power <= num) {
    power *= 10;
  }
  return power;
}

function setEchartsOption(value: string) {
  // x10
  const formattedValue = Math.floor(Number.parseFloat(value));
  // 最大值 10以内取10  100以内取100 以此类推
  const max = getNearestPowerOfTen(formattedValue);
  const options: EChartsOption = {
    series: [
      {
        animation: true,
        animationDuration: 1000,
        data: [
          {
            name: '内存消耗',
            value: Number.parseFloat(value),
          },
        ],
        detail: {
          formatter: `${value}M`,
          valueAnimation: true,
        },
        max,
        min: 0,
        name: '峰值',
        progress: {
          show: true,
        },
        type: 'gauge',
      },
    ],
    tooltip: {
      formatter: `{b} <br/>{a} : ${value}M`,
    },
  };
  renderEcharts(options);
}
</script>

<template>
  <div ref="chartRef" style="width: 100%; height: 400px"></div>
</template>
