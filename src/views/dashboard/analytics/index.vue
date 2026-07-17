<script setup lang="ts">
import type { EChartsOption } from 'echarts';

import { ref, shallowRef } from 'vue';

import { Page } from '@/components';
import { Card, Segmented } from 'antdv-next';

import BaseChart from './components/base-chart.vue';
import StatCard from './components/stat-card.vue';

defineOptions({ name: 'DashboardAnalytics' });

/* ==================== 顶部统计卡片 (mock 数据) ==================== */
const statCards = ref([
  {
    title: '总访问量',
    value: 89_254,
    trend: 12.5,
    desc: '较上月',
    color: 'primary' as const,
    icon: 'icon-[lucide--eye]',
    prefix: '',
    suffix: '',
  },
  {
    title: '活跃用户',
    value: 18_932,
    trend: 8.2,
    desc: '较上周',
    color: 'success' as const,
    icon: 'icon-[lucide--users]',
    prefix: '',
    suffix: '',
  },
  {
    title: '订单总数',
    value: 4567,
    trend: -3.1,
    desc: '较昨日',
    color: 'warning' as const,
    icon: 'icon-[lucide--shopping-cart]',
    prefix: '',
    suffix: ' 笔',
  },
  {
    title: '总收入',
    value: 928_540,
    trend: 15.7,
    desc: '较上月',
    color: 'destructive' as const,
    icon: 'icon-[lucide--wallet]',
    prefix: '¥',
    suffix: '',
  },
]);

/* ==================== 访问趋势 (mock 数据) ==================== */
const trendRange = ref<'month' | 'week'>('week');
const trendWeekX = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

const trendOption = shallowRef<EChartsOption>({});

function buildTrendOption(range: 'month' | 'week'): EChartsOption {
  const xData =
    range === 'week'
      ? trendWeekX
      : Array.from({ length: 30 }, (_, i) => `${i + 1}日`);
  const visitData =
    range === 'week'
      ? [820, 932, 901, 934, 1290, 1330, 1320]
      : Array.from({ length: 30 }, () => 600 + Math.floor(Math.random() * 900));
  const orderData =
    range === 'week'
      ? [320, 432, 401, 534, 690, 730, 620]
      : Array.from({ length: 30 }, () => 200 + Math.floor(Math.random() * 500));

  return {
    color: ['#1677ff', '#52c41a'],
    grid: { top: 40, left: 10, right: 20, bottom: 10, containLabel: true },
    legend: {
      data: ['访问量', '订单量'],
      top: 0,
      right: 0,
      icon: 'roundRect',
      itemWidth: 12,
      itemHeight: 4,
    },
    series: [
      {
        name: '访问量',
        type: 'line',
        smooth: true,
        showSymbol: false,
        data: visitData,
        lineStyle: { width: 3 },
        areaStyle: {
          opacity: 0.15,
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#1677ff' },
              { offset: 1, color: 'rgba(22, 119, 255, 0.01)' },
            ],
          },
        },
      },
      {
        name: '订单量',
        type: 'line',
        smooth: true,
        showSymbol: false,
        data: orderData,
        lineStyle: { width: 3 },
        areaStyle: {
          opacity: 0.15,
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#52c41a' },
              { offset: 1, color: 'rgba(82, 196, 26, 0.01)' },
            ],
          },
        },
      },
    ],
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: '#eee',
      borderWidth: 1,
      textStyle: { color: '#333' },
      axisPointer: { type: 'cross', crossStyle: { color: '#999' } },
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: xData,
      axisLine: { lineStyle: { color: '#e8e8e8' } },
      axisLabel: { color: '#999' },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: '#f0f0f0', type: 'dashed' } },
      axisLabel: { color: '#999' },
    },
  };
}

function onTrendRangeChange(val: number | string) {
  const range = val as 'month' | 'week';
  trendRange.value = range;
  trendOption.value = buildTrendOption(range);
}

trendOption.value = buildTrendOption('week');

/* ==================== 流量来源 (mock 数据) ==================== */
const sourceOption = shallowRef<EChartsOption>({
  color: ['#1677ff', '#52c41a', '#faad14', '#ff4d4f', '#722ed1'],
  legend: {
    orient: 'vertical',
    right: 10,
    top: 'center',
    icon: 'circle',
    itemHeight: 8,
    itemWidth: 8,
    textStyle: { color: '#666' },
  },
  series: [
    {
      name: '流量来源',
      type: 'pie',
      radius: ['45%', '70%'],
      center: ['38%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: {
        label: {
          show: true,
          fontSize: 16,
          fontWeight: 'bold',
          formatter: '{b}\n{d}%',
        },
      },
      labelLine: { show: false },
      data: [
        { value: 1048, name: '搜索引擎' },
        { value: 735, name: '直接访问' },
        { value: 580, name: '邮件营销' },
        { value: 484, name: '联盟广告' },
        { value: 300, name: '视频广告' },
      ],
    },
  ],
  tooltip: { trigger: 'item', formatter: '{a} <br/>{b}: {c} ({d}%)' },
});

/* ==================== 周活跃度 (mock 数据) ==================== */
const activityOption = shallowRef<EChartsOption>({
  color: ['#1677ff'],
  grid: { top: 30, left: 10, right: 10, bottom: 10, containLabel: true },
  series: [
    {
      name: '活跃度',
      type: 'bar',
      barWidth: '45%',
      data: [320, 432, 501, 634, 790, 930, 820],
      itemStyle: {
        borderRadius: [6, 6, 0, 0],
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: '#4096ff' },
            { offset: 1, color: '#1677ff' },
          ],
        },
      },
    },
  ],
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  xAxis: {
    type: 'category',
    data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    axisLine: { lineStyle: { color: '#e8e8e8' } },
    axisLabel: { color: '#999' },
  },
  yAxis: {
    type: 'value',
    splitLine: { lineStyle: { color: '#f0f0f0', type: 'dashed' } },
    axisLabel: { color: '#999' },
  },
});

