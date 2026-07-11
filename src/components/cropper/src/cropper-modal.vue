<script lang="ts" setup>
import type { CropendResult, Cropper } from './typing';

import { ref } from 'vue';

import { useVbenModal } from '@/core/ui/popup';
import { $t } from '@/locales';
import { cn } from '@/utils/cn';
import { dataURLtoBlob } from '@/utils/file/base64Conver';
import { Avatar, Space, Tooltip, Upload } from 'antdv-next';
import { isFunction } from 'lodash-es';

import CropperImage from './cropper.vue';

type apiFunParams = { file: Blob; filename: string; name: string };

defineOptions({ name: 'CropperModal' });

const props = withDefaults(
  defineProps<{
    /** 是否圆形裁剪 */
    circled?: boolean;
    /** 上传体积上限(MB),0 表示不限制 */
    size?: number;
    /** 回显图片源(base64 或 url) */
    src?: string;
    /** 上传接口,返回值需包含 url 字段 */
    uploadApi: (params: apiFunParams) => Promise<{ url: string }>;
  }>(),
  {
    circled: true,
    size: 0,
    src: '',
  },
);

const emit = defineEmits<{
  /** 暴露给 useVbenModal 的注册事件(当前未实际 emit,保留以兼容约定) */
  register: [];
  /** 上传前校验失败(超体积等),返回错误信息 */
  uploadError: [payload: { msg: string }];
  /** 上传成功,返回服务端 url 与裁剪源(base64) */
  uploadSuccess: [payload: { data: string; source: string }];
}>();

let filename = '';
const src = ref(props.src || '');
const previewSource = ref('');
const cropper = ref<Cropper>();
// CropperImage 组件实例,handleOk 时取原图分辨率裁剪结果(非预览小图)
const cropperRef = ref();
// 图片是否真正加载就绪。src 有值只代表"有源",不代表加载成功(如跨域被拦)。
// 变换类操作(旋转/缩放/翻转/重置)必须以此为准,避免对未加载出的图做操作。
const ready = ref(false);

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
    emit('uploadError', { msg: $t('component.cropper.imageTooBig') });
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
  window.message.warning($t('component.cropper.imageLoadError'));
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
    :confirm-text="$t('component.cropper.okText')"
    :fullscreen-button="false"
    :title="$t('component.cropper.modalTitle')"
    :width="800"
  >
    <div class="flex">
      <div class="h-[340px] w-[55%]">
        <div
          :class="
            cn(
              'h-[300px] bg-[#eee]',
              'bg-[image:linear-gradient(45deg,rgb(0_0_0/25%)_25%,transparent_0,transparent_75%,rgb(0_0_0/25%)_0),linear-gradient(45deg,rgb(0_0_0/25%)_25%,transparent_0,transparent_75%,rgb(0_0_0/25%)_0)]',
              'bg-[size:24px_24px] bg-[position:0_0,12px_12px]',
            )
          "
        >
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

        <div class="mt-2.5 flex items-center justify-between">
          <Upload
            :before-upload="handleBeforeUpload"
            :file-list="[]"
            accept="image/*"
          >
            <Tooltip
              :title="$t('component.cropper.selectImage')"
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
              :title="$t('component.cropper.btn_reset')"
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
              :title="$t('component.cropper.btn_rotate_left')"
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
              :title="$t('component.cropper.btn_rotate_right')"
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
              :title="$t('component.cropper.btn_scale_x')"
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
              :title="$t('component.cropper.btn_scale_y')"
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
              :title="$t('component.cropper.btn_zoom_in')"
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
              :title="$t('component.cropper.btn_zoom_out')"
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
      <div class="h-[340px] w-[45%]">
        <div
          class="mx-auto size-[220px] overflow-hidden rounded-full border border-[#eee]"
        >
          <img
            v-if="previewSource"
            class="h-full w-full"
            :alt="$t('component.cropper.preview')"
            :src="previewSource"
          />
        </div>
        <template v-if="previewSource">
          <div
            class="mt-2 flex items-center justify-around border-t border-[#eee] pt-2"
          >
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
