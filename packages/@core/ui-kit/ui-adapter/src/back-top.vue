<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';

import { ArrowUpToLine } from '@vben-core/icons';

import { Button } from 'antdv-next';

interface Props {
  bottom?: number;
  right?: number;
  target?: string;
  visibilityHeight?: number;
}

defineOptions({ name: 'VbenBackTop' });

const props = withDefaults(defineProps<Props>(), {
  bottom: 20,
  right: 24,
  target: '',
  visibilityHeight: 200,
});

const visible = ref(false);
let container: HTMLElement | Window = window;
let scrollEl: HTMLElement | null = null;

const backTopStyle = computed(() => ({
  bottom: `${props.bottom}px`,
  right: `${props.right}px`,
}));

function getScrollTop() {
  return scrollEl
    ? scrollEl.scrollTop
    : (window.scrollY ?? document.documentElement.scrollTop);
}

function handleScroll() {
  visible.value = getScrollTop() >= props.visibilityHeight;
}

function handleClick() {
  if (scrollEl) {
    scrollEl.scrollTo({ behavior: 'smooth', top: 0 });
  } else {
    window.scrollTo({ behavior: 'smooth', top: 0 });
  }
}

onMounted(() => {
  if (props.target) {
    scrollEl = document.querySelector(props.target);
    container = scrollEl ?? window;
  }
  container.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
});

onUnmounted(() => {
  container.removeEventListener('scroll', handleScroll);
});
</script>

<template>
  <transition name="fade-down">
    <Button
      v-if="visible"
      type="text"
      shape="circle"
      :style="backTopStyle"
      class="z-popup bg-background shadow-float hover:bg-heavy dark:bg-accent fixed size-10 duration-500"
      @click="handleClick"
    >
      <ArrowUpToLine class="size-4" />
    </Button>
  </transition>
</template>
