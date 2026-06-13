<script setup lang="ts">
import { Checkbox } from 'antdv-next';

const props = withDefaults(
  defineProps<{
    class?: any;
    disabled?: boolean;
    indeterminate?: boolean;
    name?: string;
  }>(),
  {
    disabled: false,
    indeterminate: false,
    name: undefined,
  },
);

const checked = defineModel<boolean>();
</script>

<template>
  <Checkbox
    v-model:checked="checked"
    :class="props.class"
    :disabled="disabled"
    :indeterminate="indeterminate"
    :name="name"
  >
    <slot></slot>
  </Checkbox>
</template>
