<script setup lang="ts">
import type { Recordable } from '@/types';
import type { Key } from 'antdv-next/dist/table/interface';

import type { Component } from 'vue';

import { ref } from 'vue';

import { previewCode } from '@/api/tool/gen';
import { useVbenModal } from '@/components';
import { useClipboard } from '@vueuse/core';
import { Alert, Skeleton, Tree } from 'antdv-next';

import { defaultFileIcon, defaultFolderIcon, iconMap } from './data';

interface TreeNode {
  children: TreeNode[];
  title: string;
  key: string;
  icon: Component; // 树左边图标
}

const treeData = ref<TreeNode[]>([]);
/** modal标题 */
const modalTitle = ref('代码预览');
/** 代码内容 */
const codeContent = ref('点击左侧树节点查看代码');
/** code */
const currentCodeData = ref<null | Recordable<any>>(null);

const [BasicModal, modalApi] = useVbenModal({
  async onOpenChange(isOpen) {
    if (!isOpen) {
      handleClose();
      return null;
    }
    modalApi.modalLoading(true);

    const { tableId } = modalApi.getData() as { tableId: string };
    const data = await previewCode(tableId);
    currentCodeData.value = data;
    const tree = convertToTree(Object.keys(data));
    treeData.value = tree;

    modalApi.modalLoading(false);
  },
});

/**
 * 文件路径数组转树结构
 * @param paths 文件路径数组
 */
function convertToTree(paths: string[]): TreeNode[] {
  const tree: TreeNode[] = [];

  for (const path of paths) {
    const segments = path.split('/');
    let currentNode = tree;
    let currentPath = '';

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      currentPath += `${segment}`;
      if (i !== segments.length - 1) {
        currentPath += '/';
      }

      const existingNode = currentNode.find((node) => node.title === segment);

      if (existingNode) {
        currentNode = existingNode.children || [];
      } else {
        const title = (segment ?? '').replace('.vm', '');
        const newNode: TreeNode = {
          icon: findIcon(currentPath),
          key: currentPath,
          title,
          children: [],
        };
        currentNode.push(newNode);
        currentNode = newNode.children;
      }
    }
  }

  return tree;
}

function findIcon(path: string) {
  if (path.endsWith('.vm')) {
    const realPath = path.slice(0, -3);
    // 是否为指定拓展名
    const icon = iconMap.find((item) => realPath.endsWith(item.key));
    if (icon) {
      return icon.value;
    }
    return defaultFileIcon;
  }
  // 其他的为文件夹
  return defaultFolderIcon;
}

function handleSelect(selectedKeys: Key[]) {
  const [currentFile = ''] = selectedKeys as string[];
  if (!currentCodeData.value) {
    return;
  }
  const currentCode =
    currentCodeData.value[currentFile as keyof typeof currentCodeData.value];
  if (currentCode) {
    // 内容
    codeContent.value = currentCode;
    // 修改标题
    modalTitle.value = `代码预览: ${currentFile.replace('.vm', '')}`;
  }
}

function handleClose() {
  currentCodeData.value = null;
  codeContent.value = '点击左侧树节点查看代码';
  modalTitle.value = '代码预览';
}

const { copy } = useClipboard({ legacy: true });
</script>

<template>
  <BasicModal
    :footer="false"
    :fullscreen="true"
    :fullscreen-button="false"
    :title="modalTitle"
  >
    <div v-if="currentCodeData" class="flex gap-[8px]">
      <div class="h-[calc(100vh-80px)] w-[300px] overflow-y-scroll">
        <Tree
          v-if="treeData.length > 0"
          :show-line="{ showLeafIcon: false }"
          :tree-data="treeData"
          :virtual="false"
          default-expand-all
          @select="handleSelect"
        >
          <template #titleRender="{ title, icon }">
            <div class="flex items-center gap-[16px]">
              <component :is="icon" />
              <span>{{ title }}</span>
            </div>
          </template>
        </Tree>
        <Alert
          class="mt-2"
          show-icon
          message="👆显示的名称为模板的文件名，非最终下载文件名..."
        />
      </div>
      <code class="h-[calc(100vh-80px)] w-full overflow-y-scroll text-[16px]">
        {{ codeContent }}
      </code>
      <div class="fixed top-20 right-20">
        <a-button @click="copy(codeContent)">复制</a-button>
      </div>
    </div>
    <Skeleton v-if="!currentCodeData" active />
  </BasicModal>
</template>

<style lang="scss" scoped>
:deep(.ant-tree .ant-tree-switcher) {
  display: flex;
  align-items: center;
}

/** codeMirror 占满容器高度 即calc计算的高度 */
:deep(.cm-editor) {
  height: 100%;
}
</style>
