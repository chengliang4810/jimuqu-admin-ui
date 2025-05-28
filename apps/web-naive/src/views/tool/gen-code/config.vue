<script setup lang="tsx">
import { Page } from '@vben/common-ui';
import { useTabs } from '@vben/hooks';
import { cloneDeep } from '@vben/utils';

import { requestClient } from '#/api/request';

import ConfigBasic from './config-basic.vue';
import ConfigColumn from './config-column.vue';

const { setTabTitle, closeCurrentTab } = useTabs();
const routes = useRoute();
// 获取路由参数
const tableId = routes.params.tableId as string;

// 当前激活tab页
const currentTab = ref('basic');

// 代码生成配置信息
const genInfoData = ref<any>();
provide('genInfoData', genInfoData);

/**
 * 获取代码生成配置信息
 */
async function getGenConfigInfo() {
  const data = await requestClient.get(`/tool/gen-code/${tableId}`);
  genInfoData.value = data;
}

onMounted(async () => {
  await getGenConfigInfo();
  setTabTitle(`生成配置: ${genInfoData.value.info.tableName}`);
});

const basicConfigRef = useTemplateRef('basicConfigRef');

const router = useRouter();
/**
 * 保存配置
 */
async function saveConfig() {
  try {
    // 校验tab1
    const settingValidate = await basicConfigRef.value?.validateForm();
    if (!settingValidate) {
      currentTab.value = 'basic';
      return;
    }

    // 合并数据
    const requestData = cloneDeep(unref(genInfoData!).info);
    // 获取表单数据
    const formValues = await basicConfigRef.value?.getFormValues();
    // 合并
    Object.assign(requestData, formValues);

    // 保存
    await requestClient.post(`/tool/gen-code/update`, requestData);

    closeCurrentTab();
    router.push({ path: '/tool/gen', replace: true });
  } catch (error) {
    console.error(error);
  }
}
</script>
<template>
  <Page :auto-content-height="true">
    <n-card class="h-full" :body-style="{ padding: '0 16px 16px' }">
      <n-tabs
        type="card"
        :bar-width="38"
        v-model:value="currentTab"
        default-value="basic"
      >
        <n-tab-pane name="basic" display-directive="show" tab="基础配置">
          <ConfigBasic ref="basicConfigRef" />
        </n-tab-pane>
        <n-tab-pane name="column" display-directive="show" tab="字段配置">
          <ConfigColumn />
        </n-tab-pane>
        <template #suffix>
          <n-button type="primary" @click="saveConfig"> 保存配置 </n-button>
        </template>
      </n-tabs>
    </n-card>
  </Page>
</template>
