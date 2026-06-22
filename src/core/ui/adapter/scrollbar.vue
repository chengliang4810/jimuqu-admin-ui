<script setup lang="ts">
import type { ClassType } from '@/types';

import type { CSSProperties } from 'vue';

import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

import { cn } from '@/utils';

interface Props {
  class?: ClassType;
  horizontal?: boolean;
  /**
   * 悬浮滚动条模式:隐藏原生滚动条(不占布局宽度),叠加一个悬浮在内容之上的自定义滚动条
   */
  overlay?: boolean;
  scrollBarClass?: ClassType;
  shadow?: boolean;
  shadowBorder?: boolean;
  shadowBottom?: boolean;
  shadowLeft?: boolean;
  shadowRight?: boolean;
  shadowTop?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  class: '',
  horizontal: false,
  overlay: false,
  shadow: false,
  shadowBorder: false,
  shadowBottom: true,
  shadowLeft: false,
  shadowRight: false,
  shadowTop: true,
});

const emit = defineEmits<{
  scrollAt: [{ bottom: boolean; left: boolean; right: boolean; top: boolean }];
}>();

const isAtTop = ref(true);
const isAtBottom = ref(false);
const isAtLeft = ref(true);
const isAtRight = ref(false);

const showShadowTop = computed(() => props.shadow && props.shadowTop);
const showShadowBottom = computed(() => props.shadow && props.shadowBottom);
const hideNativeScrollbar = computed(() =>
  hasHiddenClass(props.scrollBarClass),
);

function hasHiddenClass(value: ClassType): boolean {
  if (!value) {
    return false;
  }

  if (typeof value === 'string') {
    return value.split(/\s+/).includes('hidden');
  }

  if (Array.isArray(value)) {
    return value.some((item) => hasHiddenClass(item));
  }

  if (typeof value === 'object') {
    return Object.entries(value).some(([key, enabled]) => {
      return !!enabled && key.split(/\s+/).includes('hidden');
    });
  }

  return false;
}

function handleScroll(e: Event) {
  const el = e.target as HTMLElement;
  const {
    clientHeight,
    clientWidth,
    scrollHeight,
    scrollLeft,
    scrollTop,
    scrollWidth,
  } = el;
  isAtTop.value = scrollTop <= 0;
  isAtBottom.value = Math.ceil(scrollTop + clientHeight) >= scrollHeight;
  isAtLeft.value = scrollLeft <= 0;
  isAtRight.value = Math.ceil(scrollLeft + clientWidth) >= scrollWidth;
  emit('scrollAt', {
    bottom: isAtBottom.value,
    left: isAtLeft.value,
    right: isAtRight.value,
    top: isAtTop.value,
  });
}

/* ============== 悬浮滚动条(仅纵向) ============== */
const MIN_THUMB = 24;
const viewportRef = ref<HTMLElement>();
const contentRef = ref<HTMLElement>();
const thumbSize = ref(0);
const thumbOffset = ref(0);
const thumbActive = ref(false);
const hovering = ref(false);
const dragging = ref(false);
let hideTimer: ReturnType<typeof setTimeout> | undefined;
let resizeObserver: null | ResizeObserver = null;

function updateThumb() {
  const el = viewportRef.value;
  if (!el) {
    return;
  }
  const { clientHeight, scrollHeight, scrollTop } = el;
  // 内容已不需要滚动(例如手风琴收起后变矮):回到顶部并隐藏滚动条
  if (scrollHeight <= clientHeight + 1) {
    if (el.scrollTop !== 0) {
      el.scrollTop = 0;
    }
    thumbSize.value = 0;
    thumbActive.value = false;
    return;
  }
  const track = clientHeight;
  const size = Math.max((clientHeight / scrollHeight) * track, MIN_THUMB);
  const maxOffset = track - size;
  const ratio = scrollTop / (scrollHeight - clientHeight);
  thumbSize.value = size;
  thumbOffset.value = ratio * maxOffset;
}

function showThumb() {
  thumbActive.value = true;
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = undefined;
  }
}

function scheduleHide() {
  if (hideTimer) {
    clearTimeout(hideTimer);
  }
  hideTimer = setTimeout(() => {
    if (!dragging.value && !hovering.value) {
      thumbActive.value = false;
    }
  }, 1200);
}

