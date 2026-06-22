<script setup lang="ts">
import type { Notice } from '@/api/system/notice/model';

import { shallowRef } from 'vue';

import { useVbenModal } from '@/components';
import { useAccess } from '@/components/access';
// 直接从 helper 引入, 避免经 barrel 连带打包重型 tiptap 编辑器
import { contentWithOssIdTransform } from '@/components/tiptap/src/helper';

const currentNotice = shallowRef<Notice | null>(null);
const { hasAccessByCodes } = useAccess();

const [BasicModal, modalApi] = useVbenModal({
  width: 800,
  fullscreenButton: true,
  footer: false,
  onOpenChange: async (isOpen) => {
    if (!isOpen) {
      return null;
    }
    modalApi.modalLoading(true);

    const { record } = modalApi.getData() as { record: Notice };
    if (
      record.noticeContent?.includes('data-oss-id=') &&
      hasAccessByCodes(['system:notice:query'])
    ) {
      record.noticeContent =
        (await contentWithOssIdTransform(record.noticeContent)) ?? '';
    }
    currentNotice.value = record;

    modalApi.modalLoading(false);
  },
  onClosed() {
    currentNotice.value = null;
  },
});
</script>

<template>
  <BasicModal :title="currentNotice?.noticeTitle ?? '预览公告'">
    <div v-if="currentNotice">
      <div
        class="notice-content max-h-[400px] overflow-y-auto"
        v-html="currentNotice.noticeContent"
      ></div>
    </div>
  </BasicModal>
</template>

<style scoped>
.notice-content :deep(img) {
  max-width: 100%;
}
</style>
