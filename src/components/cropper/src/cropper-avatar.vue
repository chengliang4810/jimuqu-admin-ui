<script lang="ts" setup>
import type { ButtonProps } from 'antdv-next';

import type { CSSProperties } from 'vue';

import { computed, unref } from 'vue';

import { useVbenModal } from '@/core/ui/popup';
import { $t } from '@/locales';

import cropperModal from './cropper-modal.vue';

defineOptions({ name: 'CropperAvatar' });

const props = withDefaults(
  defineProps<{
    btnProps?: ButtonProps;
    btnText?: string;
    showBtn?: boolean;
    size?: number;
    uploadApi: (params: {
      file: Blob;
      filename: string;
      name: string;
    }) => Promise<any>;
    width?: number | string;
  }>(),
  {
    btnProps: () => ({}),
    btnText: '',
    showBtn: true,
    size: 5,
    width: '200px',
  },
);

const emit = defineEmits<{
  change: [payload: { data: any; source: string }];
}>();
const sourceValue = defineModel<string>('value', { default: '' });
const prefixCls = 'cropper-avatar';
const [CropperModal, modalApi] = useVbenModal({
  connectedComponent: cropperModal,
});

const getClass = computed(() => [prefixCls]);

const getWidth = computed(() => `${`${props.width}`.replace(/px/, '')}px`);

const getIconWidth = computed(
  () => `${Number.parseInt(`${props.width}`.replace(/px/, '')) / 2}px`,
);

const getStyle = computed((): CSSProperties => ({ width: unref(getWidth) }));

const getImageWrapperStyle = computed((): CSSProperties => ({
  height: unref(getWidth),
  width: unref(getWidth),
}));

function handleUploadSuccess({ data, source }: any) {
  sourceValue.value = source;
  emit('change', { data, source });
  window.message.success($t('component.cropper.uploadSuccess'));
}

const closeModal = () => modalApi.close();
const openModal = () => modalApi.open();

defineExpose({
  closeModal,
  openModal,
});
</script>
<template>
  <div :class="getClass" :style="getStyle">
    <div
      :class="`${prefixCls}-image-wrapper`"
      :style="getImageWrapperStyle"
      @click="openModal"
    >
      <div :class="`${prefixCls}-image-mask`" :style="getImageWrapperStyle">
        <span
          :style="{
            ...getImageWrapperStyle,
            width: `${getIconWidth}`,
            height: `${getIconWidth}`,
            lineHeight: `${getIconWidth}`,
          }"
          class="icon-[ant-design--cloud-upload-outlined] text-[#d6d6d6]"
        ></span>
      </div>
      <img v-if="sourceValue" :src="sourceValue" alt="avatar" />
    </div>
    <a-button
      v-if="showBtn"
      :class="`${prefixCls}-upload-btn`"
      @click="openModal"
      v-bind="btnProps"
    >
      {{ btnText ? btnText : $t('component.cropper.selectImage') }}
    </a-button>

    <CropperModal
      :size="size"
      :src="sourceValue"
      :upload-api="uploadApi"
      @upload-success="handleUploadSuccess"
    />
  </div>
</template>

<style lang="scss" scoped>
.cropper-avatar {
  display: inline-block;
  text-align: center;

  &-image-wrapper {
    overflow: hidden;
    cursor: pointer;
    background: #fff;
    border: 1px solid #eee;
    border-radius: 50%;

    img {
      width: 100%;
    }
  }

  &-image-mask {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    width: inherit;
    height: inherit;
    cursor: pointer;
    background: rgb(0 0 0 / 40%);
    border: inherit;
    border-radius: inherit;
    opacity: 0;
    transition: opacity 0.4s;

    ::v-deep(svg) {
      margin: auto;
    }
  }

  &-image-mask:hover {
    opacity: 40;
  }

  &-upload-btn {
    margin: 10px auto;
  }
}
</style>
