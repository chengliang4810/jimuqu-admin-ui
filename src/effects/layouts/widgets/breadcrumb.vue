<script lang="ts" setup>
import type { IBreadcrumb } from '@/core/ui/adapter';

import { computed, h } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { VbenBreadcrumbView } from '@/core/ui/adapter';
import { $t } from '@/locales';
import { HomeOutlined } from '@antdv-next/icons';

interface Props {
  hideWhenOnlyOne?: boolean;
  showHome?: boolean;
  showIcon?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showHome: false,
  showIcon: false,
});

const route = useRoute();
const router = useRouter();

const breadcrumbs = computed((): IBreadcrumb[] => {
  const matched = route.matched;

  const resultBreadcrumb: IBreadcrumb[] = [];

  for (const match of matched) {
    const { meta, path } = match;
    const { hideChildrenInMenu, hideInBreadcrumb, icon, name, title } =
      meta || {};
    if (hideInBreadcrumb || hideChildrenInMenu || !path) {
      continue;
    }

    resultBreadcrumb.push({
      icon,
      path: path || route.path,
      title: title ? $t((title || name) as string) : '',
    });
  }
  if (props.showHome) {
    resultBreadcrumb.unshift({
      icon: h(HomeOutlined),
      isHome: true,
      path: '/',
    });
  }
  if (props.hideWhenOnlyOne && resultBreadcrumb.length === 1) {
    return [];
  }

  return resultBreadcrumb;
});

function handleSelect(path: string) {
  router.push(path);
}
</script>
<template>
  <VbenBreadcrumbView
    :breadcrumbs="breadcrumbs"
    :show-icon="showIcon"
    class="ml-2"
    @select="handleSelect"
  />
</template>
