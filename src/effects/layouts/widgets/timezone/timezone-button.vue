<script setup lang="ts">
import { ref, unref } from 'vue';

import { createIconifyIcon } from '@/icons-app';
import { $t } from '@/locales';
import { useTimezoneStore } from '@/stores';

import { useVbenModal } from '@/core/ui/popup';
import { VbenIconButton } from '@/core/ui/adapter';

import { Radio, RadioGroup } from 'antdv-next';

const TimezoneIcon = createIconifyIcon('fluent-mdl2:world-clock');

const timezoneStore = useTimezoneStore();

const timezoneRef = ref<string | undefined>();

const timezoneOptionsRef = ref<
  {
    label: string;
    value: string;
  }[]
>([]);

const [Modal, modalApi] = useVbenModal({
  fullscreenButton: false,
  onConfirm: async () => {
    try {
      modalApi.setState({ confirmLoading: true });
      const timezone = unref(timezoneRef);
      if (timezone) {
        await timezoneStore.setTimezone(timezone);
      }
      modalApi.close();
    } finally {
      modalApi.setState({ confirmLoading: false });
    }
  },
  async onOpenChange(isOpen) {
    if (isOpen) {
      timezoneRef.value = unref(timezoneStore.timezone);
      timezoneOptionsRef.value = await timezoneStore.getTimezoneOptions();
    }
  },
});

const handleClick = () => {
  modalApi.open();
};
</script>

<template>
  <div>
    <VbenIconButton
      :tooltip="$t('ui.widgets.timezone.setTimezone')"
      class="hover:animate-[shrink_0.3s_ease-in-out]"
      @click="handleClick"
    >
      <TimezoneIcon class="size-4 text-foreground" />
    </VbenIconButton>
    <Modal :title="$t('ui.widgets.timezone.setTimezone')">
      <div class="timezone-container">
        <RadioGroup v-model:value="timezoneRef" class="flex flex-col gap-2">
          <Radio
            v-for="item in timezoneOptionsRef"
            :key="`container${item.value}`"
            :value="item.value"
          >
            {{ item.label }}
          </Radio>
        </RadioGroup>
      </div>
    </Modal>
  </div>
</template>

<style scoped>
.timezone-container {
  @apply pl-5;
}
</style>
