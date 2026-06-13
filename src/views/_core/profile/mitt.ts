import { mitt } from '@/utils';

type Events = {
  updateProfile: void;
};

export const emitter = mitt<Events>();
