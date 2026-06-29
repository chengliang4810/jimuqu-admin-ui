import { mitt } from '@/utils';

type Events = {
  reset: void;
  rowClick: any;
};

export const emitter = mitt<Events>();
