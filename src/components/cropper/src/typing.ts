import type CropperType from 'cropperjs';

export interface CropendResult {
  imgBase64: string;
  imgInfo: { height: number; width: number; x: number; y: number };
}

export type Cropper = CropperType;
