<script lang="ts" setup>
import type { DescriptionsProps } from 'antdv-next';

import { Card, Descriptions } from 'antdv-next';
import { VBEN_DOC_URL, VBEN_GITHUB_URL, VBEN_PREVIEW_URL } from '@/constants';
import { Page } from '@/effects/common-ui';

import { computed, h } from 'vue';

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
  '是一个现代化开箱即用的中后台解决方案，采用最新的技术栈，包括 Vue 3.0、Vite、TailwindCSS 和 TypeScript 等前沿技术，代码规范严谨，提供丰富的配置选项，旨在为中大型项目的开发提供现成的开箱即用解决方案及丰富的示例，同时，它也是学习和深入前端技术的一个极佳示例。';
const name = 'Vben Admin';
const title = '关于项目';

const renderLink = (href: string, text: string) =>
  h(
    'a',
    { href, target: '_blank', class: 'vben-link' },
    { default: () => text },
  );

const {
  authorEmail,
  authorName,
  authorUrl,
  buildTime,
  dependencies = {},
  devDependencies = {},
  homepage,
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
    content: renderLink(homepage, '点击查看'),
    label: '主页',
  },
  {
    content: renderLink(VBEN_DOC_URL, '点击查看'),
    label: '文档地址',
  },
  {
    content: renderLink(VBEN_PREVIEW_URL, '点击查看'),
    label: '预览地址',
  },
  {
    content: renderLink(VBEN_GITHUB_URL, '点击查看'),
    label: 'Github',
  },
  {
    content: h('div', [
      renderLink(authorUrl, `${authorName}  `),
      renderLink(`mailto:${authorEmail}`, authorEmail),
    ]),
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
      <p class="mt-3 text-sm/6 text-foreground">
        <a :href="VBEN_GITHUB_URL" class="vben-link" target="_blank">
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
