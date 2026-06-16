import type { Component } from 'vue';

import { computed, defineComponent, h } from 'vue';

import { $t } from '@/locales';
import {
  AutoComplete,
  Cascader,
  Input,
  InputNumber,
  InputPassword,
  Mentions,
  Select,
  TextArea,
  TreeSelect,
} from 'antdv-next';

type PlaceholderType = 'input' | 'select';

const withDefaultPlaceholder = <T extends Component>(
  component: T,
  type: PlaceholderType,
): T => {
  return defineComponent({
    name: component.name,
    inheritAttrs: false,
    setup: (_props, { attrs, slots }) => {
      const computedPlaceholder = computed(() => {
        return attrs?.placeholder || $t(`ui.placeholder.${type}`);
      });

      return () =>
        h(
          component,
          {
            ...attrs,
            placeholder: computedPlaceholder.value,
          },
          slots,
        );
    },
  }) as unknown as T;
};

export const FormAutoComplete = withDefaultPlaceholder(AutoComplete, 'input');
export const FormCascader = withDefaultPlaceholder(Cascader, 'select');
export const FormInput = withDefaultPlaceholder(Input, 'input');
export const FormInputNumber = withDefaultPlaceholder(InputNumber, 'input');
export const FormInputPassword = withDefaultPlaceholder(InputPassword, 'input');
export const FormMentions = withDefaultPlaceholder(Mentions, 'input');
export const FormSelect = withDefaultPlaceholder(Select, 'select');
export const FormTextArea = withDefaultPlaceholder(TextArea, 'input');
export const FormTreeSelect = withDefaultPlaceholder(TreeSelect, 'select');
