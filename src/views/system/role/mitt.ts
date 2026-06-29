import { mitt } from '@/utils';

type Events = {
  reset: void;
  rowClick: string;
};

export const emitter = mitt<Events>();
