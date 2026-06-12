import { ref } from 'vue';

export function useImageType() {
  const imageListTypes = ['text', 'picture', 'picture-card'] as const;
  const imageListOptions = imageListTypes.map((str) => ({
    label: str,
    value: str,
  }));

  const currentImageListType =
    ref<(typeof imageListTypes)[number]>('picture-card');

  return {
    imageListOptions,
    currentImageListType,
  };
}

export function useFileType() {
  const fileListTypes = ['text', 'picture'] as const;
  const fileListOptions = fileListTypes.map((str) => ({
    label: str,
    value: str,
  }));

  const currentFileListType = ref<(typeof fileListTypes)[number]>('picture');

  return {
    fileListOptions,
    currentFileListType,
  };
}
