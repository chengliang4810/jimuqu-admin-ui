<script setup lang="ts">
import { $t } from '@/locales';
import { Col, Row, Tooltip } from 'antdv-next';

import { accountBindList, handleAuthBinding } from '../oauth-common';
import { storeToRefs } from 'pinia';
import { useGlobalLoadingStore } from '@/stores/loading';

defineOptions({
  name: 'OAuthLogin',
});

const { globalLoading } = storeToRefs(useGlobalLoadingStore());
async function handleClick(source: string) {
  try {
    globalLoading.value = true;
    await handleAuthBinding(source);
  } catch (e) {
    console.error(e);
  } finally {
    globalLoading.value = false;
  }
}
</script>

<template>
  <div class="w-full sm:mx-auto md:max-w-md">
    <div class="my-4 flex items-center justify-between">
      <span class="border-input w-[35%] border-b dark:border-gray-600"></span>
      <span class="text-muted-foreground text-center text-xs uppercase">
        {{ $t('authentication.thirdPartyLogin') }}
      </span>
      <span class="border-input w-[35%] border-b dark:border-gray-600"></span>
    </div>
    <Row class="enter-x flex items-center justify-evenly">
      <!-- todo 这里在点击登录时要disabled -->
      <Col
        v-for="item in accountBindList"
        :key="item.source"
        :span="4"
        class="my-2"
      >
        <Tooltip :title="`${item.title}登录`">
          <span class="flex cursor-pointer items-center justify-center">
            <component
              v-if="item.avatar"
              :is="item.avatar"
              :style="item?.style ?? {}"
              class="size-[24px]"
              @click="handleClick(item.source)"
            />
          </span>
        </Tooltip>
      </Col>
    </Row>
  </div>
</template>
