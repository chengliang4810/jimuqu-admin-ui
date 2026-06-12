<script lang="ts">
import { cloneVNode, defineComponent, h } from 'vue';

export default defineComponent({
  name: 'VbenSlot',
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () => {
      const children = slots.default?.(attrs) ?? [];
      const child = children[0];
      if (children.length === 1 && child && typeof child.type !== 'symbol') {
        return cloneVNode(child, attrs);
      }

      return h('div', attrs, children);
    };
  },
});
</script>
