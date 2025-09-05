<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { Page } from '@vben/common-ui';
import { requestClient } from '#/api/request';

defineOptions({ name: 'ServerMonitor' });

interface CpuInfo {
  cpuNum: number;
  cpuUsed: number;
  cpuSystem: number;
  cpuUser: number;
}

interface MemoryInfo {
  total: number;
  used: number;
  free: number;
  usage: number;
}

interface JvmInfo {
  name: string;
  version: string;
  vendor: string;
  total: number;
  max: number;
  used: number;
  free: number;
  usage: number;
  uptime: string;
  startTime: string;
}

interface DiskInfo {
  name: string;
  path: string;
  type: string;
  total: number;
  used: number;
  free: number;
  usage: number;
}

interface SystemInfo {
  computerName: string;
  osName: string;
  osArch: string;
  osVersion: string;
  hostIp: string;
  userDir: string;
}

interface MonitorData {
  cpu: CpuInfo;
  memory: MemoryInfo;
  jvm: JvmInfo;
  disks: DiskInfo[];
  system: SystemInfo;
}

const loading = ref(false);
const monitorData = ref<MonitorData | null>(null);
const error = ref<string | null>(null);
const autoRefresh = ref(true);
const refreshInterval = ref(5); // 刷新间隔（秒）
let refreshTimer: NodeJS.Timeout | null = null;

// 刷新间隔选项
const refreshIntervalOptions = [
  { label: '3秒', value: 3 },
  { label: '5秒', value: 5 },
  { label: '10秒', value: 10 },
  { label: '20秒', value: 20 },
  { label: '30秒', value: 30 },
];

// 获取系统监控信息
async function fetchMonitorData() {
  loading.value = true;
  error.value = null;
  
  try {
    const response = await requestClient.get<MonitorData>('/system/monitor/info');
    monitorData.value = response;
  } catch (err: any) {
    error.value = err.message || '获取监控信息失败';
    console.error('获取系统监控信息失败:', err);
  } finally {
    loading.value = false;
  }
}

// 格式化字节数
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 获取进度条状态类型
function getProgressStatus(usage: number): 'success' | 'warning' | 'error' {
  if (usage < 60) return 'success';
  if (usage < 80) return 'warning';
  return 'error';
}

// 开启自动刷新
function startAutoRefresh() {
  if (refreshTimer) clearInterval(refreshTimer);
  refreshTimer = setInterval(() => {
    if (autoRefresh.value) {
      fetchMonitorData();
    }
  }, refreshInterval.value * 1000); // 转换为毫秒
}

// 停止自动刷新
function stopAutoRefresh() {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
}

// 切换自动刷新
function toggleAutoRefresh(value: boolean) {
  if (value) {
    startAutoRefresh();
  } else {
    stopAutoRefresh();
  }
}

// 刷新间隔变化时重新启动定时器
function onRefreshIntervalChange() {
  if (autoRefresh.value) {
    startAutoRefresh();
  }
}

// 手动刷新
function handleRefresh() {
  fetchMonitorData();
}

onMounted(() => {
  fetchMonitorData();
  startAutoRefresh();
});

onUnmounted(() => {
  stopAutoRefresh();
});
</script>

