import { defineComponent, h, isVNode } from 'vue';

/**
 * 渲染 string | 组件 | 渲染函数 | VNode 的通用内容组件，
 * 替换原 `@vben-core/shadcn-ui` 的 VbenRenderContent。
 * 支持 renderBr：把字符串中的 \n 渲染为 <br>。
 */
export default defineComponent({
  name: 'RenderContent',
  props: {
    content: {
      default: '',
      type: [String, Number, Function, Object, Array] as any,
    },
    renderBr: {
      default: false,
      type: Boolean,
    },
  },
  setup(props, { attrs, slots }) {
    return () => {
      const content = props.content as any;
      if (content === undefined || content === null || content === '') {
        return slots.default?.();
      }
      if (typeof content === 'string' || typeof content === 'number') {
        if (props.renderBr && typeof content === 'string') {
          const parts = content.split('\n');
          return parts.flatMap((part, index) =>
            index < parts.length - 1 ? [part, h('br')] : [part],
          );
        }
        return content;
      }
      if (isVNode(content)) {
        return content;
      }
      return h(content, attrs, slots);
    };
  },
});
