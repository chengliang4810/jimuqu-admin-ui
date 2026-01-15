<script lang="ts" setup>
import { onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';

import { Fallback } from '@vben/common-ui';
import { ArrowLeft, RotateCw } from '@vben/icons';
import { useErrorStore } from '@vben/stores';

import { NButton } from 'naive-ui';

defineOptions({ name: 'Fallback500' });

const router = useRouter();
const errorStore = useErrorStore();

// 重试：直接跳转到原始页面，让页面自己重新加载数据
function retry() {
  const originalPath = errorStore.failedRequestPath;
  errorStore.clearFailedRequestPath();
  // 重置500错误处理状态，允许后续的500错误再次触发
  errorStore.reset500ErrorState();
  router.push(originalPath);
}

// 返回首页
function goHome() {
  errorStore.clearFailedRequestPath();
  // 重置500错误处理状态
  errorStore.reset500ErrorState();
  router.push('/');
}

// 组件卸载时重置状态，确保下次进入500页面时能正常处理
onBeforeUnmount(() => {
  errorStore.reset500ErrorState();
});
</script>

<template>
  <Fallback status="500">
    <template #action>
      <div class="flex gap-4">
        <NButton size="large" @click="goHome">
          <template #icon>
            <ArrowLeft class="size-4" />
          </template>
          返回首页
        </NButton>
        <NButton size="large" type="primary" @click="retry">
          <template #icon>
            <RotateCw class="size-4" />
          </template>
          重试
        </NButton>
      </div>
    </template>
  </Fallback>
</template>
