<script lang="ts" setup>
import type { CropendResult, Cropper } from './typing';

import { ref } from 'vue';

import { useVbenModal } from '@/core/ui/popup';
import { $t as t } from '@/locales';
import { dataURLtoBlob } from '@/utils/file/base64Conver';
import { Avatar, Space, Tooltip, Upload } from 'antdv-next';
import { isFunction } from 'lodash-es';

import CropperImage from './cropper.vue';

type apiFunParams = { file: Blob; filename: string; name: string };

defineOptions({ name: 'CropperModal' });

const props = withDefaults(
  defineProps<{
    circled?: boolean;
    size?: number;
    src?: string;
    uploadApi: (params: apiFunParams) => Promise<any>;
  }>(),
  {
    circled: true,
    size: 0,
    src: '',
  },
);

const emit = defineEmits(['uploadSuccess', 'uploadError', 'register']);

let filename = '';
const src = ref(props.src || '');
const previewSource = ref('');
const cropper = ref<Cropper>();
// CropperImage 组件实例,handleOk 时取原图分辨率裁剪结果(非预览小图)
const cropperRef = ref();
// 图片是否真正加载就绪。src 有值只代表"有源",不代表加载成功(如跨域被拦)。
// 变换类操作(旋转/缩放/翻转/重置)必须以此为准,避免对未加载出的图做操作。
const ready = ref(false);

const prefixCls = 'cropper-am';
const [BasicModal, modalApi] = useVbenModal({
  onConfirm: handleOk,
  onOpenChange(isOpen) {
    if (isOpen) {
      // 每次打开从 props 同步回显图,保证下方关闭时清空 src 后仍能恢复
      src.value = props.src || '';
      ready.value = false;
      // 有图才 loading,等 CropperImage 的 @ready 关掉;无图时 CropperImage 因 v-if=src
      // 不渲染,@ready 永不触发,会一直转圈,所以这里直接关 loading。
      modalLoading(!!src.value);
    } else {
      // 关闭时清空 src,让 CropperImage(v-if=src)立即卸载。否则 antd Modal 的
      // zoom-leave 关闭动画会对弹窗做 transform 缩放,而 live 的 cropper 图片用绝对
      // 像素矩阵定位,两者叠加会让图片相对裁剪框突然变大/错位。卸载后关闭动画期间
      // 只剩灰色棋盘格,无变形。同时清空右侧预览。
      src.value = '';
      previewSource.value = '';
      ready.value = false;
      modalLoading(false);
    }
  },
});

function modalLoading(loading: boolean) {
  modalApi.setState({ confirmLoading: loading, loading });
}

// Block upload
function handleBeforeUpload(file: File) {
  if (props.size > 0 && file.size > 1024 * 1024 * props.size) {
    emit('uploadError', { msg: t('component.cropper.imageTooBig') });
    return false;
  }
  const reader = new FileReader();
  reader.readAsDataURL(file);
  src.value = '';
  previewSource.value = '';
  ready.value = false;
  reader.addEventListener('load', (e) => {
    src.value = (e.target?.result as string) ?? '';
    filename = file.name;
  });
  return false;
}

function handleCropend({ imgBase64 }: CropendResult) {
  previewSource.value = imgBase64;
}

function handleReady(cropperInstance: Cropper) {
  cropper.value = cropperInstance;
  ready.value = true;
  // 画布加载完毕 关闭loading
  modalLoading(false);
}

function handleReadyError() {
  ready.value = false;
  modalLoading(false);
  // 原图加载失败(常见于回显的跨域头像未授权 CORS,或图片已失效)。给出可见
  // 提示,避免弹窗只剩空白棋盘格、用户无从判断。重新上传本地图片不受影响。
  window.message.warning(t('component.cropper.imageLoadError'));
}

function handlerToolbar(event: string, arg?: number) {
  const instance = cropper.value;
  const image = instance?.getCropperImage();
  const selection = instance?.getCropperSelection();
  if (!image) {
    return;
  }
  // v2: 图片变换作用于 cropper-image,选区重置作用于 cropper-selection
  switch (event) {
    case 'reset': {
      image.$resetTransform();
      selection?.$reset();
      break;
    }
    case 'rotate': {
      // arg 为角度(-45 / 45),v2 接受 '45deg' 形式
      image.$rotate(`${arg}deg`);
      break;
    }
    case 'scaleX': {
      // 水平翻转
      image.$scale(-1, 1);
      break;
    }
    case 'scaleY': {
      // 垂直翻转
      image.$scale(1, -1);
      break;
    }
    case 'zoom': {
      image.$zoom(Number(arg));
      break;
    }
  }
}