/* ==================== 项目进度 (mock 数据) ==================== */
const taskList = ref([
  { name: '用户管理模块', percent: 86, color: 'bg-primary' },
  { name: '订单系统重构', percent: 64, color: 'bg-success' },
  { name: '数据大屏开发', percent: 42, color: 'bg-warning' },
  { name: '权限组件升级', percent: 28, color: 'bg-destructive' },
]);

/* ==================== 待办事项 (mock 数据) ==================== */
const todoList = ref([
  {
    title: '完成首页仪表盘重构',
    tag: '进行中',
    tagColor: 'bg-primary/10 text-primary',
    icon: 'icon-[lucide--layout-dashboard]',
  },
  {
    title: '修复登录页验证码刷新问题',
    tag: '紧急',
    tagColor: 'bg-destructive/10 text-destructive',
    icon: 'icon-[lucide--bug]',
  },
  {
    title: '编写组件库使用文档',
    tag: '待办',
    tagColor: 'bg-warning/10 text-warning',
    icon: 'icon-[lucide--file-text]',
  },
  {
    title: '优化表格大数据渲染性能',
    tag: '优化',
    tagColor: 'bg-success/10 text-success',
    icon: 'icon-[lucide--gauge]',
  },
]);
</script>

<template>
  <Page content-class="p-4 lg:p-6">
    <div class="enter-y flex flex-col gap-4 lg:gap-6">
      <!-- 顶部统计卡片 -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          v-for="(item, index) in statCards"
          :key="index"
          :color="item.color"
          :desc="item.desc"
          :icon="item.icon"
          :prefix="item.prefix"
          :suffix="item.suffix"
          :title="item.title"
          :trend="item.trend"
          :value="item.value"
        />
      </div>

      <!-- 图表区域 -->
      <div class="grid grid-cols-1 gap-4 lg:gap-6 xl:grid-cols-3">
        <Card class="xl:col-span-2" :body-style="{ padding: '20px' }">
          <template #title>
            <div class="flex items-center gap-2">
              <span
                class="icon-[lucide--activity] text-primary size-[18px]"
              ></span>
              <span>访问趋势</span>
            </div>
          </template>
          <template #extra>
            <Segmented
              v-model:value="trendRange"
              :options="[
                { label: '本周', value: 'week' },
                { label: '本月', value: 'month' },
              ]"
              size="small"
              @change="onTrendRangeChange"
            />
          </template>
          <BaseChart :option="trendOption" height="320px" />
        </Card>

        <Card :body-style="{ padding: '20px' }">
          <template #title>
            <div class="flex items-center gap-2">
              <span
                class="icon-[lucide--pie-chart] text-success size-[18px]"
              ></span>
              <span>流量来源</span>
            </div>
          </template>
          <BaseChart :option="sourceOption" height="320px" />
        </Card>
      </div>

      <!-- 第二行图表 -->
      <div class="grid grid-cols-1 gap-4 lg:gap-6 xl:grid-cols-3">
        <Card class="xl:col-span-2" :body-style="{ padding: '20px' }">
          <template #title>
            <div class="flex items-center gap-2">
              <span
                class="icon-[lucide--bar-chart-3] text-warning size-[18px]"
              ></span>
              <span>本周活跃度</span>
            </div>
          </template>
          <BaseChart :option="activityOption" height="300px" />
        </Card>

        <Card :body-style="{ padding: '20px' }">
          <template #title>
            <div class="flex items-center gap-2">
              <span
                class="icon-[lucide--rocket] text-destructive size-[18px]"
              ></span>
              <span>项目进度</span>
            </div>
          </template>
          <div class="flex flex-col gap-5 py-2">
            <div
              v-for="(task, index) in taskList"
              :key="index"
              class="flex flex-col gap-2"
            >
              <div class="flex items-center justify-between text-sm">
                <span class="text-foreground font-medium">{{ task.name }}</span>
                <span class="text-muted-foreground tabular-nums">
                  {{ task.percent }}%
                </span>
              </div>
              <div class="bg-muted h-2 w-full overflow-hidden rounded-full">
                <div
                  class="h-full rounded-full transition-all duration-700"
                  :class="task.color"
                  :style="{ width: `${task.percent}%` }"
                ></div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <!-- 待办事项 -->
      <Card :body-style="{ padding: '20px' }">
        <template #title>
          <div class="flex items-center gap-2">
            <span
              class="icon-[lucide--list-checks] text-primary size-[18px]"
            ></span>
            <span>待办事项</span>
          </div>
        </template>
        <template #extra>
          <span class="text-muted-foreground text-xs">
            共 {{ todoList.length }} 项
          </span>
        </template>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div
            v-for="(todo, index) in todoList"
            :key="index"
            class="card-box hover:shadow-float flex items-center gap-3 p-4 transition-all duration-300 hover:-translate-y-0.5"
          >
            <div class="bg-muted flex-center size-10 shrink-0 rounded-lg">
              <span :class="`${todo.icon} size-5`"></span>
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium">{{ todo.title }}</p>
              <span
                class="mt-1 inline-block rounded px-1.5 py-0.5 text-xs"
                :class="todo.tagColor"
              >
                {{ todo.tag }}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  </Page>
</template>
