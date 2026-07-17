import { Button } from 'antdv-next';

/* prettier-ignore */
declare module 'vue' {
  export interface GlobalComponents {
    AButton: typeof Button;
    ActionButton: typeof Button;
  }
}

export {};
