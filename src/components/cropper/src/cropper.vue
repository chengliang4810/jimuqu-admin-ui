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
<cropper-canvas background style="--ant-color-primary: rgba(0,0,0,0.6);border-radius: 6px;">
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

function init() {
  const imgEl = unref(imgElRef);
  if (!imgEl) {
    return;
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
  // 不给 $ready 传 callback:cropperjs v2 内部对 callback 分支的 promise 未挂
  // .catch(见 dist 中 `promise.then(callback)`),图片加载失败(跨域被 CORS
  // 拦截、404 等)会抛 Uncaught (in promise) Failed to load the image source。
  // 这里改用它返回的 promise 自行接管成败:既驱动居中,又能静默走 readyError。
  image
    ?.$ready()
    .then(() => {
      // v2 的初始自动居中($center)依赖 getBoundingClientRect 读取 canvas 的实时
      // 像素尺寸。若此刻容器正处于弹窗进场动画(transform: scale)中,读到的是被
      // 缩放的中间态,算出的居中平移量每次都不同 → 图片落点随机。这里等容器尺寸
      // 连续两帧稳定(动画结束)后再主动重新居中并复位选区,消除竞态。
      centerWhenStable(() => {
        realTimeCroppered();
        emit('ready', cropper.value);
      });
    })
    .catch(() => {
      // 图片加载失败,交给上层给出可见反馈(关 loading + 提示)。
      emit('readyError');
    });
}

// 等 canvas 尺寸稳定后重新居中图片、复位选区,规避进场动画期间的居中竞态
function centerWhenStable(done: () => void) {
  let prevKey = '';
  let stableCount = 0;
  const tick = () => {
    const instance = cropper.value;
    const image = instance?.getCropperImage();
    const canvas = instance?.getCropperCanvas();
    if (!instance || !image || !canvas) {
      return;
    }
    const rect = canvas.getBoundingClientRect();
    const key = `${rect.width}x${rect.height}x${rect.x}x${rect.y}`;
    if (key === prevKey) {
      stableCount += 1;
    } else {
      stableCount = 0;
      prevKey = key;
    }
    // 连续两帧尺寸/位置不变即认为动画结束、布局稳定
    if (stableCount >= 2) {
      image.$center('contain');
      instance.getCropperSelection()?.$reset();
      done();
      return;
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// 实时预览输出上限:右侧预览容器 220px,256px 足够清晰且 png 编码快,避免每帧
// 生成原图分辨率大 canvas 阻塞主线程导致拖动卡顿。上传时另取原图分辨率版本。
const PREVIEW_MAX_SIZE = 256;

// Real-time display preview
async function realTimeCroppered() {
  if (!props.realTimePreview) {
    return;
  }
  const instance = cropper.value;
  const selection = instance?.getCropperSelection();
  const imgBase64 = await croppered(PREVIEW_MAX_SIZE);
  if (!imgBase64 || !selection) {
    return;
  }
  emit('cropend', {
    imgBase64,
    imgInfo: {
      height: selection.height,
      width: selection.width,
      x: selection.x,
      y: selection.y,
    },
  });
}

// 按原图分辨率计算选区输出 canvas 尺寸,对齐 v1 getCroppedCanvas 的默认行为。
// maxSize 用来限制实时预览的输出尺寸,避免每帧生成大 canvas + png 编码阻塞主线程。
function getCanvasSizeOptions(
  instance: Cropper,
  selection: CropperSelection,
  maxSize?: number,
): { height?: number; width?: number } {
  const image = instance.getCropperImage();
  const img = image?.$image;
  const selWidth = selection.width;
  if (!image || !img || !selWidth || !img.naturalWidth || !img.naturalHeight) {
    return {};
  }
  const rect = image.getBoundingClientRect();
  if (!rect.width || !rect.height) {
    return {};
  }
  // 等比变换下两者相等;旋转时 image 包围盒会变大、scale 偏小,输出略小但仍清晰
  const scale = Math.min(
    img.naturalWidth / rect.width,
    img.naturalHeight / rect.height,
  );
  const target = Math.round(selWidth * scale);
  const maxSide = Math.min(img.naturalWidth, img.naturalHeight);
  // 选区为 1:1 正方形,输出边长:不低于选区 CSS 尺寸,不高于原图短边
  let size = Math.max(selWidth, Math.min(target, maxSide));
  if (maxSize && size > maxSize) {
    size = maxSize;
  }
  return { width: size, height: size };
}

// event: return base64 and width and height information after cropping
async function croppered(maxSize?: number): Promise<string> {
  const instance = cropper.value;
  const selection = instance?.getCropperSelection();
  if (!instance || !selection) {
    return '';
  }
  // v2 的 $toCanvas() 默认按选区 CSS 像素尺寸输出(裁剪区 300px 高,选区约 150px),
  // 远小于原图分辨率;上传后存的就是这张小图,下次回显显示到 220px 预览即糊(v1 按
  // 原图分辨率输出约 613px,无此问题)。这里按原图分辨率重采样:用 naturalWidth 与
  // 图片当前显示尺寸算出"每 CSS 像素对应多少原图像素",乘选区 CSS 边长得目标输出,
  // 并封顶在原图短边内(超出即上采样,反而更糊)。maxSize 用于实时预览限速。
  const canvasOptions = getCanvasSizeOptions(instance, selection, maxSize);
  let canvas: HTMLCanvasElement;
  try {
    canvas = props.circled
      ? await getRoundedCanvas(selection, canvasOptions)
      : await selection.$toCanvas(canvasOptions);
  } catch {
    emit('cropendError');
    return '';
  }
  return new Promise<string>((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        resolve('');
        return;
      }
      const fileReader: FileReader = new FileReader();
      fileReader.onloadend = (e) => {
        resolve((e.target?.result as string) ?? '');
      };
      fileReader.onerror = () => {
        emit('cropendError');
        resolve('');
      };
      fileReader.readAsDataURL(blob);
    }, 'image/png');
  });
}

// 上传时调用:取原图分辨率(不限 maxSize)的裁剪结果,保证存高清
defineExpose({
  getCroppedDataURL: () => croppered(),
});

// Get a circular picture canvas
async function getRoundedCanvas(
  selection: CropperSelection,
  options: { height?: number; width?: number } = {},
) {
  const sourceCanvas = await selection.$toCanvas(options);
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

    // grid 内部的 # 分割线是直线,撑满 bounding box 后端点落在正方形边上、圆之外,
    // 会呈现"外方"观感。border-radius 不裁子元素,这里用 overflow:hidden 裁掉,
    // 使其只剩圆边框。handle 不在 grid 内(挂在 selection 上),不受影响。
    cropper-grid {
      overflow: hidden;
    }
  }
}
</style>
