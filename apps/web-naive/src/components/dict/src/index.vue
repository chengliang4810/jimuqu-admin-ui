<!-- eslint-disable eqeqeq -->
<script setup lang="ts">
import { computed } from 'vue';

import { NSpin, NTag } from 'naive-ui';

import { tagTypes } from './data';

interface Props {
  // eslint-disable-next-line vue/no-required-prop-with-default
  dicts: Dict.DataVo[]; // dict数组
  value: number | string; // value
}

const props = withDefaults(defineProps<Props>(), {
  dicts: undefined,
});

const color = computed<string>(() => {
  const current = props.dicts.find((item) => item.dictValue == props.value);
  const listClass = current?.listClass ?? 'default';
  // 是否为默认的颜色
  const isDefault = Reflect.has(tagTypes, listClass);
  // 判断是默认还是自定义颜色
  if (isDefault) {
    // 这里做了antd - element-plus的兼容
    return tagTypes[listClass]!.color;
  }
  return listClass;
});

const cssClass = computed<string>(() => {
  const current = props.dicts.find((item) => item.dictValue == props.value);
  return current?.cssClass ?? '';
});

const label = computed<number | string>(() => {
  const current = props.dicts.find((item) => item.dictValue == props.value);
  return current?.dictLabel ?? 'unknown';
});

const tagComponent = computed(() => (color.value ? NTag : 'div'));

const loading = computed(() => {
  return props.dicts?.length === 0;
});
</script>

<template>
  <div>
    <component
      v-if="!loading"
      :is="tagComponent"
      round
      size="small"
      :class="cssClass"
      :type="color"
    >
      {{ label }}
    </component>
    <NSpin v-else :show="true" size="small" />
  </div>
</template>
