<script lang="ts" setup>
import { preferences } from '@/core/preferences';
import { Avatar } from 'antdv-next';

interface Props {
  /** 头像地址，为空时使用默认头像 */
  avatar?: string;
  /** 主标题（昵称） */
  title?: string;
  /** 副标题（手机号等） */
  subtitle?: string;
}

withDefaults(defineProps<Props>(), {
  avatar: '',
  title: '',
  subtitle: '',
});
</script>

<template>
  <div class="flex items-center">
    <Avatar class="size-9" :src="avatar || preferences.app.defaultAvatar" />
    <div class="ml-2 flex flex-col items-start overflow-hidden">
      <span class="text-foreground text-sm font-medium" :title="title">
        {{ title }}
      </span>
      <span class="text-muted-foreground text-xs">
        {{ subtitle || '-' }}
      </span>
    </div>
  </div>
</template>
