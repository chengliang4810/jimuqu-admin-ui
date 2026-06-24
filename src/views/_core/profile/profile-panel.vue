<script setup lang="tsx">
import type { UserProfile } from '@/api/system/profile/model';
import type { DescriptionsProps } from 'antdv-next';

import { computed } from 'vue';

import { userProfileUpdate } from '@/api/system/profile';
import { uploadApi } from '@/api/core/upload';
import { CropperAvatar } from '@/components/cropper';
import { preferences, usePreferences } from '@/core/preferences';
import { buildUUID } from '@/utils';
import { Card, Descriptions, Tag, Tooltip } from 'antdv-next';

const props = defineProps<{ profile?: UserProfile }>();

const emit = defineEmits<{
  // 头像上传完毕
  uploadFinish: [];
}>();

const avatar = computed(
  () => props.profile?.user.avatar || preferences.app.defaultAvatar,
);

/**
 * 头像上传：先上传到 OSS → 拿到 ossId → 更新个人信息
 */
async function handleAvatarUpload({
  file,
  filename,
}: {
  file: Blob;
  filename: string;
}) {
  // Blob 转 File（OSS 上传需要 File 类型 / 文件名）
  const uploadFile = filename
    ? new File([file], filename)
    : new File([file], `${buildUUID()}.png`);

  // 1. 上传到 OSS
  const result = await uploadApi(uploadFile);

  // 2. 用 ossId 更新个人信息
  await userProfileUpdate({ avatar: result.ossId });

  // 3. 返回 url 供 cropper 预览
  return { url: result.url };
}

const { isDark } = usePreferences();
const poetrySrc = computed(() => {
  const color = isDark.value ? 'white' : 'gray';
  return `https://v2.jinrishici.com/one.svg?font-size=12&color=${color}`;
});

const items = computed<DescriptionsProps['items']>(() => {
  if (!props.profile) {
    return [];
  }
  const { profile } = props;
  return [
    {
      content: profile.user.userName,
      label: '账号',
    },
    {
      content: profile.user.phoneNumber || '未绑定手机号',
      label: '手机号码',
    },
    {
      content: profile.user.email || '未绑定邮箱',
      label: '邮箱',
    },
    {
      content: (
        <div class="flex flex-wrap gap-1">
          <Tag color="processing">{profile.user.deptName ?? '未分配部门'}</Tag>
          {profile.postGroup && (
            <Tag color="processing">{profile.postGroup}</Tag>
          )}
        </div>
      ),
      label: '部门',
    },
    {
      content: profile.user.loginDate,
      label: '上次登录',
    },
  ];
});
</script>

<template>
  <Card :loading="!profile" class="h-full lg:w-1/3">
    <div v-if="profile" class="flex flex-col items-center gap-[24px]">
      <div class="flex flex-col items-center gap-[20px]">
        <Tooltip title="点击上传头像">
          <CropperAvatar
            :show-btn="false"
            :upload-api="handleAvatarUpload"
            :value="avatar"
            width="120"
            @change="emit('uploadFinish')"
          />
        </Tooltip>
        <div class="flex flex-col items-center gap-[8px]">
          <span class="text-foreground text-xl font-bold">
            {{ profile.user.nickName ?? '未知' }}
          </span>
          <!-- https://www.jinrishici.com/doc/#image -->
          <img :src="poetrySrc" />
        </div>
      </div>
      <div class="w-full px-6">
        <Descriptions :column="1" :items="items" />
      </div>
    </div>
  </Card>
</template>
