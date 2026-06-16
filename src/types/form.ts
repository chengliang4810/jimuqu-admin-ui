import type { Rule } from 'antdv-next/dist/form/types';

export type AntdFormRules<T> = Partial<Record<keyof T, Rule[]>>;