<template>
  <Page auto-content-height>
    <div class="server-monitor">
      <!-- 页面标题和操作区 -->
      <n-card class="header-card">
        <div class="header-content">
          <div class="title-section">
            <h2 class="monitor-title">系统监控信息</h2>
            <n-text depth="3" class="monitor-subtitle">
              实时监控服务器CPU、内存、JVM、磁盘等系统信息
            </n-text>
          </div>
          <div class="control-section">
            <n-space align="center" :size="16">
              <div class="control-item">
                <n-switch
                  v-model:value="autoRefresh"
                  @update:value="toggleAutoRefresh"
                >
                  <template #checked>关闭自动刷新</template>
                  <template #unchecked>开启自动刷新</template>
                </n-switch>
              </div>
              <div class="control-item">
                <n-select
                  v-model:value="refreshInterval"
                  :options="refreshIntervalOptions"
                  :disabled="!autoRefresh"
                  @update:value="onRefreshIntervalChange"
                  style="width: 80px;"
                  size="small"
                />
              </div>
              <n-divider vertical />
              <div class="control-item">
                <n-button
                  type="primary"
                  :loading="loading"
                  @click="handleRefresh"
                  size="medium"
                >
                  <template #icon>
                    <n-icon><svg viewBox="0 0 24 24"><path fill="currentColor" d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg></n-icon>
                  </template>
                  刷新数据
                </n-button>
              </div>
            </n-space>
          </div>
        </div>
      </n-card>

      <!-- 加载状态 -->
      <div v-if="loading && !monitorData" class="loading-container">
        <n-spin size="large">
          <template #description>正在获取系统监控信息...</template>
        </n-spin>
      </div>

      <!-- 错误状态 -->
      <n-alert v-else-if="error" type="error" class="error-alert">
        <template #header>获取监控信息失败</template>
        {{ error }}
        <n-button size="small" style="margin-top: 8px;" @click="handleRefresh">重试</n-button>
      </n-alert>

      <!-- 监控数据展示 -->
      <div v-else-if="monitorData" class="monitor-content">
        <n-grid cols="1 s:2 l:4" responsive="screen" :x-gap="16" :y-gap="16">
          <!-- CPU 信息卡片 -->
          <n-grid-item>
            <n-card title="CPU 信息" class="monitor-card">
              <template #header-extra>
                <n-tag :type="getProgressStatus(monitorData.cpu.cpuUsed)">
                  {{ monitorData.cpu.cpuUsed.toFixed(1) }}%
                </n-tag>
              </template>
              <n-space vertical size="large">
                <div class="info-item">
                  <n-text>CPU 核心数</n-text>
                  <n-text strong>{{ monitorData.cpu.cpuNum }} 核</n-text>
                </div>
                <div class="info-item">
                  <n-text>CPU 使用率</n-text>
                  <n-text strong>{{ monitorData.cpu.cpuUsed.toFixed(1) }}%</n-text>
                </div>
                <!-- CPU 使用率图表 -->
                <div class="chart-container centered-chart">
                  <div class="progress-chart">
                    <n-progress
                      type="circle"
                      :percentage="monitorData.cpu.cpuUsed"
                      :status="getProgressStatus(monitorData.cpu.cpuUsed)"
                      :stroke-width="8"
                      :show-indicator="false"
                      style="width: 120px; height: 120px;"
                    />
                    <div class="chart-center-text">
                      <div class="chart-percentage">{{ monitorData.cpu.cpuUsed.toFixed(1) }}%</div>
                      <div class="chart-label">CPU</div>
                    </div>
                  </div>
                </div>
              </n-space>
            </n-card>
          </n-grid-item>

          <!-- 内存信息卡片 -->
          <n-grid-item>
            <n-card title="内存信息" class="monitor-card">
              <template #header-extra>
                <n-tag :type="getProgressStatus(monitorData.memory.usage)">
                  {{ monitorData.memory.usage.toFixed(1) }}%
                </n-tag>
              </template>
              <n-space vertical size="large">
                <div class="info-item">
                  <n-text>内存总量</n-text>
                  <n-text strong>{{ formatBytes(monitorData.memory.total) }}</n-text>
                </div>
                <div class="info-item">
                  <n-text>剩余内存</n-text>
                  <n-text strong>{{ formatBytes(monitorData.memory.free) }}</n-text>
                </div>
                <!-- 内存使用率图表 -->
                <div class="chart-container centered-chart">
                  <div class="progress-chart">
                    <n-progress
                      type="circle"
                      :percentage="monitorData.memory.usage"
                      :status="getProgressStatus(monitorData.memory.usage)"
                      :stroke-width="8"
                      :show-indicator="false"
                      style="width: 120px; height: 120px;"
                    />
                    <div class="chart-center-text">
                      <div class="chart-percentage">{{ monitorData.memory.usage.toFixed(1) }}%</div>
                      <div class="chart-label">内存</div>
                    </div>
                  </div>
                </div>
              </n-space>
            </n-card>
          </n-grid-item>

          <!-- JVM 信息卡片 -->
          <n-grid-item>
            <n-card title="JVM 信息" class="monitor-card">
              <template #header-extra>
                <n-tag :type="getProgressStatus(monitorData.jvm.usage)">
                  {{ monitorData.jvm.usage.toFixed(1) }}%
                </n-tag>
              </template>
              <n-space vertical size="large">
                <div class="info-item">
                  <n-text>JVM 名称</n-text>
                  <n-text strong>{{ monitorData.jvm.name }}</n-text>
                </div>
                <div class="info-item">
                  <n-text>Java 版本</n-text>
                  <n-text strong>{{ monitorData.jvm.version }}</n-text>
                </div>
                <div class="info-item">
                  <n-text>运行时间</n-text>
                  <n-text strong>{{ monitorData.jvm.uptime }}</n-text>
                </div>
                <div class="info-item">
                  <n-text>启动时间</n-text>
                  <n-text strong>{{ monitorData.jvm.startTime }}</n-text>
                </div>
                <div class="progress-item">
                  <n-text>JVM 内存使用率</n-text>
                  <n-progress
                    type="line"
                    :percentage="monitorData.jvm.usage"
                    :status="getProgressStatus(monitorData.jvm.usage)"
                    :show-indicator="false"
                  />
                  <n-text depth="3">{{ formatBytes(monitorData.jvm.used) }} / {{ formatBytes(monitorData.jvm.total) }}</n-text>
                </div>
              </n-space>
            </n-card>
          </n-grid-item>

          <!-- 系统信息卡片 -->
          <n-grid-item>
            <n-card title="系统信息" class="monitor-card">
              <n-space vertical size="large">
                <div class="info-item">
                  <n-text>服务器名称</n-text>
                  <n-text strong>{{ monitorData.system.computerName }}</n-text>
                </div>
                <div class="info-item">
                  <n-text>操作系统</n-text>
                  <n-text strong>{{ monitorData.system.osName }}</n-text>
                </div>
                <div class="info-item">
                  <n-text>系统架构</n-text>
                  <n-text strong>{{ monitorData.system.osArch }}</n-text>
                </div>
                <div class="info-item">
                  <n-text>系统版本</n-text>
                  <n-text strong>{{ monitorData.system.osVersion }}</n-text>
                </div>
                <div class="info-item">
                  <n-text>服务器IP</n-text>
                  <n-text strong>{{ monitorData.system.hostIp }}</n-text>
                </div>
                <div class="info-item">
                  <n-text>项目路径</n-text>
                  <n-text strong class="path-text">{{ monitorData.system.userDir }}</n-text>
                </div>
              </n-space>
            </n-card>
          </n-grid-item>
        </n-grid>

        <!-- 磁盘信息卡片 -->
        <n-card title="磁盘信息" class="monitor-card disk-card">
          <n-grid cols="1 s:2 l:3" responsive="screen" :x-gap="16" :y-gap="16">
            <n-grid-item v-for="disk in monitorData.disks" :key="disk.name">
              <n-card size="small" class="disk-item">
                <template #header>
                  <n-space align="center" justify="space-between">
                    <div>
                      <n-text strong>{{ disk.name }}</n-text>
                      <n-text depth="3" class="disk-path">{{ disk.path }}</n-text>
                    </div>
                    <n-tag :type="getProgressStatus(disk.usage)">
                      {{ disk.usage.toFixed(1) }}%
                    </n-tag>
                  </n-space>
                </template>
                <n-space vertical>
                  <div class="info-item">
                    <n-text>磁盘类型</n-text>
                    <n-text strong>{{ disk.type }}</n-text>
                  </div>
                  <div class="info-item">
                    <n-text>总容量</n-text>
                    <n-text strong>{{ formatBytes(disk.total) }}</n-text>
                  </div>
                  <div class="info-item">
                    <n-text>已用空间</n-text>
                    <n-text strong>{{ formatBytes(disk.used) }}</n-text>
                  </div>
                  <div class="info-item">
                    <n-text>剩余空间</n-text>
                    <n-text strong>{{ formatBytes(disk.free) }}</n-text>
                  </div>
                  <div class="progress-item">
                    <n-text>使用率</n-text>
                    <n-progress
                      type="line"
                      :percentage="disk.usage"
                      :status="getProgressStatus(disk.usage)"
                      :show-indicator="false"
                    />
                    <n-text depth="3">{{ disk.usage.toFixed(1) }}%</n-text>
                  </div>
                </n-space>
              </n-card>
            </n-grid-item>
          </n-grid>
        </n-card>
      </div>
    </div>
  </Page>
