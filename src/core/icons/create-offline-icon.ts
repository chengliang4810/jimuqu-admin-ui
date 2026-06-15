import type { IconifyIcon } from '@iconify/vue/offline';

import { defineComponent, h } from 'vue';

import { addIcon, Icon } from '@iconify/vue/offline';

function createOfflineIconifyIcon(icon: string, component: IconifyIcon) {
  return defineComponent({
    name: `Icon-${icon}`,
    inheritAttrs: false,
    setup(props, { attrs }) {
      /**
       * 实际上包装了一层deafault
       */
      const realIcon = (component as unknown as { default: IconifyIcon })
        ?.default;

      if (!realIcon) {
        return null;
      }

      addIcon(icon, realIcon);
      return () => h(Icon, { icon: realIcon, ...props, ...attrs });
    },
  });
}

export { createOfflineIconifyIcon };
