<script setup lang="ts">
import type { Notice } from '@/api/system/notice/model';

import { shallowRef } from 'vue';

import { useVbenModal } from '@/components';
import { useAccess } from '@/components/access';
// 直接从 helper 引入, 避免经 barrel 连带打包重型 tiptap 编辑器
import { contentWithOssIdTransform } from '@/components/tiptap/src/helper';
import { DictEnum } from '@/constants';
import { renderDict } from '@/utils/render';
import { Divider, Empty } from 'antdv-next';
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
  <BasicModal title="通知公告">
    <div v-if="currentNotice">
      <div class="flex min-h-150 w-full justify-center">
        <div class="h-full w-full max-w-[680px]">
          <div class="pt-4 pb-4 text-xl font-bold">
            {{ currentNotice?.noticeTitle }}
          </div>
          <div class="flex gap-4">
            <component :is="renderDict(currentNotice?.noticeType, DictEnum.SYS_NOTICE_TYPE)" />
            <span>{{ currentNotice?.createByName }} </span>
            <span>{{ currentNotice?.createTime }}</span>
          </div>
          <Divider />
          <div v-html="currentNotice?.noticeContent" class="pb-16"></div>
        </div>
      </div>
    </div>
    <Empty v-else />
  </BasicModal>
</template>

<style scoped>
.notice-content :deep(img) {
  max-width: 100%;
}
</style>
