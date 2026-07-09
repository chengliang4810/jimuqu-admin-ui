<script lang="ts" setup>
import type { CropperOptions, CropperSelection } from 'cropperjs';

import type { CSSProperties, ImgHTMLAttributes } from 'vue';

import { computed, onMounted, onUnmounted, ref, unref, useAttrs } from 'vue';

import { useDebounceFn } from '@vueuse/core';
import Cropper from 'cropperjs';

defineOptions({ name: 'CropperImage' });

const props = withDefaults(defineProps<Props>(), {
  alt: '',
  circled: false,
  crossorigin: undefined,
  height: '360px',
  imageStyle: () => ({}),
  options: () => ({}),
  realTimePreview: true,
});

const emit = defineEmits(['cropend', 'ready', 'cropendError', 'readyError']);

interface Props {
  alt?: ImgHTMLAttributes['alt'];
  circled?: boolean;
  crossorigin?: ImgHTMLAttributes['crossorigin'];
  height?: number | string;
  imageStyle?: CSSProperties;
  options?: CropperOptions;
  realTimePreview?: boolean;
  src: string;
}

const attrs = useAttrs();

type ElRef<T extends HTMLElement = HTMLDivElement> = null | T;
const imgElRef = ref<ElRef<HTMLImageElement>>();
const cropper = ref<Cropper | null>();

const prefixCls = 'cropper-image';
const debounceRealTimeCroppered = useDebounceFn(realTimeCroppered, 80);

// v2 模板:图片可旋转/缩放/翻转/平移,选区固定 1:1 比例、可移动可缩放。
// circled 时去掉 outline(矩形描边),改由 grid 的圆角虚线呈现选区边界。
// --ant-color-primary会影响背景色 原因未知 这里必须指定为灰色 防止被primary影响
const buildTemplate = (circled: boolean) => `
<cropper-canvas background style="--ant-color-primary: rgba(0,0,0,0.6);">
  <cropper-image rotatable scalable translatable></cropper-image>
  <cropper-shade hidden theme-color="transparent"></cropper-shade>
  <cropper-handle action="select" plain theme-color="transparent"></cropper-handle>
  <cropper-selection aspect-ratio="1" initial-coverage="0.5" movable resizable${
    circled ? '' : ' outlined'
  } theme-color="rgba(255, 255, 255, 0.5)">
    <cropper-grid
      role="grid"
      bordered
      covered
      theme-color="rgba(255, 255, 255, 0.5)"
    ></cropper-grid>
    <cropper-crosshair centered></cropper-crosshair>
    <cropper-handle action="move" theme-color="rgba(255, 255, 255, 0.35)"></cropper-handle>
    <cropper-handle action="n-resize" theme-color="rgba(255, 255, 255, 0.5)"></cropper-handle>
    <cropper-handle action="e-resize" theme-color="rgba(255, 255, 255, 0.5)"></cropper-handle>
    <cropper-handle action="s-resize" theme-color="rgba(255, 255, 255, 0.5)"></cropper-handle>
    <cropper-handle action="w-resize" theme-color="rgba(255, 255, 255, 0.5)"></cropper-handle>
    <cropper-handle action="ne-resize" theme-color="rgba(255, 255, 255, 0.5)"></cropper-handle>
    <cropper-handle action="nw-resize" theme-color="rgba(255, 255, 255, 0.5)"></cropper-handle>
    <cropper-handle action="se-resize" theme-color="rgba(255, 255, 255, 0.5)"></cropper-handle>
    <cropper-handle action="sw-resize" theme-color="rgba(255, 255, 255, 0.5)"></cropper-handle>
  </cropper-selection>
</cropper-canvas>`;

const getClass = computed(() => [
  prefixCls,
  attrs.class,
  {
    [`${prefixCls}--circled`]: props.circled,
  },
]);

// v2 会把原图 display:none 并在其后插入 cropper-canvas,因此 wrapper 的高度/样式
// 即裁剪区样式。原图仅作为 src 来源,始终隐藏。
const getWrapperStyle = computed((): CSSProperties => ({
  height: `${`${props.height}`.replace(/px/, '')}px`,
  ...props.imageStyle,
}));

onMounted(init);

onUnmounted(() => {
  cropper.value?.destroy();
});

async function init() {
  const imgEl = unref(imgElRef);
  if (!imgEl) {
    return;
  }
  // 判断是否为正常访问的图片
  try {
    const resp = await fetch(props.src);
    if (resp.status !== 200) {
      emit('readyError');
    }
  } catch {
    emit('readyError');
  }
  cropper.value = new Cropper(imgEl, {
    template: buildTemplate(props.circled),
    ...props.options,
  });
  const image = cropper.value.getCropperImage();
  const selection = cropper.value.getCropperSelection();
  // 选区移动/缩放 或 图片变换(旋转/缩放/翻转)时,实时刷新预览
  image?.addEventListener('transform', () => debounceRealTimeCroppered());
  selection?.addEventListener('change', () => debounceRealTimeCroppered());
  image?.$ready(() => {
    realTimeCroppered();
    emit('ready', cropper.value);
  });
}

// Real-time display preview
function realTimeCroppered() {
  if (props.realTimePreview) {
    croppered();
  }
}

// event: return base64 and width and height information after cropping
async function croppered() {
  const instance = cropper.value;
  const selection = instance?.getCropperSelection();
  if (!instance || !selection) {
    return;
  }
  const imgInfo = {
    height: selection.height,
    width: selection.width,
    x: selection.x,
    y: selection.y,
  };
  let canvas: HTMLCanvasElement;
  try {
    canvas = props.circled
      ? await getRoundedCanvas(selection)
      : await selection.$toCanvas();
  } catch {
    emit('cropendError');
    return;
  }
  canvas.toBlob((blob) => {
    if (!blob) {
      return;
    }
    const fileReader: FileReader = new FileReader();
    fileReader.readAsDataURL(blob);
    fileReader.onloadend = (e) => {
      emit('cropend', {
        imgBase64: e.target?.result ?? '',
        imgInfo,
      });
    };
    fileReader.onerror = () => {
      emit('cropendError');
    };
  }, 'image/png');
}

// Get a circular picture canvas
async function getRoundedCanvas(selection: CropperSelection) {
  const sourceCanvas = await selection.$toCanvas();
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d')!;
  const width = sourceCanvas.width;
  const height = sourceCanvas.height;
  canvas.width = width;
  canvas.height = height;
  context.imageSmoothingEnabled = true;
  context.drawImage(sourceCanvas, 0, 0, width, height);
  context.globalCompositeOperation = 'destination-in';
  context.beginPath();
  context.arc(
    width / 2,
    height / 2,
    Math.min(width, height) / 2,
    0,
    2 * Math.PI,
    true,
  );
  context.fill();
  return canvas;
}
</script>
<template>
  <div :class="getClass" :style="getWrapperStyle">
    <img
      ref="imgElRef"
      :alt="alt"
      :crossorigin="crossorigin"
      :src="src"
      style="display: none"
    />
  </div>
</template>
<style lang="scss">
.cropper-image {
  cropper-canvas {
    width: 100%;
    height: 100%;
  }

  // cropperjs 的 selection outline 默认色不走 theme-color 属性(实测会回落到一个偏蓝的
  // 系统/默认值,接近主题色),会与白色 grid 不协调。这里显式钉成白色半透明,与 grid 一致。
  cropper-selection[outlined] {
    outline-color: rgb(255 255 255 / 50%) !important;
  }

  &--circled {
    cropper-selection,
    cropper-grid {
      border-radius: 50%;
    }
  }
}
</style>
