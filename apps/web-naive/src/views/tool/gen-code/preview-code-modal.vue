<script setup lang="ts">
import type { TreeOption } from 'naive-ui';

import { useVbenModal } from '@vben/common-ui';

import { useClipboard } from '@vueuse/core';

import { requestClient } from '#/api/request';

const { copy } = useClipboard({ legacy: true });
const modalTitle = ref<string>('代码预览');
const codeMap = ref<Record<string, string>>({});
/** code */
const currentCodeData = ref<string | undefined>(undefined);
const treeData = ref<TreeOption[] | undefined>([]);

const [Modal, modalApi] = useVbenModal({
  fullscreen: true,
  fullscreenButton: false,
  footer: false,
  async onOpenChange(isOpen) {
    if (!isOpen) {
      handleClose();
      return null;
    }
    modalApi.lock();

    const { tableId } = modalApi.getData() as { tableId: string };

    const data = await requestClient.get<Record<string, string>>(
      `/tool/gen-code/preview/${tableId}`,
    );
    codeMap.value = data;
    treeData.value = convertToTree(Object.keys(data));
    modalApi.unlock();
  },
});

function convertToTree(paths: string[]): TreeOption[] {
  const tree: TreeOption[] = [];

  paths.forEach((path) => {
    const parts = path.split('.');
    if (parts.length < 3 || parts.pop() !== 'vm') return; // 忽略不符合格式的条目

    const category = parts.pop()!; // 类型作为一级目录
    const fileName = parts.join('.'); // 文件名作为二级目录和最终节点

    // 查找或创建一级目录节点
    let categoryNode = tree.find((n) => n.key === category);
    if (!categoryNode) {
      categoryNode = { key: category, label: category, children: [] };
      tree.push(categoryNode);
    }

    // 查找或创建二级目录节点
    let fileNode = categoryNode.children?.find((n) => n.name === fileName);
    if (!fileNode) {
      fileNode = {
        key: `${fileName}.${category}.vm`,
        label: `${fileName}.${category}`,
      };
      categoryNode.children!.push(fileNode);
    }
  });

  return tree;
}

function handleClose() {
  currentCodeData.value = undefined;
  modalTitle.value = '代码预览';
}

const nodeProps = ({ option }: { option: TreeOption }) => {
  return {
    onClick() {
      if (option.children) {
        return;
      }
      modalTitle.value = `代码预览: ${option.label}` as string;
      currentCodeData.value = codeMap.value[option.key as string];
    },
  };
};
const message = useMessage();
async function handleCopy() {
  if (!currentCodeData.value) {
    return;
  }
  await copy(currentCodeData.value ?? '');
  message.success('复制成功');
}
</script>
<template>
  <Modal :title="modalTitle">
    <n-layout position="absolute" style="top: 64px; bottom: 64px" has-sider>
      <n-layout-sider
        content-style="padding: 0 24px;"
        :native-scrollbar="false"
        bordered
      >
        <n-tree
          default-expand-all
          block-line
          :node-props="nodeProps"
          :data="treeData"
        />

        <n-alert class="mt-8" type="info" :show-icon="false">
          👆 根据文件名后缀分组展示
        </n-alert>
      </n-layout-sider>
      <n-layout content-style="padding: 24px;" :native-scrollbar="false">
        <n-code
          show-line-numbers
          :code="currentCodeData"
          language="javascript"
        />

        <div class="fixed right-20 top-20">
          <n-button type="tertiary" @click="handleCopy"> 复制代码 </n-button>
        </div>
      </n-layout>
    </n-layout>
  </Modal>
</template>
