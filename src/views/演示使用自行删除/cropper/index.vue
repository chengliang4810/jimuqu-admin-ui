<script lang="ts" setup>
import type { CropendResult } from '@/components/cropper/src/typing';

import { ref } from 'vue';

import { Page } from '@/components';
import { CropperAvatar, CropperImage } from '@/components/cropper';
import { Card, Switch } from 'antdv-next';

defineOptions({ name: 'CropperDemo' });

// CropperImage 测试图(支持 CORS,避免 canvas 被污染导致 toBlob 失败)
const imgSrc = 'https://picsum.photos/id/1015/800/600';
const circled = ref(false);

// 实时预览结果
const previewBase64 = ref('');
const cropInfo = ref<CropendResult['imgInfo'] | null>(null);

function handleCropend({ imgBase64, imgInfo }: CropendResult) {
  previewBase64.value = imgBase64;
  cropInfo.value = imgInfo;
}

function handleReadyError() {
  window.message.error('图片加载失败');
}

// CropperAvatar 上传:把裁剪后的 blob 转本地 URL 模拟上传回显
const avatarValue = ref('');

async function mockUploadApi({ file }: { file: Blob }) {
  // 模拟网络延迟
  await new Promise((resolve) => setTimeout(resolve, 300));
  return { url: URL.createObjectURL(file) };
}

function handleAvatarChange({ data }: { data: string }) {
  window.message.success(`头像上传成功: ${data}`);
}
</script>

<template>
  <Page>
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <!-- 直接裁剪 -->
      <Card title="CropperImage 直接裁剪">
        <div class="mb-3 flex items-center gap-2">
          <span>圆形裁剪</span>
          <Switch v-model:checked="circled" />
        </div>
        <CropperImage
          :circled="circled"
          :src="imgSrc"
          crossorigin="anonymous"
          height="360px"
          @cropend="handleCropend"
          @ready-error="handleReadyError"
        />
        <div v-if="cropInfo" class="mt-3 text-sm text-gray-500">
          选区: x={{ cropInfo.x.toFixed(0) }}, y={{ cropInfo.y.toFixed(0) }},
          宽={{ cropInfo.width.toFixed(0) }}, 高={{
            cropInfo.height.toFixed(0)
          }}
        </div>
        <div v-if="previewBase64" class="mt-3">
          <div class="mb-1 text-sm text-gray-500">裁剪结果</div>
          <img
            :class="circled ? 'rounded-full' : 'rounded'"
            :src="previewBase64"
            class="h-32 w-32 border border-gray-200 object-cover"
            alt="result"
          />
        </div>
      </Card>

      <!-- 模态框裁剪上传 -->
      <Card title="CropperAvatar 模态框上传">
        <CropperAvatar
          v-model:value="avatarValue"
          :size="5"
          :upload-api="mockUploadApi"
          width="160"
          btn-text="上传头像"
          @change="handleAvatarChange"
        />
        <div class="mt-4 text-sm text-gray-500">
          当前绑定值:
          <span class="break-all">{{ avatarValue || '(未上传)' }}</span>
        </div>
      </Card>
    </div>
  </Page>
</template>