function onViewportScroll(e: Event) {
  handleScroll(e);
  updateThumb();
  showThumb();
  scheduleHide();
}

function onEnter() {
  hovering.value = true;
  updateThumb();
  showThumb();
}

function onLeave() {
  hovering.value = false;
  scheduleHide();
}

function onThumbPointerDown(e: PointerEvent) {
  const el = viewportRef.value;
  if (!el) {
    return;
  }
  e.preventDefault();
  e.stopPropagation();
  dragging.value = true;
  showThumb();
  const startY = e.clientY;
  const startTop = el.scrollTop;
  const range = el.scrollHeight - el.clientHeight;
  const thumbRange = el.clientHeight - thumbSize.value;

  const onMove = (ev: PointerEvent) => {
    const dy = ev.clientY - startY;
    el.scrollTop = startTop + (thumbRange <= 0 ? 0 : (dy * range) / thumbRange);
  };
  const onUp = () => {
    dragging.value = false;
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    scheduleHide();
  };
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
}

const thumbStyle = computed(
  (): CSSProperties => ({
    height: `${thumbSize.value}px`,
    opacity: thumbActive.value ? '1' : '0',
    pointerEvents: thumbActive.value ? 'auto' : 'none',
    transform: `translateY(${thumbOffset.value}px)`,
  }),
);

onMounted(() => {
  if (!props.overlay) {
    return;
  }
  updateThumb();
  resizeObserver = new ResizeObserver(() => updateThumb());
  if (viewportRef.value) {
    resizeObserver.observe(viewportRef.value);
  }
  if (contentRef.value) {
    resizeObserver.observe(contentRef.value);
  }
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  resizeObserver = null;
  if (hideTimer) {
    clearTimeout(hideTimer);
  }
});
</script>

<template>
  <div
    data-vben-scrollbar-viewport
    :class="
      cn(
        'vben-scrollbar relative',
        {
          'vben-scrollbar--hide-native': hideNativeScrollbar && !overlay,
        },
        props.class,
      )
    "
    :style="
      overlay
        ? { overflow: 'hidden' }
        : {
            overflowX: horizontal ? 'auto' : 'hidden',
            overflowY: horizontal ? 'hidden' : 'auto',
          }
    "
    @scroll="handleScroll"
  >
    <!-- 悬浮滚动条模式:滚动容器内嵌,thumb 置于非滚动层(不污染 scrollHeight) -->
    <template v-if="overlay">
      <div class="relative size-full">
        <div
          ref="viewportRef"
          class="vben-scrollbar--overlay size-full overflow-x-hidden overflow-y-auto"
          @mouseenter="onEnter"
          @mouseleave="onLeave"
          @scroll="onViewportScroll"
        >
          <div ref="contentRef">
            <slot></slot>
          </div>
        </div>
        <div
          v-show="thumbSize > 0"
          :style="thumbStyle"
          class="bg-border absolute top-0 right-0.5 z-20 w-1.5 rounded-full transition-opacity duration-300 will-change-transform"
          @pointerdown="onThumbPointerDown"
        ></div>
      </div>
    </template>

    <!-- 默认模式:原生滚动条 -->
    <template v-else>
      <div
        v-if="showShadowTop"
        :class="{
          'opacity-100': !isAtTop,
          'border-border border-t': shadowBorder && !isAtTop,
        }"
        class="pointer-events-none sticky top-0 z-10 -mb-12 h-12 w-full opacity-0 transition-opacity duration-300"
      ></div>
      <slot></slot>
      <div
        v-if="showShadowBottom"
        :class="{
          'opacity-100': !isAtTop && !isAtBottom,
          'border-border border-b': shadowBorder && !isAtTop && !isAtBottom,
        }"
        class="pointer-events-none sticky bottom-0 z-10 -mt-12 h-12 w-full opacity-0 transition-opacity duration-300"
      ></div>
    </template>
  </div>
</template>

<style scoped>
.vben-scrollbar {
  scrollbar-width: thin;
}

.vben-scrollbar--hide-native {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.vben-scrollbar--hide-native::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}

/* 悬浮模式:隐藏原生滚动条,使其不占用布局宽度 */
.vben-scrollbar--overlay {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.vben-scrollbar--overlay::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}
</style>
