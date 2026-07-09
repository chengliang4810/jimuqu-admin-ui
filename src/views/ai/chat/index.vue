<script setup lang="ts">
import { onMounted, ref } from 'vue';

import { registerSnailUser } from '@/api/agent';
import { useAppConfig } from '@/hooks';
import { useAccessStore } from '@/stores';
import { Skeleton } from 'antdv-next';
import { stringify } from 'qs';

const { apiURL } = useAppConfig(import.meta.env, import.meta.env.PROD);

const iframeUrl = ref('');
const accessStore = useAccessStore();
onMounted(async () => {
  try {
    const resp = await registerSnailUser();
    const { openId } = resp;
    const url = `${apiURL}/snail-chat/?${stringify({
      openId,
      trustedCredential: accessStore.accessToken,
    })}`;
    iframeUrl.value = url;
  } catch (e) {
    console.error(e);
  }
});
</script>

<template>
  <div class="size-full">
    <iframe v-if="iframeUrl" class="size-full" :src="iframeUrl"></iframe>
    <Skeleton class="p-4" active v-else />
  </div>
</template>
