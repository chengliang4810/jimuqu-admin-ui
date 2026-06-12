<script setup lang="ts">
import type { MenuOption } from '#/api/system/menu/model';

import { roleMenuTreeSelect } from '#/api/system/menu';
import { MenuSelectTable } from '#/components/tree';
import { Page } from '@vben/common-ui';
import { onMounted, ref, shallowRef } from 'vue';

const checkedKeys = ref<number[]>([]);
const menus = shallowRef<MenuOption[]>([]);

onMounted(async () => {
  const resp = await roleMenuTreeSelect(3);
  menus.value = resp.menus;
  checkedKeys.value = resp.checkedKeys;
});
</script>

<template>
  <Page :auto-content-height="true">
    <MenuSelectTable
      :menus="menus"
      v-model:checked-keys="checkedKeys"
      :association="true"
    />
  </Page>
</template>
