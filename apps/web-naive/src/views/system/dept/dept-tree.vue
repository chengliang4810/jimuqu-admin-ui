<script setup lang="ts">
import type { TreeOption } from 'naive-ui';

import type { PropType } from 'vue';

import { onMounted, ref } from 'vue';

import { requestClient } from '#/api/request';

defineOptions({ inheritAttrs: false });

withDefaults(defineProps<{ showSearch?: boolean }>(), { showSearch: true });

const emit = defineEmits<{
  /**
   * 点击刷新按钮的事件
   */
  reload: [];
  /**
   * 点击节点的事件
   */
  select: [];
}>();

const selectDeptId = defineModel('selectDeptId', {
  required: true,
  type: [String, Number, Array] as PropType<number | string | string[]>,
});

const searchValue = defineModel('searchValue', {
  type: String,
  default: '',
});

/** 部门数据源 */
type DeptTreeArray = any[];
const deptTreeArray = ref<DeptTreeArray>([]);
/** 骨架屏加载 */
const showTreeSkeleton = ref<boolean>(true);

async function loadTree() {
  showTreeSkeleton.value = true;
  searchValue.value = '';
  selectDeptId.value = [];

  const data = await requestClient.get<DeptTreeArray>('/system/dept/tree');

  deptTreeArray.value = data;
  showTreeSkeleton.value = false;
}

async function handleReload() {
  await loadTree();
  emit('reload');
}

onMounted(loadTree);

const nodeProps = ({ option }: { option: TreeOption }) => {
  return {
    onClick() {
      selectDeptId.value = option.id as string;
      emit('select');
    },
  };
};
</script>

<template>
  <div :class="$attrs.class">
    <n-skeleton v-if="showTreeSkeleton" :repeat="8" class="p-[8px]" />
    <div
      v-else
      class="bg-background flex h-full flex-col overflow-y-auto rounded-lg"
    >
      <!-- 固定在顶部 必须加上bg-background背景色 否则会产生'穿透'效果 -->
      <div
        v-if="showSearch"
        class="bg-background z-100 sticky left-0 top-0 p-[8px]"
      >
        <n-input-group>
          <n-input
            v-model:value="searchValue"
            size="small"
            placeholder="搜索"
          />
          <n-button type="primary" ghost @click="handleReload"> 刷新 </n-button>
        </n-input-group>
      </div>
      <div class="h-full overflow-x-hidden px-[8px]">
        <n-tree
          v-bind="$attrs"
          selectable
          v-if="deptTreeArray.length > 0"
          :class="$attrs.class"
          key-field="id"
          :pattern="searchValue"
          :show-irrelevant-nodes="false"
          label-field="label"
          :data="deptTreeArray"
          default-expand-all
          :node-props="nodeProps"
        />
      </div>
    </div>
  </div>
</template>
