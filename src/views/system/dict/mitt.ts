import { mitt } from '@/utils';

/**
 * dictType: string
 */
type Events = {
  reset: void;
  rowClick: string;
};

export const emitter = mitt<Events>();
