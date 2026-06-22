<script lang="ts" setup>
import type { NotificationItem } from './types';

import { computed } from 'vue';

import VbenScrollbar from '@/core/ui/adapter/scrollbar.vue';
import { Bell, CircleCheckBig, CircleX, MailCheck } from '@/icons';
import { $t } from '@/locales';
import { cn } from '@/utils';
import { useToggle } from '@vueuse/core';
import { Button, Popover, Segmented } from 'antdv-next';

defineOptions({ name: 'NotificationPopup' });

const props = withDefaults(
  defineProps<{
    dot?: boolean;
    keepOpen?: boolean;
    notifications?: NotificationItem[];
    tabList?: { label: string; value: string }[];
  }>(),
  {
    dot: false,
    keepOpen: false,
    notifications: () => [],
    tabList: () => [],
  },
);

const emit = defineEmits<{
  clear: [];
  click: [NotificationItem];
  makeAll: [];
  read: [NotificationItem];
  remove: [NotificationItem];
  viewAll: [];
}>();

const [open, toggle] = useToggle();
const close = () => {
  open.value = false;
};

const handleOpenUpdate = (val: boolean) => {
  if (!val && props.keepOpen) return;
  open.value = val;
};

const handleViewAll = () => {
  emit('viewAll');
  close();
};
const handleMakeAll = () => {
  emit('makeAll');
};
const handleClear = () => {
  emit('clear');
};

const currentTab = defineModel<string>('currentTab', { default: '' });
const computedNotificationList = computed(() => {
  if (props.tabList.length === 0) return props.notifications;
  return props.notifications.filter((item) => item.type === currentTab.value);
});
</script>
<template>
  <Popover
    :open="open"
    overlay-class-name="relative right-2 !z-[1998] w-90 p-0"
    trigger="click"
    :styles="{
      root: {
        '--ant-popover-inner-padding': '0',
      },
    }"
    @open-change="handleOpenUpdate"
  >
    <div class="flex-center mr-2 h-full" @click.stop="toggle()">
      <Button
        type="text"
        shape="circle"
        :class="
          cn('bell-button text-foreground relative !text-lg', 'flex-center')
        "
      >
        <span
          v-if="dot"
          class="bg-primary absolute top-0.5 right-0.5 size-2 rounded-full"
        ></span>
        <Bell class="size-4" />
      </Button>
    </div>

    <template #content>
      <div class="relative w-[358px]">
        <div class="flex items-center justify-between p-4 py-2">
          <div class="text-foreground text-[16px]">
            {{ $t('ui.widgets.notifications') }}
          </div>
          <Button
            type="text"
            shape="circle"
            :disabled="notifications.length <= 0"
            :class="cn('!text-lg', 'flex-center')"
            @click="handleMakeAll"
          >
            <MailCheck class="size-4" />
          </Button>
        </div>

        <div v-if="tabList">
          <Segmented
            :block="true"
            v-model:value="currentTab"
            :options="tabList.map((t) => ({ value: t.value, label: t.label }))"
          />
        </div>

        <VbenScrollbar
          v-if="computedNotificationList.length > 0"
          :key="currentTab"
        >
          <ul class="!flex max-h-[360px] w-full flex-col">
            <template v-for="item in computedNotificationList" :key="item.id">
              <li
                class="border-border hover:bg-accent relative flex w-full cursor-pointer items-start gap-5 border-t p-3"
                @click="emit('click', item)"
              >
                <slot name="content" :item="item">
                  <span
                    v-if="!item.isRead"
                    class="bg-primary absolute top-2 right-2 size-2 rounded-full"
                  ></span>
                  <span
                    class="relative flex size-10 shrink-0 overflow-hidden rounded-full"
                  >
                    <img
                      :src="item.avatar"
                      class="aspect-square size-full object-cover"
                    />
                  </span>
                  <div class="flex flex-col gap-1 leading-none">
                    <p class="font-semibold">{{ item.title }}</p>
                    <p
                      class="text-muted-foreground my-1 line-clamp-2 pr-8 text-xs"
                    >
                      {{ item.message }}
                    </p>
                    <p class="text-muted-foreground line-clamp-2 text-xs">
                      {{ item.date }}
                    </p>
                  </div>
                  <div
                    class="absolute top-1/2 right-3 flex -translate-y-1/2 flex-row gap-1"
                  >
                    <slot name="action" :item="item">
                      <slot name="action-prepend" :item="item"></slot>
                      <Button
                        v-if="false"
                        type="text"
                        shape="circle"
                        size="small"
                        :class="cn('!text-lg', 'flex-center')"
                        @click.stop="emit('read', item)"
                      >
                        <CircleCheckBig class="size-4" />
                      </Button>
                      <Button
                        v-if="false"
                        type="text"
                        shape="circle"
                        size="small"
                        :class="cn('text-destructive !text-lg', 'flex-center')"
                        @click.stop="emit('remove', item)"
                      >
                        <CircleX class="size-4" />
                      </Button>
                      <slot name="action-append" :item="item"></slot>
                    </slot>
                  </div>
                </slot>
              </li>
            </template>
          </ul>
        </VbenScrollbar>

        <template v-else>
          <div class="flex-center text-muted-foreground min-h-37.5 w-full">
            {{ $t('common.noData') }}
          </div>
        </template>

        <div
          v-if="false"
          class="border-border flex items-center justify-between border-t px-4 py-3"
        >
          <Button
            :disabled="notifications.length <= 0"
            size="small"
            type="text"
            @click="handleClear"
          >
            {{ $t('ui.widgets.clearNotifications') }}
          </Button>
          <Button size="small" @click="handleViewAll">
            {{ $t('ui.widgets.viewAll') }}
          </Button>
        </div>
      </div>
    </template>
  </Popover>
</template>

<style scoped>
:deep(.bell-button) {
  &:hover {
    svg {
      animation: bell-ring 1s both;
    }
  }
}

@keyframes bell-ring {
  0%,
  100% {
    transform-origin: top;
  }

  15% {
    transform: rotateZ(10deg);
  }

  30% {
    transform: rotateZ(-10deg);
  }

  45% {
    transform: rotateZ(5deg);
  }

  60% {
    transform: rotateZ(-5deg);
  }

  75% {
    transform: rotateZ(2deg);
  }
}
</style>
