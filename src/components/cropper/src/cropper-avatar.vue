<script lang="ts" setup>
import type { ButtonProps } from 'antdv-next';

import type { CSSProperties } from 'vue';

import { computed, unref } from 'vue';

import { useVbenModal } from '@/core/ui/popup';
import { $t } from '@/locales';
import { cn } from '@/utils/cn';

import cropperModal from './cropper-modal.vue';

defineOptions({ name: 'CropperAvatar' });

const props = withDefaults(
  defineProps<{
    /** 触发按钮的 antd Button 属性透传 */
    btnProps?: ButtonProps;
    /** 自定义按钮文案,留空走 i18n 默认 */
    btnText?: string;
    /** 是否显示触发按钮 */
    showBtn?: boolean;
    /** 上传体积上限(MB),透传给裁剪弹窗 */
    size?: number;
    /**
     * 上传接口,返回值需包含 url 字段
     * @param params.file 裁剪后的 Blob
     * @param params.filename 文件名
     * @param params.name 字段名
     */
    uploadApi: (params: {
      file: Blob;
      filename: string;
      name: string;
    }) => Promise<any>;
    /** 头像容器宽高(数值或带 px 字符串) */
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
  /** 上传成功后触发,返回服务端 url 与裁剪源(base64) */
  change: [payload: { data: any; source: string }];
}>();
/** v-model:value 双向绑定的头像源(base64 或 url) */
const sourceValue = defineModel<string>('value', { default: '' });
const [CropperModal, modalApi] = useVbenModal({
  connectedComponent: cropperModal,
});

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
  <div class="inline-block text-center" :style="getStyle">
    <div
      :class="
        cn(
          'relative cursor-pointer overflow-hidden',
          'rounded-full border border-[#eee] bg-white',
        )
      "
      :style="getImageWrapperStyle"
      @click="openModal"
    >
      <div
        :class="
          cn(
            'absolute flex cursor-pointer items-center justify-center',
            'rounded-full border border-[#eee] bg-black/40',
            'opacity-0 transition-opacity duration-[400ms] hover:opacity-40',
          )
        "
        :style="getImageWrapperStyle"
      >
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
      <img v-if="sourceValue" class="w-full" :src="sourceValue" alt="avatar" />
    </div>
    <a-button
      v-if="showBtn"
      class="mx-auto my-2.5"
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