async function handleOk() {
  const uploadApi = props.uploadApi;
  if (uploadApi && isFunction(uploadApi)) {
    try {
      modalLoading(true);
      // 上传取原图分辨率版本(非预览小图),保证存高清
      const hd = await cropperRef.value?.getCroppedDataURL();
      if (!hd) {
        window.message.warning('未选择图片');
        return;
      }
      const blob = dataURLtoBlob(hd);
      const result = await uploadApi({ file: blob, filename, name: 'file' });
      emit('uploadSuccess', { data: result.url, source: hd });
      modalApi.close();
    } finally {
      modalLoading(false);
    }
  }
}
</script>
<template>
  <BasicModal
    v-bind="$attrs"
    :confirm-text="t('component.cropper.okText')"
    :fullscreen-button="false"
    :title="t('component.cropper.modalTitle')"
    :width="800"
  >
    <div :class="prefixCls">
      <div :class="`${prefixCls}-left`" class="w-full">
        <div :class="`${prefixCls}-cropper`">
          <CropperImage
            v-if="src"
            ref="cropperRef"
            :circled="circled"
            :src="src"
            crossorigin="anonymous"
            height="300px"
            @cropend="handleCropend"
            @ready="handleReady"
            @ready-error="handleReadyError"
          />
        </div>

        <div :class="`${prefixCls}-toolbar`">
          <Upload
            :before-upload="handleBeforeUpload"
            :file-list="[]"
            accept="image/*"
          >
            <Tooltip
              :title="t('component.cropper.selectImage')"
              placement="bottom"
            >
              <a-button size="small" type="primary">
                <template #icon>
                  <div class="flex items-center justify-center">
                    <span class="icon-[ant-design--upload-outlined]"></span>
                  </div>
                </template>
              </a-button>
            </Tooltip>
          </Upload>
          <Space>
            <Tooltip
              :title="t('component.cropper.btn_reset')"
              placement="bottom"
            >
              <a-button
                :disabled="!ready"
                size="small"
                type="primary"
                @click="handlerToolbar('reset')"
              >
                <template #icon>
                  <div class="flex items-center justify-center">
                    <span class="icon-[ant-design--reload-outlined]"></span>
                  </div>
                </template>
              </a-button>
            </Tooltip>
            <Tooltip
              :title="t('component.cropper.btn_rotate_left')"
              placement="bottom"
            >
              <a-button
                :disabled="!ready"
                size="small"
                type="primary"
                @click="handlerToolbar('rotate', -45)"
              >
                <template #icon>
                  <div class="flex items-center justify-center">
                    <span
                      class="icon-[ant-design--rotate-left-outlined]"
                    ></span>
                  </div>
                </template>
              </a-button>
            </Tooltip>
            <Tooltip
              :title="t('component.cropper.btn_rotate_right')"
              placement="bottom"
            >
              <a-button
                :disabled="!ready"
                pre-icon="ant-design:rotate-right-outlined"
                size="small"
                type="primary"
                @click="handlerToolbar('rotate', 45)"
              >
                <template #icon>
                  <div class="flex items-center justify-center">
                    <span
                      class="icon-[ant-design--rotate-right-outlined]"
                    ></span>
                  </div>
                </template>
              </a-button>
            </Tooltip>
            <Tooltip
              :title="t('component.cropper.btn_scale_x')"
              placement="bottom"
            >
              <a-button
                :disabled="!ready"
                size="small"
                type="primary"
                @click="handlerToolbar('scaleX')"
              >
                <template #icon>
                  <div class="flex items-center justify-center">
                    <span class="icon-[vaadin--arrows-long-h]"></span>
                  </div>
                </template>
              </a-button>
            </Tooltip>
            <Tooltip
              :title="t('component.cropper.btn_scale_y')"
              placement="bottom"
            >
              <a-button
                :disabled="!ready"
                size="small"
                type="primary"
                @click="handlerToolbar('scaleY')"
              >
                <template #icon>
                  <div class="flex items-center justify-center">
                    <span class="icon-[vaadin--arrows-long-v]"></span>
                  </div>
                </template>
              </a-button>
            </Tooltip>
            <Tooltip
              :title="t('component.cropper.btn_zoom_in')"
              placement="bottom"
            >
              <a-button
                :disabled="!ready"
                size="small"
                type="primary"
                @click="handlerToolbar('zoom', 0.1)"
              >
                <template #icon>
                  <div class="flex items-center justify-center">
                    <span class="icon-[ant-design--zoom-in-outlined]"></span>
                  </div>
                </template>
              </a-button>
            </Tooltip>
            <Tooltip
              :title="t('component.cropper.btn_zoom_out')"
              placement="bottom"
            >
              <a-button
                :disabled="!ready"
                size="small"
                type="primary"
                @click="handlerToolbar('zoom', -0.1)"
              >
                <template #icon>
                  <div class="flex items-center justify-center">
                    <span class="icon-[ant-design--zoom-out-outlined]"></span>
                  </div>
                </template>
              </a-button>
            </Tooltip>
          </Space>
        </div>
      </div>
      <div :class="`${prefixCls}-right`">
        <div :class="`${prefixCls}-preview`">
          <img
            v-if="previewSource"
            :alt="t('component.cropper.preview')"
            :src="previewSource"
          />
        </div>
        <template v-if="previewSource">
          <div :class="`${prefixCls}-group`">
            <Avatar :src="previewSource" size="large" />
            <Avatar :size="48" :src="previewSource" />
            <Avatar :size="64" :src="previewSource" />
            <Avatar :size="80" :src="previewSource" />
          </div>
        </template>
      </div>
    </div>
  </BasicModal>
</template>

<style lang="scss">
.cropper-am {
  display: flex;

  &-left,
  &-right {
    height: 340px;
  }

  &-left {
    width: 55%;
  }

  &-right {
    width: 45%;
  }

  &-cropper {
    height: 300px;
    background: #eee;
    background-image:
      linear-gradient(
        45deg,
        rgb(0 0 0 / 25%) 25%,
        transparent 0,
        transparent 75%,
        rgb(0 0 0 / 25%) 0
      ),
      linear-gradient(
        45deg,
        rgb(0 0 0 / 25%) 25%,
        transparent 0,
        transparent 75%,
        rgb(0 0 0 / 25%) 0
      );
    background-position:
      0 0,
      12px 12px;
    background-size: 24px 24px;
  }

  &-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 10px;
  }

  &-preview {
    width: 220px;
    height: 220px;
    margin: 0 auto;
    overflow: hidden;
    border: 1px solid #eee;
    border-radius: 50%;

    img {
      width: 100%;
      height: 100%;
    }
  }

  &-group {
    display: flex;
    align-items: center;
    justify-content: space-around;
    padding-top: 8px;
    margin-top: 8px;
    border-top: 1px solid #eee;
  }
}
</style>
