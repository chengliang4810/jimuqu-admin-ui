<script lang="ts" setup>
import type { DescriptionsProps } from 'antdv-next';

import { computed, h } from 'vue';

import { Page } from '@/components';
import { Card, Descriptions } from 'antdv-next';

defineOptions({ name: 'About' });

declare global {
  const __VBEN_ADMIN_METADATA__: {
    authorEmail: string;
    authorName: string;
    authorUrl: string;
    buildTime: string;
    dependencies: Record<string, string>;
    description: string;
    devDependencies: Record<string, string>;
    homepage: string;
    license: string;
    repositoryUrl: string;
    version: string;
  };
}

type AboutDescriptionItem = DescriptionsProps['items'];

const description =
  '基于vben5.7版本(被一万行提交改坏前的最后一个提交)重构 更新为单仓项目 组件库为antdv-next';
const name = 'Vben Admin';
const title = '关于项目';

const renderLink = (href: string, text: string) =>
  h(
    'a',
    { href, target: '_blank', class: 'vben-link' },
    { default: () => text },
  );

const {
  authorName,
  authorUrl,
  buildTime,
  dependencies = {},
  devDependencies = {},
  license,
  version,
  // vite inject-metadata 插件注入的全局变量
} = __VBEN_ADMIN_METADATA__ || {};

const descriptionColumn = {
  lg: 4,
  md: 3,
  sm: 1,
  xl: 4,
  xs: 1,
};

const baseInfoItems = computed<AboutDescriptionItem>(() => [
  {
    content: version,
    label: '版本号',
  },
  {
    content: license,
    label: '开源许可协议',
  },
  {
    content: buildTime,
    label: '最后构建时间',
  },
  {
    content: renderLink('https://gitee.com/dapppp/bell-plus', '点击查看'),
    label: '文档地址',
  },
  {
    content: renderLink('https://gitee.com/dapppp/bell-plus', '点击查看'),
    label: 'Gitee',
  },
  {
    content: h('div', [renderLink(authorUrl, `${authorName}  `)]),
    label: '作者',
  },
]);

const dependenciesItems = computed<AboutDescriptionItem>(() =>
  Object.entries(dependencies).map(([label, content]) => ({
    content,
    label,
  })),
);

const devDependenciesItems = computed<AboutDescriptionItem>(() =>
  Object.entries(devDependencies).map(([label, content]) => ({
    content,
    label,
  })),
);
</script>

<template>
  <Page :title="title" content-class="flex flex-col gap-4">
    <template #description>
      <p class="text-foreground mt-3 text-sm/6">
        <a href="https://www.baidu.com" class="vben-link" target="_blank">
          {{ name }}
        </a>
        {{ description }}
      </p>
    </template>
    <Card size="small" title="基本信息">
      <Descriptions
        :column="descriptionColumn"
        :items="baseInfoItems"
        bordered
        size="small"
      />
    </Card>

    <Card size="small" title="生产环境依赖">
      <Descriptions
        :column="descriptionColumn"
        :items="dependenciesItems"
        bordered
        size="small"
      />
    </Card>
    <Card size="small" title="开发环境依赖">
      <Descriptions
        :column="descriptionColumn"
        :items="devDependenciesItems"
        bordered
        size="small"
      />
    </Card>
  </Page>
</template>