</template>

<style scoped>
.server-monitor {
  padding: 20px;
}

.header-card {
  margin-bottom: 24px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
}

.title-section {
  flex: 1;
}

.control-section {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.control-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  min-width: fit-content;
}

.control-label {
  font-size: 12px;
  color: var(--n-text-color-2);
  white-space: nowrap;
}

.monitor-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--n-text-color-base);
}

.monitor-subtitle {
  margin-top: 4px;
  font-size: 14px;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.error-alert {
  margin-bottom: 24px;
}

.monitor-content {
  min-height: 600px;
}

.monitor-card {
  height: 100%;
  transition: box-shadow 0.3s;
}

.monitor-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.disk-card {
  margin-top: 16px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.progress-item {
  padding: 8px 0;
}

.progress-item .n-text:last-child {
  margin-top: 4px;
  font-size: 12px;
}

/* 图表样式 */
.chart-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

/* 居中的图表容器 */
.centered-chart {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 140px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.progress-chart {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.chart-center-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  pointer-events: none;
}

.chart-percentage {
  font-size: 18px;
  font-weight: bold;
  line-height: 1;
  margin-bottom: 2px;
}

.chart-label {
  font-size: 12px;
  opacity: 0.7;
  line-height: 1;
}

.path-text {
  word-break: break-all;
  font-family: monospace;
  font-size: 12px;
}

.disk-item {
  height: 100%;
}

.disk-path {
  display: block;
  font-size: 12px;
  margin-top: 2px;
}

@media (max-width: 768px) {
  .server-monitor {
    padding: 12px;
  }
  
  .monitor-title {
    font-size: 20px;
  }
  
  .header-card {
    margin-bottom: 16px;
  }
  
  .header-content {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
  
  .control-section {
    justify-content: center;
  }
  
  .control-item {
    align-items: center;
  }
}
</style>
