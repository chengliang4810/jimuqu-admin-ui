import type { WatermarkProps } from 'antdv-next';

import { nextTick, onUnmounted, ref, shallowReadonly } from 'vue';

interface WatermarkState {
  props: WatermarkProps;
  visible: boolean;
}

const watermark = ref<WatermarkState>({
  props: {},
  visible: false,
});
const unmountedHooked = ref<boolean>(false);
const cachedOptions = ref<Partial<WatermarkProps>>({});

function normalizeContent(content: WatermarkProps['content']) {
  if (typeof content === 'string' && content.includes('\n')) {
    return content.split(/\r?\n/).filter(Boolean);
  }

  return content;
}

function normalizeWatermarkProps(
  options: Partial<WatermarkProps>,
): WatermarkProps {
  return {
    content: normalizeContent(options.content),
    height: options.height,
    image: options.image,
    inherit: false,
    offset: options.offset,
    rotate: options.rotate,
    width: options.width,
    zIndex: options.zIndex,
  };
}

export function useWatermark() {
  async function initWatermark(options: Partial<WatermarkProps>) {
    cachedOptions.value = {
      ...cachedOptions.value,
      ...options,
    };
    watermark.value = {
      props: normalizeWatermarkProps(cachedOptions.value),
      visible: true,
    };
  }

  async function updateWatermark(options: Partial<WatermarkProps>) {
    await nextTick();
    await initWatermark(options);
  }

  function destroyWatermark() {
    watermark.value = {
      props: normalizeWatermarkProps(cachedOptions.value),
      visible: false,
    };
  }

  // 只在第一次调用时注册卸载钩子，防止重复注册以致于在路由切换时销毁了水印
  if (!unmountedHooked.value) {
    unmountedHooked.value = true;
    onUnmounted(() => {
      destroyWatermark();
    });
  }

  return {
    destroyWatermark,
    updateWatermark,
    watermark: shallowReadonly(watermark),
  };
}
